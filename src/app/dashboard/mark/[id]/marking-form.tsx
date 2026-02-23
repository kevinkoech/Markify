"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitMarks } from "@/app/actions/marking";

interface Submission {
  id: number;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: string;
  unitId: number;
  traineeId: number;
}

interface Trainee {
  id: number;
  name: string;
  email: string;
}

interface MarkingScheme {
  id: number;
  name: string;
  totalMarks: number;
  schemeData: any;
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
}

interface MarkingFormProps {
  submission: Submission;
  trainee: Trainee | null;
  schemes: MarkingScheme[];
  existingResult: Result | null;
  markerId: number;
}

interface QuestionMark {
  id: number;
  question: string;
  maxMarks: number;
  awardedMarks: number;
  status: "correct" | "wrong" | "blank";
  feedback: string;
}

export function MarkingForm({
  submission,
  trainee,
  schemes,
  existingResult,
  markerId,
}: MarkingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<string>(
    schemes.length > 0 ? schemes[0].id.toString() : ""
  );
  const [feedback, setFeedback] = useState(existingResult?.feedback || "");
  const [metExpectation, setMetExpectation] = useState(existingResult?.metExpectation || false);

  // Initialize question marks from scheme or existing result
  const getInitialQuestionMarks = (): QuestionMark[] => {
    if (existingResult?.questionResults?.questions) {
      return existingResult.questionResults.questions;
    }
    
    const scheme = schemes.find((s) => s.id === parseInt(selectedScheme));
    if (scheme?.schemeData?.questions) {
      return scheme.schemeData.questions.map((q: any, index: number) => ({
        id: q.id || index + 1,
        question: q.question || `Question ${index + 1}`,
        maxMarks: q.maxMarks || 10,
        awardedMarks: 0,
        status: "blank" as const,
        feedback: "",
      }));
    }
    
    // Default 5 questions if no scheme
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      question: `Question ${i + 1}`,
      maxMarks: 20,
      awardedMarks: 0,
      status: "blank" as const,
      feedback: "",
    }));
  };

  const [questionMarks, setQuestionMarks] = useState<QuestionMark[]>(getInitialQuestionMarks);

  // Update questions when scheme changes
  const handleSchemeChange = (schemeId: string) => {
    setSelectedScheme(schemeId);
    const scheme = schemes.find((s) => s.id === parseInt(schemeId));
    if (scheme?.schemeData?.questions) {
      setQuestionMarks(
        scheme.schemeData.questions.map((q: any, index: number) => ({
          id: q.id || index + 1,
          question: q.question || `Question ${index + 1}`,
          maxMarks: q.maxMarks || 10,
          awardedMarks: 0,
          status: "blank" as const,
          feedback: "",
        }))
      );
    }
  };

  const updateQuestionMark = (
    id: number,
    field: keyof QuestionMark,
    value: any
  ) => {
    setQuestionMarks(
      questionMarks.map((q) => {
        if (q.id === id) {
          const updated = { ...q, [field]: value };
          // Auto-set status based on marks
          if (field === "awardedMarks") {
            if (value === 0) updated.status = "wrong";
            else if (value === q.maxMarks) updated.status = "correct";
            else updated.status = "correct";
          }
          return updated;
        }
        return q;
      })
    );
  };

  const setQuestionStatus = (id: number, status: "correct" | "wrong" | "blank") => {
    setQuestionMarks(
      questionMarks.map((q) => {
        if (q.id === id) {
          let awardedMarks = q.awardedMarks;
          if (status === "correct") awardedMarks = q.maxMarks;
          else if (status === "wrong") awardedMarks = 0;
          else if (status === "blank") awardedMarks = 0;
          return { ...q, status, awardedMarks };
        }
        return q;
      })
    );
  };

  const totalMarks = questionMarks.reduce((sum, q) => sum + q.awardedMarks, 0);
  const maxMarks = questionMarks.reduce((sum, q) => sum + q.maxMarks, 0);
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  const isCompetent = percentage >= 50;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("submissionId", submission.id.toString());
      formData.append("traineeId", submission.traineeId.toString());
      formData.append("unitId", submission.unitId.toString());
      formData.append("totalMarks", totalMarks.toString());
      formData.append("maxMarks", maxMarks.toString());
      formData.append("percentage", percentage.toString());
      formData.append("isCompetent", isCompetent.toString());
      formData.append("metExpectation", metExpectation.toString());
      formData.append("feedback", feedback);
      formData.append("questionResults", JSON.stringify({ questions: questionMarks }));
      formData.append("markedBy", markerId.toString());

      const result = await submitMarks(formData);

      if (result.success) {
        router.push("/dashboard/submissions");
        router.refresh();
      } else {
        setError(result.error || "Failed to submit marks");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Scheme Selection */}
      {schemes.length > 0 && (
        <div>
          <label htmlFor="scheme" className="block text-sm font-medium text-gray-700 mb-1">
            Marking Scheme
          </label>
          <select
            id="scheme"
            value={selectedScheme}
            onChange={(e) => handleSchemeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {schemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name} (Total: {scheme.totalMarks} marks)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Question Marks</h3>
        
        {questionMarks.map((q, index) => (
          <div
            key={q.id}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestionMark(q.id, "question", e.target.value)}
                  className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none w-full"
                  placeholder={`Question ${index + 1}`}
                />
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  type="button"
                  onClick={() => setQuestionStatus(q.id, "correct")}
                  className={`w-8 h-8 rounded flex items-center justify-center text-lg ${
                    q.status === "correct"
                      ? "bg-green-100 text-green-600 ring-2 ring-green-500"
                      : "bg-gray-100 text-gray-400 hover:bg-green-50"
                  }`}
                  title="Correct"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionStatus(q.id, "wrong")}
                  className={`w-8 h-8 rounded flex items-center justify-center text-lg ${
                    q.status === "wrong"
                      ? "bg-red-100 text-red-600 ring-2 ring-red-500"
                      : "bg-gray-100 text-gray-400 hover:bg-red-50"
                  }`}
                  title="Wrong"
                >
                  ✗
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionStatus(q.id, "blank")}
                  className={`w-8 h-8 rounded flex items-center justify-center text-lg ${
                    q.status === "blank"
                      ? "bg-yellow-100 text-yellow-600 ring-2 ring-yellow-500"
                      : "bg-gray-100 text-gray-400 hover:bg-yellow-50"
                  }`}
                  title="Blank/No Attempt"
                >
                  ╱
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-500">Marks:</label>
                <input
                  type="number"
                  value={q.awardedMarks}
                  onChange={(e) => updateQuestionMark(q.id, "awardedMarks", parseInt(e.target.value) || 0)}
                  min={0}
                  max={q.maxMarks}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-500">/ {q.maxMarks}</span>
              </div>
            </div>

            <div className="mt-2">
              <input
                type="text"
                value={q.feedback}
                onChange={(e) => updateQuestionMark(q.id, "feedback", e.target.value)}
                placeholder="Optional feedback for this question..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Overall Feedback */}
      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
          Overall Feedback
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Provide overall feedback for the trainee..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Met Expectation */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="metExpectation"
          checked={metExpectation}
          onChange={(e) => setMetExpectation(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="metExpectation" className="ml-2 text-sm text-gray-700">
          Met Expectation (exceptional performance)
        </label>
      </div>

      {/* Score Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalMarks} / {maxMarks}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Percentage</p>
            <p className={`text-2xl font-bold ${isCompetent ? "text-green-600" : "text-red-600"}`}>
              {percentage}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isCompetent
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isCompetent ? "✓ COMPETENT" : "✗ NOT YET COMPETENT"}
            </span>
          </div>
        </div>
      </div>

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
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Marks"}
        </button>
      </div>
    </form>
  );
}
