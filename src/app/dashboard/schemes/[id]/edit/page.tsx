import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { units, markingSchemes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SchemeForm } from "../../new/scheme-form";

export default async function EditSchemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  const { id } = await params;
  const schemeId = parseInt(id);

  if (isNaN(schemeId)) {
    notFound();
  }

  // Get the scheme
  const scheme = await db.query.markingSchemes.findFirst({
    where: eq(markingSchemes.id, schemeId),
  });

  if (!scheme) {
    notFound();
  }

  // Get all units for selection
  const unitsData = await db
    .select({ id: units.id, name: units.name, code: units.code })
    .from(units);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Marking Scheme</h1>
        <p className="text-gray-600">Update marking scheme details</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <SchemeForm units={unitsData} userId={user.id} scheme={scheme} />
      </div>
    </div>
  );
}
