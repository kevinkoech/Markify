"use client";

import { useState } from "react";

interface Result {
  id: number;
  submissionId: number;
  traineeId: number;
  traineeName: string | null;
  traineeEmail: string | null;
  unitId: number;
  unitName: string | null;
  unitCode: string | null;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  isCompetent: boolean;
  metExpectation: boolean;
  markedAt: Date | null;
}

interface Stats {
  totalResults: number;
  competentCount: number;
  notCompetentCount: number;
  averageScore: number;
  metExpectationCount: number;
}

interface UnitPerformance {
  unitId: number;
  unitName: string | null;
  unitCode: string | null;
  totalSubmissions: number;
  averageScore: number;
  competentCount: number;
}

interface Unit {
  id: number;
  name: string;
  code: string;
}

interface ReportsDashboardProps {
  results: Result[];
  stats: Stats;
  unitPerformance: UnitPerformance[];
  units: Unit[];
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function ReportsDashboard({
  results,
  stats,
  unitPerformance,
  units,
}: ReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "results" | "units">("overview");
  const [filterUnit, setFilterUnit] = useState<string>("");

  const filteredResults = filterUnit
    ? results.filter((r) => r.unitId === parseInt(filterUnit))
    : results;

  const exportToCSV = () => {
    const headers = [
      "Trainee Name",
      "Trainee Email",
      "Unit Code",
      "Unit Name",
      "Total Marks",
      "Max Marks",
      "Percentage",
      "Status",
      "Marked Date",
    ];
    
    const rows = filteredResults.map((r) => [
      r.traineeName || "",
      r.traineeEmail || "",
      r.unitCode || "",
      r.unitName || "",
      r.totalMarks.toString(),
      r.maxMarks.toString(),
      `${r.percentage}%`,
      r.isCompetent ? "Competent" : "Not Yet Competent",
      formatDate(r.markedAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marking-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async (type: "overall" | "unit" | "trainee", id?: number) => {
    try {
      let url = `/api/reports/pdf?type=${type}`;
      if (id) {
        url += `&${type === "unit" ? "unitId" : "traineeId"}=${id}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Failed to generate PDF report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Marked</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalResults}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Competent</p>
          <p className="text-2xl font-bold text-green-600">{stats.competentCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Not Yet Competent</p>
          <p className="text-2xl font-bold text-red-600">{stats.notCompetentCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.averageScore}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Met Expectation</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.metExpectationCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "results"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "units"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Unit Performance
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pass Rate Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  {/* Progress circle */}
                  <circle
                    className="text-green-500"
                    strokeWidth="10"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    style={{
                      strokeDasharray: `${(stats.competentCount / stats.totalResults) * 251.2} 251.2`,
                      strokeDashoffset: "62.8",
                      transform: "rotate(-90deg)",
                      transformOrigin: "50% 50%",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {stats.totalResults > 0
                        ? Math.round((stats.competentCount / stats.totalResults) * 100)
                        : 0}
                      %
                    </span>
                    <p className="text-xs text-gray-500">Pass Rate</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Competent ({stats.competentCount})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Not Competent ({stats.notCompetentCount})</span>
              </div>
            </div>
          </div>

          {/* Unit Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Performance</h3>
            {unitPerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available</p>
            ) : (
              <div className="space-y-4">
                {unitPerformance.slice(0, 5).map((unit) => (
                  <div key={unit.unitId} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{unit.unitName}</p>
                      <p className="text-xs text-gray-500">{unit.unitCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Math.round(unit.averageScore)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {unit.totalSubmissions} submissions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className="space-y-4">
          {/* Filters and Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <select
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
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => downloadPDF("overall")}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trainee
                    </th>
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
                      Marked
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.traineeName}</div>
                        <div className="text-xs text-gray-500">{result.traineeEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{result.unitName}</div>
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
            {filteredResults.length === 0 && (
              <div className="px-6 py-4 text-center text-gray-500">
                No results found.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "units" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unitPerformance.map((unit) => (
                  <tr key={unit.unitId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{unit.unitName}</div>
                      <div className="text-xs text-gray-500">{unit.unitCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.totalSubmissions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        unit.averageScore >= 50 ? "text-green-600" : "text-red-600"
                      }`}>
                        {Math.round(unit.averageScore)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.competentCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${
                                unit.totalSubmissions > 0
                                  ? (unit.competentCount / unit.totalSubmissions) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {unit.totalSubmissions > 0
                            ? Math.round((unit.competentCount / unit.totalSubmissions) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unitPerformance.length === 0 && (
            <div className="px-6 py-4 text-center text-gray-500">
              No unit performance data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
