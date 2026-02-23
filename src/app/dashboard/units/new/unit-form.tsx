"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUnit } from "@/app/actions/units";

interface Trainer {
  id: number;
  name: string;
}

interface UnitFormProps {
  trainers: Trainer[];
  unit?: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    department: string | null;
    totalMarks: number | null;
    passingMarks: number | null;
    markingType: string | null;
    trainerId: number | null;
  };
}

export function UnitForm({ trainers, unit }: UnitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await createUnit(formData);

      if (result.success) {
        router.push("/dashboard/units");
        router.refresh();
      } else {
        setError(result.error || "Failed to create unit");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {unit && <input type="hidden" name="unitId" value={unit.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Unit Code *
          </label>
          <input
            type="text"
            id="code"
            name="code"
            defaultValue={unit?.code || ""}
            required
            placeholder="e.g., ENG101"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Unit Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={unit?.name || ""}
            required
            placeholder="e.g., Engineering Mathematics"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={unit?.description || ""}
          rows={3}
          placeholder="Brief description of the unit..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
          Department
        </label>
        <input
          type="text"
          id="department"
          name="department"
          defaultValue={unit?.department || ""}
          placeholder="e.g., Mechanical Engineering"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 mb-1">
            Total Marks
          </label>
          <input
            type="number"
            id="totalMarks"
            name="totalMarks"
            defaultValue={unit?.totalMarks || 100}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="passingMarks" className="block text-sm font-medium text-gray-700 mb-1">
            Passing Marks (50% default)
          </label>
          <input
            type="number"
            id="passingMarks"
            name="passingMarks"
            defaultValue={unit?.passingMarks || 50}
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="markingType" className="block text-sm font-medium text-gray-700 mb-1">
          Marking Type
        </label>
        <select
          id="markingType"
          name="markingType"
          defaultValue={unit?.markingType || "engineering"}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="engineering">Engineering (Technical accuracy prioritized)</option>
          <option value="theoretical">Theoretical (Conceptual understanding prioritized)</option>
          <option value="mixed">Mixed (Weighted scoring)</option>
        </select>
      </div>

      <div>
        <label htmlFor="trainerId" className="block text-sm font-medium text-gray-700 mb-1">
          Assigned Trainer
        </label>
        <select
          id="trainerId"
          name="trainerId"
          defaultValue={unit?.trainerId || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Select a trainer...</option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : unit ? "Update Unit" : "Create Unit"}
        </button>
      </div>
    </form>
  );
}
