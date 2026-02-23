"use client";

interface Result {
  id: number;
  submissionId: number;
  unitId: number;
  unitName: string | null;
  unitCode: string | null;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  isCompetent: boolean;
  metExpectation: boolean;
  feedback: string | null;
  markedAt: Date | null;
}

interface EnrolledUnit {
  id: number;
  name: string;
  code: string;
  totalMarks: number | null;
  passingMarks: number | null;
}

interface Stats {
  totalSubmissions: number;
  competentCount: number;
  averageScore: number;
  totalUnits: number;
  completedUnits: number;
}

interface ProgressReportProps {
  results: Result[];
  enrolledUnits: EnrolledUnit[];
  stats: Stats;
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function ProgressReport({ results, enrolledUnits, stats }: ProgressReportProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Competent</p>
              <p className="text-3xl font-bold text-green-600">{stats.competentCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Units Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedUnits}/{stats.totalUnits}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Competency Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalSubmissions > 0
                    ? Math.round((stats.competentCount / stats.totalSubmissions) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalSubmissions > 0
                        ? (stats.competentCount / stats.totalSubmissions) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Competent</span>
                </div>
                <span className="font-medium text-gray-900">{stats.competentCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Not Yet Competent</span>
                </div>
                <span className="font-medium text-gray-900">
                  {stats.totalSubmissions - stats.competentCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Units */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Units</h3>
          {enrolledUnits.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Not enrolled in any units yet.</p>
          ) : (
            <div className="space-y-3">
              {enrolledUnits.map((unit) => {
                const unitResults = results.filter((r) => r.unitId === unit.id);
                const bestResult = unitResults.sort((a, b) => b.percentage - a.percentage)[0];
                const isCompleted = unitResults.some((r) => r.isCompetent);

                return (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{unit.name}</p>
                      <p className="text-xs text-gray-500">{unit.code}</p>
                    </div>
                    <div className="text-right">
                      {bestResult ? (
                        <>
                          <p className={`text-sm font-medium ${isCompleted ? "text-green-600" : "text-red-600"}`}>
                            {bestResult.percentage}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {isCompleted ? "Competent" : "Not Yet Competent"}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">Not submitted</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Results History</h3>
        </div>
        {results.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No results yet. Submit an assignment to see your results here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.unitName}</div>
                      <div className="text-xs text-gray-500">{result.unitCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.percentage}%</div>
                      <div className="text-xs text-gray-500">
                        {result.totalMarks}/{result.maxMarks}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.isCompetent
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {result.isCompetent ? "Competent" : "Not Yet Competent"}
                      </span>
                      {result.metExpectation && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          ★ Met Expectation
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(result.markedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
