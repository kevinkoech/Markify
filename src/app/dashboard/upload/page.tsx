import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { units, enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UploadForm } from "./upload-form";

export default async function UploadPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get units available for the trainee
  let availableUnits;
  if (user.role === "trainee") {
    // Get units the trainee is enrolled in
    availableUnits = await db
      .select({ id: units.id, name: units.name, code: units.code })
      .from(units)
      .innerJoin(enrollments, eq(enrollments.unitId, units.id))
      .where(eq(enrollments.traineeId, user.id));
  } else {
    // Trainers and admins can see all units
    availableUnits = await db
      .select({ id: units.id, name: units.name, code: units.code })
      .from(units);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Assignment</h1>
        <p className="text-gray-600">Upload your assignment for automated marking</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <UploadForm units={availableUnits} />
      </div>

      <div className="mt-6 bg-blue-50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Supported File Types</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Microsoft Word (.doc, .docx)</li>
          <li>• Microsoft PowerPoint (.ppt, .pptx)</li>
          <li>• Adobe PDF (.pdf)</li>
          <li>• Scanned documents (OCR enabled)</li>
        </ul>
      </div>
    </div>
  );
}
