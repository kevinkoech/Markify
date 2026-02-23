"use client";

import { useState } from "react";
import Link from "next/link";

interface Unit {
  id: number;
  code: string;
  name: string;
  description: string | null;
  department: string | null;
  totalMarks: number | null;
  passingMarks: number | null;
  markingType: string | null;
  trainerId: number | null;
  trainerName: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  schemesCount: number;
}

interface Trainer {
  id: number;
  name: string;
}

interface UnitsListProps {
  units: Unit[];
  trainers: Trainer[];
  userRole: string;
}

const markingTypeLabels: Record<string, string> = {
  engineering: "Engineering (Technical)",
  theoretical: "Theoretical (Conceptual)",
  mixed: "Mixed (Weighted)",
};

export function UnitsList({ units, trainers, userRole }: UnitsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUnits = units.filter((unit) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      unit.name.toLowerCase().includes(searchLower) ||
      unit.code.toLowerCase().includes(searchLower) ||
      (unit.department && unit.department.toLowerCase().includes(searchLower))
    );
  });

  if (units.length === 0) {
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No units</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new unit.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/units/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Add Unit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search units by name, code, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUnits.map((unit) => (
          <div
            key={unit.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                    {unit.code}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{unit.name}</h3>
                </div>
                {!unit.isActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    Inactive
                  </span>
                )}
              </div>
              
              {unit.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{unit.description}</p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {unit.department || "No department"}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {unit.trainerName || "Unassigned"}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {unit.schemesCount} marking scheme{unit.schemesCount !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Pass: {unit.passingMarks}/{unit.totalMarks} ({unit.totalMarks ? Math.round((unit.passingMarks || 0) / unit.totalMarks * 100) : 0}%)
                  </span>
                  <span className="text-gray-500">
                    {markingTypeLabels[unit.markingType || "engineering"]?.split(" ")[0] || "Engineering"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
              <Link
                href={`/dashboard/units/${unit.id}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View Details
              </Link>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/units/${unit.id}/edit`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Edit
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href={`/dashboard/schemes?unitId=${unit.id}`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Schemes
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUnits.length === 0 && units.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No units match your search.
        </div>
      )}
    </div>
  );
}