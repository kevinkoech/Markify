"use client";

import { useState } from "react";
import Link from "next/link";

interface Submission {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  uploadedAt: Date | null;
  markedAt: Date | null;
  unitId: number;
  unitName: string | null;
  unitCode: string | null;
  traineeId?: number;
  traineeName?: string | null;
  traineeEmail?: string | null;
  totalMarks: number | null;
  maxMarks: number | null;
  percentage: number | null;
  isCompetent: boolean | null;
  feedback: string | null;
}

interface Unit {
  id: number;
  name: string;
  code: string;
}

interface SubmissionsListProps {
  submissions: Submission[];
  units: Unit[];
  userRole: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  uploaded: { label: "Uploaded", color: "bg-blue-100 text-blue-700", icon: "📤" },
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700", icon: "⏳" },
  marking: { label: "Marking", color: "bg-purple-100 text-purple-700", icon: "✍️" },
  marked: { label: "Marked", color: "bg-green-100 text-green-700", icon: "✅" },
  available: { label: "Available", color: "bg-green-100 text-green-700", icon: "📥" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function SubmissionsList({ submissions, units, userRole }: SubmissionsListProps) {
  const [filterUnit, setFilterUnit] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const filteredSubmissions = submissions.filter((sub) => {
    if (filterUnit && sub.unitId !== parseInt(filterUnit)) return false;
    if (filterStatus && sub.status !== filterStatus) return false;
    return true;
  });

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
        <p className="mt-1 text-sm text-gray-500">
          {userRole === "trainee"
            ? "You haven't uploaded any assignments yet."
            : "No submissions have been uploaded yet."}
        </p>
        {userRole === "trainee" && (
          <div className="mt-6">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Upload Assignment
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="filter-unit" className="block text-xs font-medium text-gray-500 mb-1">
              Filter by Unit
            </label>
            <select
              id="filter-unit"
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Units</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500 mb-1">
              Filter by Status
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                {userRole !== "trainee" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => {
                const status = statusConfig[submission.status] || statusConfig.uploaded;
                return (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{submission.fileName}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(submission.fileSize)}</div>
                        </div>
                      </div>
                    </td>
                    {userRole !== "trainee" && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.traineeName}</div>
                        <div className="text-xs text-gray-500">{submission.traineeEmail}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{submission.unitName || "-"}</div>
                      <div className="text-xs text-gray-500">{submission.unitCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.percentage !== null ? (
                        <div>
                          <div className={`text-sm font-medium ${submission.isCompetent ? "text-green-600" : "text-red-600"}`}>
                            {submission.percentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {submission.totalMarks}/{submission.maxMarks}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(submission.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/submissions/${submission.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        View
                      </Link>
                      {userRole !== "trainee" && submission.status === "waiting" && (
                        <Link
                          href={`/dashboard/mark/${submission.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Mark
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSubmissions.length === 0 && submissions.length > 0 && (
          <div className="px-6 py-4 text-center text-gray-500">
            No submissions match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
