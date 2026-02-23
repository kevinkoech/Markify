import Link from "next/link";

interface Submission {
  id: number;
  fileName: string;
  status: string;
  uploadedAt: Date | null;
  unitName: string | null;
  traineeName?: string | null;
  score: number | null;
}

interface RecentSubmissionsProps {
  submissions: Submission[];
  userRole: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  uploaded: { label: "Uploaded", color: "bg-blue-100 text-blue-700", icon: "📤" },
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700", icon: "⏳" },
  marking: { label: "Marking", color: "bg-purple-100 text-purple-700", icon: "✍️" },
  marked: { label: "Marked", color: "bg-green-100 text-green-700", icon: "✅" },
  available: { label: "Available", color: "bg-green-100 text-green-700", icon: "📥" },
};

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function RecentSubmissions({ submissions, userRole }: RecentSubmissionsProps) {
  if (submissions.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
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
            ? "Upload your first assignment to get started."
            : "No submissions have been uploaded yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {submissions.map((submission) => {
        const status = statusConfig[submission.status] || statusConfig.uploaded;
        return (
          <div key={submission.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{submission.fileName}</p>
                <p className="text-xs text-gray-500">
                  {submission.unitName || "Unknown Unit"}
                  {submission.traineeName && ` • ${submission.traineeName}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                  {status.icon} {status.label}
                </span>
                {submission.score !== null && (
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {submission.score}%
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(submission.uploadedAt)}
              </div>
            </div>
          </div>
        );
      })}
      <div className="px-6 py-3 bg-gray-50">
        <Link
          href="/dashboard/submissions"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all submissions →
        </Link>
      </div>
    </div>
  );
}
