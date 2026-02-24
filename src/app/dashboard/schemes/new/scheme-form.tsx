"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMarkingScheme, updateMarkingScheme } from "@/app/actions/schemes";

interface Unit {
  id: number;
  name: string;
  code: string;
}

interface SchemeFormProps {
  units: Unit[];
  userId: number;
  scheme?: {
    id: number;
    name: string;
    description: string | null;
    unitId: number;
    markingMode: string;
    version: string;
    totalMarks: number;
    schemeData: any;
  };
}

interface Question {
  id: number;
  type: "numerical" | "essay" | "multiple_choice";
  question: string;
  maxMarks: number;
  correctAnswer?: string;
  tolerance?: number;
  keywords?: string[];
  keyPoints?: { point: string; marks: number }[];
}

export function SchemeForm({ units, userId, scheme }: SchemeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize from existing scheme or defaults
  const initialQuestions = scheme?.schemeData?.questions || [
    { id: 1, type: "numerical" as const, question: "", maxMarks: 10, correctAnswer: "", tolerance: 0 },
  ];
  
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedUnit, setSelectedUnit] = useState<string>(scheme?.unitId?.toString() || "");
  const [markingMode, setMarkingMode] = useState<string>(scheme?.markingMode || "trainer_points");

  function addQuestion() {
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    setQuestions([
      ...questions,
      { id: newId, type: "numerical", question: "", maxMarks: 10, correctAnswer: "", tolerance: 0 },
    ]);
  }

  function removeQuestion(id: number) {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  }

  function updateQuestion(id: number, field: keyof Question, value: any) {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      // Add questions as JSON
      formData.set("questions", JSON.stringify(questions));
      
      const result = scheme 
        ? await updateMarkingScheme(formData)
        : await createMarkingScheme(formData);

      if (result.success) {
        router.push("/dashboard/schemes");
        router.refresh();
      } else {
        setError(result.error || `Failed to ${scheme ? 'update' : 'create'} marking scheme`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Hidden field for scheme ID when editing */}
      {scheme && <input type="hidden" name="schemeId" value={scheme.id} />}

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Scheme Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={scheme?.name || ""}
            placeholder="e.g., Midterm Exam Scheme"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">
            Unit / Subject *
          </label>
          <select
            id="unitId"
            name="unitId"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select a unit...</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} - {unit.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={scheme?.description || ""}
          placeholder="Brief description of this marking scheme..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="markingMode" className="block text-sm font-medium text-gray-700 mb-1">
            Marking Mode
          </label>
          <select
            id="markingMode"
            name="markingMode"
            value={markingMode}
            onChange={(e) => setMarkingMode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="trainer_points">Trainer Points System</option>
            <option value="ai_reference">AI Reference Mode</option>
            <option value="trainer_upload">Trainer Upload Mode</option>
          </select>
        </div>
        <div>
          <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
            Version
          </label>
          <input
            type="text"
            id="version"
            name="version"
            defaultValue={scheme?.version || "1.0"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Questions Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Questions</h3>
            <p className="text-sm text-gray-500">Define questions and their marking criteria</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Total Marks:</span>
            <span className="ml-2 text-lg font-bold text-indigo-600">{totalMarks}</span>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Question {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  disabled={questions.length === 1}
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(question.id, "type", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="numerical">Numerical</option>
                    <option value="essay">Essay</option>
                    <option value="multiple_choice">Multiple Choice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    value={question.maxMarks}
                    onChange={(e) => updateQuestion(question.id, "maxMarks", parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {question.type === "numerical" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tolerance (±)
                    </label>
                    <input
                      type="number"
                      value={question.tolerance || 0}
                      onChange={(e) => updateQuestion(question.id, "tolerance", parseFloat(e.target.value) || 0)}
                      step="0.1"
                      min={0}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Question Text
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                  placeholder="Enter the question..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {question.type === "numerical" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    value={question.correctAnswer || ""}
                    onChange={(e) => updateQuestion(question.id, "correctAnswer", e.target.value)}
                    placeholder="e.g., 42.5"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {question.type === "essay" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Key Points (one per line, format: point|marks)
                  </label>
                  <textarea
                    value={question.keyPoints?.map((kp) => `${kp.point}|${kp.marks}`).join("\n") || ""}
                    onChange={(e) => {
                      const points = e.target.value.split("\n").map((line) => {
                        const [point, marks] = line.split("|");
                        return { point: point || "", marks: parseInt(marks) || 0 };
                      });
                      updateQuestion(question.id, "keyPoints", points);
                    }}
                    placeholder="Understanding of concept|5&#10;Application example|5&#10;Technical accuracy|10"
                    rows={3}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 flex items-center text-sm text-indigo-600 hover:text-indigo-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>
      </div>

      {/* Hidden fields */}
      <input type="hidden" name="totalMarks" value={totalMarks} />
      <input type="hidden" name="createdBy" value={userId} />

      {/* Actions */}
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
          disabled={loading || !selectedUnit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (scheme ? "Updating..." : "Creating...") : (scheme ? "Update Scheme" : "Create Scheme")}
        </button>
      </div>
    </form>
  );
}
