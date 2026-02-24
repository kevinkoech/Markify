import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UnitForm } from "../../new/unit-form";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    redirect("/login");
  }

  const { id } = await params;
  const unitId = parseInt(id);

  if (isNaN(unitId)) {
    notFound();
  }

  // Get the unit
  const unit = await db.query.units.findFirst({
    where: eq(units.id, unitId),
  });

  if (!unit) {
    notFound();
  }

  // Get all trainers for assignment
  const trainers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "trainer"));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Unit</h1>
        <p className="text-gray-600">Update unit/subject information</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <UnitForm trainers={trainers} unit={unit} />
      </div>
    </div>
  );
}
