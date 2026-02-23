"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadSubmission } from "@/app/actions/submissions";

interface Unit {
  id: number;
  name: string;
  code: string;
}

interface UploadFormProps {
  units: Unit[];
}

export function UploadForm({ units }: UploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a Word, PowerPoint, or PDF file.");
      return;
    }

    if (file.size > maxFileSize) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    if (!selectedUnit) {
      setError("Please select a unit/subject.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("unitId", selectedUnit);

      const result = await uploadSubmission(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/submissions");
        }, 2000);
      } else {
        setError(result.error || "Upload failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Upload Successful!</h3>
        <p className="text-gray-600 mt-1">Your assignment has been submitted for marking.</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to submissions...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Unit Selection */}
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
          Unit / Subject
        </label>
        <select
          id="unit"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        >
          <option value="">Select a unit...</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.code} - {unit.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assignment File
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            selectedFile
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx,.ppt,.pptx,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Word, PowerPoint, or PDF up to 50MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={uploading || !selectedFile || !selectedUnit}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          "Submit Assignment"
        )}
      </button>
    </form>
  );
}
