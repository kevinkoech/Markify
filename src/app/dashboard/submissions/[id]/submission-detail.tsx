"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Submission {
  id: number;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: string;
  uploadedAt: Date | null;
  markedAt: Date | null;
  traineeId: number;
  unitId: number;
}

interface Unit {
  id: number;
  name: string;
  code: string;
  totalMarks: number | null;
  passingMarks: number | null;
}

interface Trainee {
  id: number;
  name: string;
  email: string;
}

interface Result {
  id: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  isCompetent: boolean;
  metExpectation: boolean;
  feedback: string | null;
  questionResults: any;
  markedAt: Date | null;
}

interface SubmissionDetailProps {
  submission: Submission;
  unit: Unit | null;
  trainee: Trainee | null;
  result: Result | null;
  userRole: string;
  currentUserId: number;
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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function SubmissionDetail({
  submission,
  unit,
  trainee,
  result,
  userRole,
  currentUserId,
}: SubmissionDetailProps) {
  const router = useRouter();
  const status = statusConfig[submission.status] || statusConfig.uploaded;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/submissions"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Submissions
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{submission.originalFileName}</h1>
            <p className="text-gray-600 mt-1">
              {unit?.code} - {unit?.name}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.icon} {status.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">File Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.originalFileName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">File Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatFileSize(submission.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">File Type</dt>
                <dd className="mt-1 text-sm text-gray-900 uppercase">{submission.fileType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(submission.uploadedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Marking Results</h2>
              
              {/* Score Display */}
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg mb-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${result.isCompetent ? "text-green-600" : "text-red-600"}`}>
                    {result.percentage}%
                  </div>
                  <div className="mt-2 text-lg text-gray-600">
                    {result.totalMarks} / {result.maxMarks} marks
                  </div>
                  <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    result.isCompetent 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {result.isCompetent ? "✓ COMPETENT" : "✗ NOT YET COMPETENT"}
                  </div>
                  {result.metExpectation && (
                    <div className="mt-2 text-sm text-indigo-600 font-medium">
                      ★ Met Expectation
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback */}
              {result.feedback && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Feedback</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {result.feedback}
                  </div>
                </div>
              )}

              {/* Marked Date */}
              <div className="mt-4 text-sm text-gray-500">
                Marked on: {formatDate(result.markedAt)}
              </div>
            </div>
          )}

          {/* Actions */}
          {userRole !== "trainee" && submission.status === "waiting" && (
            <div className="flex gap-4">
              <Link
                href={`/dashboard/mark/${submission.id}`}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark Submission
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trainee Info */}
          {trainee && userRole !== "trainee" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trainee</h2>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {trainee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{trainee.name}</p>
                  <p className="text-xs text-gray-500">{trainee.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Unit Info */}
          {unit && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{unit.code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{unit.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Marks</dt>
                  <dd className="mt-1 text-sm text-gray-900">{unit.totalMarks || 100}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Passing Marks</dt>
                  <dd className="mt-1 text-sm text-gray-900">{unit.passingMarks || 50} ({unit.totalMarks ? Math.round((unit.passingMarks || 50) / unit.totalMarks * 100) : 50}%)</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">📤</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Uploaded</p>
                  <p className="text-xs text-gray-500">{formatDate(submission.uploadedAt)}</p>
                </div>
              </div>
              {submission.status !== "uploaded" && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">⏳</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">In Queue</p>
                    <p className="text-xs text-gray-500">Waiting for marking</p>
                  </div>
                </div>
              )}
              {(submission.status === "marked" || submission.status === "available") && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Marked</p>
                    <p className="text-xs text-gray-500">{formatDate(submission.markedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}