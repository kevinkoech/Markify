"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getUserPoints,
  getUserReferralCode,
  getReferralHistory,
  getPointsTransactions,
  getRedemptionOptions,
  getUserRedemptions,
  requestRedemption,
} from "@/app/actions/points";

interface PointsData {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
}

interface ReferralCode {
  code: string;
  isActive: boolean;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: Date | null;
}

interface Referral {
  referral: {
    id: number;
    bonusPoints: number;
    status: string;
    createdAt: Date | null;
  };
  referredUser: {
    name: string;
    email: string;
  } | null;
}

interface RedemptionOption {
  id: number;
  name: string;
  description: string | null;
  type: string;
  pointsCost: number;
  value: string | null;
}

interface UserRedemption {
  redemption: {
    id: number;
    pointsSpent: number;
    status: string;
    requestedAt: Date | null;
    reviewNotes: string | null;
  };
  option: {
    name: string;
    type: string;
  } | null;
}

export default function RewardsPage() {
  const router = useRouter();
  const [points, setPoints] = useState<PointsData | null>(null);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [options, setOptions] = useState<RedemptionOption[]>([]);
  const [redemptions, setUserRedemptions] = useState<UserRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "redeem" | "history" | "referrals">("overview");
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pointsData, codeData, transactionsData, referralsData, optionsData, redemptionsData] = await Promise.all([
      getUserPoints(),
      getUserReferralCode(),
      getPointsTransactions(),
      getReferralHistory(),
      getRedemptionOptions(),
      getUserRedemptions(),
    ]);
    setPoints(pointsData);
    setReferralCode(codeData);
    setTransactions(transactionsData);
    setReferrals(referralsData as Referral[]);
    setOptions(optionsData);
    setUserRedemptions(redemptionsData as UserRedemption[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      setLoading(true);
      const [pointsData, codeData, transactionsData, referralsData, optionsData, redemptionsData] = await Promise.all([
        getUserPoints(),
        getUserReferralCode(),
        getPointsTransactions(),
        getReferralHistory(),
        getRedemptionOptions(),
        getUserRedemptions(),
      ]);
      if (mounted) {
        setPoints(pointsData);
        setReferralCode(codeData);
        setTransactions(transactionsData);
        setReferrals(referralsData as Referral[]);
        setOptions(optionsData);
        setUserRedemptions(redemptionsData as UserRedemption[]);
        setLoading(false);
      }
    }
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function handleRedeem(optionId: number) {
    const confirmed = confirm("Are you sure you want to redeem this reward?");
    if (!confirmed) return;

    const result = await requestRedemption(optionId);
    if (result.success) {
      alert("Redemption request submitted! An admin will review your request.");
      loadData();
    } else {
      alert(result.error || "Failed to request redemption");
    }
  }

  function copyReferralCode() {
    if (referralCode?.code) {
      const url = `${window.location.origin}/signup?ref=${referralCode.code}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatDate(dateStr: Date | null | string) {
    if (!dateStr) return "N/A";
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Rewards & Points</h1>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          <span className="text-sm">Balance: </span>
          <span className="text-xl font-bold">{points?.balance || 0}</span>
          <span className="text-sm"> points</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "redeem", label: "Redeem Points" },
            { id: "history", label: "History" },
            { id: "referrals", label: "Referrals" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Points Balance</h3>
            <p className="text-3xl font-bold text-indigo-600">{points?.balance || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Available to redeem</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Earned</h3>
            <p className="text-3xl font-bold text-green-600">{points?.totalEarned || 0}</p>
            <p className="text-sm text-gray-500 mt-1">All time earnings</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Redeemed</h3>
            <p className="text-3xl font-bold text-orange-600">{points?.totalRedeemed || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Points spent</p>
          </div>
        </div>
      )}

      {/* Redeem Tab */}
      {activeTab === "redeem" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option) => (
            <div key={option.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">{option.name}</h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                  {option.type.replace("_", " ")}
                </span>
              </div>
              {option.description && (
                <p className="text-sm text-gray-500 mb-4">{option.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-indigo-600">{option.pointsCost} pts</span>
                <button
                  onClick={() => handleRedeem(option.id)}
                  disabled={(points?.balance || 0) < option.pointsCost}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    (points?.balance || 0) >= option.pointsCost
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
              </div>
            </div>
          ))}
          {options.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No redemption options available
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Points Transactions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Points Transactions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No transactions yet
                </div>
              )}
            </div>
          </div>

          {/* Redemption History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Redemption History</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {redemptions.map((r) => (
                <div key={r.redemption.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.option?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{formatDate(r.redemption.requestedAt)}</p>
                    {r.redemption.reviewNotes && (
                      <p className="text-xs text-gray-400 mt-1">{r.redemption.reviewNotes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(r.redemption.status)}`}>
                      {r.redemption.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">-{r.redemption.pointsSpent} pts</p>
                  </div>
                </div>
              ))}
              {redemptions.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No redemptions yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          {/* Referral Code */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Referral Link</h3>
            {referralCode ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <code className="text-sm text-gray-700">
                    {typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${referralCode.code}` : ""}
                  </code>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            ) : (
              <p className="text-gray-500">No referral code available</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Share your referral link! When someone signs up using your link, both of you get 100 bonus points!
            </p>
          </div>

          {/* Referral History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">People You&apos;ve Referred</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {referrals.map((r) => (
                <div key={r.referral.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.referredUser?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{r.referredUser?.email}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.referral.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(r.referral.status)}`}>
                      {r.referral.status}
                    </span>
                    <p className="text-sm font-medium text-green-600 mt-1">+{r.referral.bonusPoints} pts</p>
                  </div>
                </div>
              ))}
              {referrals.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No referrals yet. Share your link to earn bonus points!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
