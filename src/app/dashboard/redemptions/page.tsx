"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllRedemptions,
  approveRedemption,
  rejectRedemption,
  fulfillRedemption,
  getRedemptionOptions,
  addRedemptionOption,
  toggleRedemptionOption,
} from "@/app/actions/points";

interface Redemption {
  redemption: {
    id: number;
    pointsSpent: number;
    status: string;
    requestedAt: Date | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    fulfilledAt: Date | null;
  };
  user: {
    id: number;
    name: string;
    email: string;
    department: string | null;
  } | null;
  option: {
    id: number;
    name: string;
    type: string;
    value: string | null;
  } | null;
}

interface RedemptionOption {
  id: number;
  name: string;
  description: string | null;
  type: string;
  pointsCost: number;
  value: string | null;
  isActive: boolean;
}

export default function RedemptionsAdminPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [options, setOptions] = useState<RedemptionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "options">("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOption, setNewOption] = useState({
    name: "",
    description: "",
    type: "airtime",
    pointsCost: "",
    value: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [redemptionsData, optionsData] = await Promise.all([
      getAllRedemptions(),
      getRedemptionOptions(),
    ]);
    setRedemptions(redemptionsData as Redemption[]);
    setOptions(optionsData as RedemptionOption[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      setLoading(true);
      const [redemptionsData, optionsData] = await Promise.all([
        getAllRedemptions(),
        getRedemptionOptions(),
      ]);
      if (mounted) {
        setRedemptions(redemptionsData as Redemption[]);
        setOptions(optionsData as RedemptionOption[]);
        setLoading(false);
      }
    }
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function handleApprove(id: number) {
    const confirmed = confirm("Approve this redemption request?");
    if (!confirmed) return;

    const result = await approveRedemption(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "Failed to approve");
    }
  }

  async function handleReject(id: number) {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    const result = await rejectRedemption(id, rejectReason);
    if (result.success) {
      setRejectingId(null);
      setRejectReason("");
      loadData();
    } else {
      alert(result.error || "Failed to reject");
    }
  }

  async function handleFulfill(id: number) {
    const confirmed = confirm("Mark this redemption as fulfilled?");
    if (!confirmed) return;

    const result = await fulfillRedemption(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "Failed to mark as fulfilled");
    }
  }

  async function handleToggleOption(id: number) {
    const result = await toggleRedemptionOption(id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "Failed to toggle option");
    }
  }

  async function handleAddOption(formData: FormData) {
    const result = await addRedemptionOption(formData);
    if (result.success) {
      setShowAddOption(false);
      setNewOption({ name: "", description: "", type: "airtime", pointsCost: "", value: "" });
      loadData();
    } else {
      alert(result.error || "Failed to add option");
    }
  }

  function formatDate(dateStr: Date | null | string) {
    if (!dateStr) return "N/A";
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "fulfilled":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  const pendingRedemptions = redemptions.filter((r) => r.redemption.status === "pending");
  const approvedRedemptions = redemptions.filter((r) => r.redemption.status === "approved");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Redemptions Management</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending ({pendingRedemptions.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All Redemptions
          </button>
          <button
            onClick={() => setActiveTab("options")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "options"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Redemption Options
          </button>
        </nav>
      </div>

      {/* Pending Tab */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {pendingRedemptions.map((r) => (
              <div key={r.redemption.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{r.option?.name || "Unknown"}</h3>
                    <p className="text-sm text-gray-500">
                      {r.option?.type.replace("_", " ")} • {r.option?.value && `Value: ${r.option.value}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(r.redemption.status)}`}>
                    {r.redemption.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Requested by</p>
                    <p className="text-sm font-medium">{r.user?.name}</p>
                    <p className="text-xs text-gray-500">{r.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Points Spent</p>
                    <p className="text-lg font-bold text-indigo-600">{r.redemption.pointsSpent}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Requested at</p>
                  <p className="text-sm">{formatDate(r.redemption.requestedAt)}</p>
                </div>
                {rejectingId === r.redemption.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(r.redemption.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(r.redemption.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(r.redemption.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {pendingRedemptions.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No pending redemption requests
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Redemptions Tab */}
      {activeTab === "all" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {redemptions.map((r) => (
                <tr key={r.redemption.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{r.user?.name}</div>
                    <div className="text-xs text-gray-500">{r.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{r.option?.name}</div>
                    <div className="text-xs text-gray-500">{r.option?.type.replace("_", " ")}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {r.redemption.pointsSpent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(r.redemption.status)}`}>
                      {r.redemption.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(r.redemption.requestedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {r.redemption.status === "approved" && (
                      <button
                        onClick={() => handleFulfill(r.redemption.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                    {r.redemption.reviewNotes && (
                      <span className="text-gray-500 text-xs">{r.redemption.reviewNotes}</span>
                    )}
                  </td>
                </tr>
              ))}
              {redemptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No redemptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Options Tab */}
      {activeTab === "options" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddOption(!showAddOption)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              {showAddOption ? "Cancel" : "Add New Option"}
            </button>
          </div>

          {showAddOption && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Redemption Option</h3>
              <form action={handleAddOption} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newOption.name}
                      onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={newOption.type}
                      onChange={(e) => setNewOption({ ...newOption, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="airtime">Airtime</option>
                      <option value="data_bundle">Data Bundle</option>
                      <option value="gift_card">Gift Card</option>
                      <option value="voucher">Voucher</option>
                      <option value="premium_feature">Premium Feature</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points Cost</label>
                    <input
                      type="number"
                      name="pointsCost"
                      value={newOption.pointsCost}
                      onChange={(e) => setNewOption({ ...newOption, pointsCost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="text"
                      name="value"
                      value={newOption.value}
                      onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 100, 1GB"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={newOption.description}
                    onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                >
                  Add Option
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {options.map((option) => (
                  <tr key={option.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{option.name}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500">{option.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {option.pointsCost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.value || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded ${
                        option.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {option.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleOption(option.id)}
                        className={`${
                          option.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"
                        }`}
                      >
                        {option.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
                {options.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No redemption options found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
