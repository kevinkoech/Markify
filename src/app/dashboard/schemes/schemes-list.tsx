"use client";

import { useState } from "react";
import Link from "next/link";

interface Scheme {
  id: number;
  name: string;
  description: string | null;
  version: string;
  totalMarks: number;
  markingMode: string;
  isActive: boolean | null;
  createdAt: Date | null;
  unitId: number;
  unitName: string | null;
  unitCode: string | null;
  createdByName: string | null;
}

interface Unit {
  id: number;
  name: string;
  code: string;
}

interface SchemesListProps {
  schemes: Scheme[];
  units: Unit[];
  filterUnitId?: number;
}

const markingModeLabels: Record<string, { label: string; color: string }> = {
  ai_reference: { label: "AI Reference", color: "bg-purple-100 text-purple-700" },
  trainer_upload: { label: "Trainer Upload", color: "bg-blue-100 text-blue-700" },
  trainer_points: { label: "Trainer Points", color: "bg-green-100 text-green-700" },
};

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function SchemesList({ schemes, units, filterUnitId }: SchemesListProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>(filterUnitId?.toString() || "");

  const filteredSchemes = selectedUnit
    ? schemes.filter((s) => s.unitId === parseInt(selectedUnit))
    : schemes;

  if (schemes.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No marking schemes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create a marking scheme to enable automated assessment.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/schemes/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Add Marking Scheme
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="filter-unit" className="text-sm font-medium text-gray-700">
            Filter by Unit:
          </label>
          <select
            id="filter-unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
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
      </div>

      {/* Schemes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheme Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchemes.map((scheme) => {
                const mode = markingModeLabels[scheme.markingMode] || markingModeLabels.trainer_points;
                return (
                  <tr key={scheme.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{scheme.name}</div>
                        <div className="text-xs text-gray-500">v{scheme.version}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{scheme.unitName || "-"}</div>
                      <div className="text-xs text-gray-500">{scheme.unitCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mode.color}`}>
                        {mode.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scheme.totalMarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scheme.createdByName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        scheme.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {scheme.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/schemes/${scheme.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/schemes/${scheme.id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSchemes.length === 0 && schemes.length > 0 && (
          <div className="px-6 py-4 text-center text-gray-500">
            No schemes match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}