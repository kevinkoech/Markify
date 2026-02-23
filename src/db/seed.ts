import { db } from "./index";
import { users, units, markingSchemes, enrollments } from "./schema";
import { hashPassword } from "@/lib/auth";

async function seed() {
  console.log("Seeding database...");

  // Create demo users
  const adminPassword = await hashPassword("admin123");
  const trainerPassword = await hashPassword("trainer123");
  const traineePassword = await hashPassword("trainee123");

  const [admin] = await db.insert(users).values({
    email: "admin@demo.com",
    passwordHash: adminPassword,
    name: "Admin User",
    role: "admin",
    department: "System Administration",
  }).returning();

  const [trainer] = await db.insert(users).values({
    email: "trainer@demo.com",
    passwordHash: trainerPassword,
    name: "John Trainer",
    role: "trainer",
    department: "Mechanical Engineering",
  }).returning();

  const [trainee] = await db.insert(users).values({
    email: "trainee@demo.com",
    passwordHash: traineePassword,
    name: "Jane Trainee",
    role: "trainee",
    department: "Mechanical Engineering",
  }).returning();

  console.log("Created demo users");

  // Create demo units
  const [unit1] = await db.insert(units).values({
    code: "ENG101",
    name: "Engineering Mathematics",
    description: "Fundamental mathematics for engineering applications",
    department: "Mechanical Engineering",
    totalMarks: 100,
    passingMarks: 50,
    markingType: "engineering",
    trainerId: trainer.id,
  }).returning();

  const [unit2] = await db.insert(units).values({
    code: "ENG102",
    name: "Engineering Drawing",
    description: "Technical drawing and CAD fundamentals",
    department: "Mechanical Engineering",
    totalMarks: 100,
    passingMarks: 50,
    markingType: "engineering",
    trainerId: trainer.id,
  }).returning();

  const [unit3] = await db.insert(units).values({
    code: "ENG103",
    name: "Materials Science",
    description: "Properties and applications of engineering materials",
    department: "Mechanical Engineering",
    totalMarks: 100,
    passingMarks: 50,
    markingType: "mixed",
    trainerId: trainer.id,
  }).returning();

  console.log("Created demo units");

  // Create demo marking schemes
  await db.insert(markingSchemes).values({
    unitId: unit1.id,
    name: "Midterm Exam Scheme",
    description: "Marking scheme for midterm examination",
    version: "1.0",
    totalMarks: 100,
    markingMode: "trainer_points",
    schemeData: {
      questions: [
        { id: 1, type: "numerical", question: "Calculate the derivative of f(x) = x³ + 2x² - 5x + 3", maxMarks: 10, correctAnswer: "3x² + 4x - 5", tolerance: 0.1 },
        { id: 2, type: "numerical", question: "Solve the integral ∫(2x + 3)dx", maxMarks: 10, correctAnswer: "x² + 3x + C", tolerance: 0 },
        { id: 3, type: "essay", question: "Explain the concept of limits in calculus", maxMarks: 20, keyPoints: [
          { point: "Definition of limit", marks: 5 },
          { point: "Left and right limits", marks: 5 },
          { point: "Continuity relationship", marks: 5 },
          { point: "Examples provided", marks: 5 }
        ]},
        { id: 4, type: "numerical", question: "Find the area under the curve y = x² from x = 0 to x = 2", maxMarks: 15, correctAnswer: "2.67", tolerance: 0.1 },
        { id: 5, type: "essay", question: "Describe applications of differential equations in engineering", maxMarks: 25, keyPoints: [
          { point: "Understanding of differential equations", marks: 5 },
          { point: "Engineering applications listed", marks: 10 },
          { point: "Examples explained", marks: 10 }
        ]},
        { id: 6, type: "numerical", question: "Calculate the Laplace transform of f(t) = e^(2t)", maxMarks: 20, correctAnswer: "1/(s-2)", tolerance: 0 }
      ]
    },
    createdBy: trainer.id,
  });

  await db.insert(markingSchemes).values({
    unitId: unit2.id,
    name: "Drawing Assignment Scheme",
    description: "Marking scheme for technical drawing assignments",
    version: "1.0",
    totalMarks: 100,
    markingMode: "trainer_points",
    schemeData: {
      questions: [
        { id: 1, type: "essay", question: "Orthographic Projection - Front View", maxMarks: 25, keyPoints: [
          { point: "Correct projection method", marks: 10 },
          { point: "Proper line types", marks: 5 },
          { point: "Accurate dimensions", marks: 10 }
        ]},
        { id: 2, type: "essay", question: "Orthographic Projection - Top View", maxMarks: 25, keyPoints: [
          { point: "Correct projection method", marks: 10 },
          { point: "Proper line types", marks: 5 },
          { point: "Accurate dimensions", marks: 10 }
        ]},
        { id: 3, type: "essay", question: "Isometric Drawing", maxMarks: 30, keyPoints: [
          { point: "Correct isometric axes", marks: 10 },
          { point: "Proper scaling", marks: 10 },
          { point: "Clean linework", marks: 10 }
        ]},
        { id: 4, type: "essay", question: "Section Drawing", maxMarks: 20, keyPoints: [
          { point: "Correct section line", marks: 5 },
          { point: "Hatching pattern", marks: 5 },
          { point: "Hidden lines shown", marks: 10 }
        ]}
      ]
    },
    createdBy: trainer.id,
  });

  console.log("Created demo marking schemes");

  // Enroll trainee in units
  await db.insert(enrollments).values([
    { traineeId: trainee.id, unitId: unit1.id, enrolledBy: admin.id },
    { traineeId: trainee.id, unitId: unit2.id, enrolledBy: admin.id },
    { traineeId: trainee.id, unitId: unit3.id, enrolledBy: admin.id },
  ]);

  console.log("Enrolled trainee in units");
  console.log("Seeding complete!");
  console.log("\nDemo accounts:");
  console.log("  Admin: admin@demo.com / admin123");
  console.log("  Trainer: trainer@demo.com / trainer123");
  console.log("  Trainee: trainee@demo.com / trainee123");
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
