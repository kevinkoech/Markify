import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { submissions, results, users, units } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { generateTraineeReport, generateUnitReport, generateOverallReport } from "@/lib/pdf-report";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const reportType = searchParams.get("type") || "overall";
  const traineeId = searchParams.get("traineeId");
  const unitId = searchParams.get("unitId");

  try {
    let pdfBuffer: Buffer;
    let filename: string;

    switch (reportType) {
      case "trainee":
        if (!traineeId) {
          return NextResponse.json({ error: "Trainee ID required" }, { status: 400 });
        }
        pdfBuffer = await generateTraineeReportData(parseInt(traineeId), user.name);
        filename = `trainee-report-${traineeId}.pdf`;
        break;

      case "unit":
        if (!unitId) {
          return NextResponse.json({ error: "Unit ID required" }, { status: 400 });
        }
        pdfBuffer = await generateUnitReportData(parseInt(unitId), user.name);
        filename = `unit-report-${unitId}.pdf`;
        break;

      case "overall":
      default:
        pdfBuffer = await generateOverallReportData(user.name);
        filename = "overall-report.pdf";
        break;
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

async function generateTraineeReportData(traineeId: number, generatedBy: string): Promise<Buffer> {
  // Get trainee info
  const trainee = await db.query.users.findFirst({
    where: eq(users.id, traineeId),
  });

  if (!trainee) {
    throw new Error("Trainee not found");
  }

  // Get all submissions for trainee with results
  const traineeSubmissions = await db
    .select({
      id: submissions.id,
      fileName: submissions.originalFileName,
      uploadedAt: submissions.uploadedAt,
      status: submissions.status,
      unitId: submissions.unitId,
    })
    .from(submissions)
    .where(eq(submissions.traineeId, traineeId))
    .orderBy(desc(submissions.uploadedAt));

  // Get results for submissions
  const submissionDetails = await Promise.all(
    traineeSubmissions.map(async (sub) => {
      const unit = await db.query.units.findFirst({
        where: eq(units.id, sub.unitId),
      });

      const result = await db.query.results.findFirst({
        where: eq(results.submissionId, sub.id),
      });

      return {
        unitName: unit?.name || "Unknown",
        unitCode: unit?.code || "N/A",
        fileName: sub.fileName,
        uploadedAt: sub.uploadedAt || new Date(),
        status: sub.status,
        score: result?.totalMarks,
        maxScore: result?.maxMarks,
        percentage: result?.percentage,
        isCompetent: result?.isCompetent || false,
        feedback: result?.feedback || undefined,
      };
    })
  );

  // Calculate summary
  const markedSubmissions = submissionDetails.filter((s) => s.percentage !== undefined);
  const competentCount = submissionDetails.filter((s) => s.isCompetent).length;
  const averageScore = markedSubmissions.length > 0
    ? markedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / markedSubmissions.length
    : 0;

  return generateTraineeReport({
    title: "Trainee Progress Report",
    generatedAt: new Date(),
    generatedBy,
    traineeName: trainee.name,
    traineeEmail: trainee.email,
    department: trainee.department || undefined,
    submissions: submissionDetails,
    summary: {
      totalSubmissions: traineeSubmissions.length,
      markedSubmissions: markedSubmissions.length,
      competentCount,
      averageScore,
    },
  });
}

async function generateUnitReportData(unitId: number, generatedBy: string): Promise<Buffer> {
  // Get unit info
  const unit = await db.query.units.findFirst({
    where: eq(units.id, unitId),
  });

  if (!unit) {
    throw new Error("Unit not found");
  }

  // Get all trainees with submissions for this unit
  const unitSubmissions = await db
    .select({
      traineeId: submissions.traineeId,
      submissionId: submissions.id,
    })
    .from(submissions)
    .where(eq(submissions.unitId, unitId));

  // Group by trainee
  const traineeMap = new Map<number, { submissions: number; scores: number[]; competentCount: number }>();

  for (const sub of unitSubmissions) {
    const result = await db.query.results.findFirst({
      where: eq(results.submissionId, sub.submissionId),
    });

    const existing = traineeMap.get(sub.traineeId) || { submissions: 0, scores: [], competentCount: 0 };
    existing.submissions++;
    if (result?.percentage !== undefined) {
      existing.scores.push(result.percentage);
    }
    if (result?.isCompetent) {
      existing.competentCount++;
    }
    traineeMap.set(sub.traineeId, existing);
  }

  // Get trainee details
  const trainees = await Promise.all(
    Array.from(traineeMap.entries()).map(async ([traineeId, data]) => {
      const trainee = await db.query.users.findFirst({
        where: eq(users.id, traineeId),
      });

      return {
        traineeName: trainee?.name || "Unknown",
        traineeEmail: trainee?.email || "Unknown",
        submissions: data.submissions,
        averageScore: data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0,
        competentCount: data.competentCount,
      };
    })
  );

  // Calculate summary
  const totalSubmissions = unitSubmissions.length;
  const allScores = trainees.flatMap((t) => t.averageScore > 0 ? [t.averageScore] : []);
  const averageScore = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0;
  const totalCompetent = trainees.reduce((sum, t) => sum + t.competentCount, 0);
  const competencyRate = totalSubmissions > 0
    ? (totalCompetent / totalSubmissions) * 100
    : 0;

  return generateUnitReport({
    title: "Unit Performance Report",
    generatedAt: new Date(),
    generatedBy,
    unitName: unit.name,
    unitCode: unit.code,
    department: unit.department || undefined,
    trainees,
    summary: {
      totalTrainees: trainees.length,
      totalSubmissions,
      averageScore,
      competencyRate,
    },
  });
}

async function generateOverallReportData(generatedBy: string): Promise<Buffer> {
  // Get all units
  const allUnits = await db.query.units.findMany();

  // Get stats for each unit
  const unitStats = await Promise.all(
    allUnits.map(async (unit) => {
      const unitSubmissions = await db
        .select()
        .from(submissions)
        .where(eq(submissions.unitId, unit.id));

      const submissionIds = unitSubmissions.map((s) => s.id);
      let totalScore = 0;
      let scoreCount = 0;
      let competentCount = 0;

      for (const subId of submissionIds) {
        const result = await db.query.results.findFirst({
          where: eq(results.submissionId, subId),
        });
        if (result?.percentage !== undefined) {
          totalScore += result.percentage;
          scoreCount++;
        }
        if (result?.isCompetent) {
          competentCount++;
        }
      }

      // Get unique trainees
      const traineeSet = new Set(unitSubmissions.map((s) => s.traineeId));

      return {
        unitName: unit.name,
        unitCode: unit.code,
        totalTrainees: traineeSet.size,
        totalSubmissions: unitSubmissions.length,
        averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        competencyRate: unitSubmissions.length > 0
          ? (competentCount / unitSubmissions.length) * 100
          : 0,
      };
    })
  );

  // Get total trainees
  const allTrainees = await db.query.users.findMany({
    where: eq(users.role, "trainee"),
  });

  // Get total submissions
  const allSubmissions = await db.query.submissions.findMany();

  // Calculate overall stats
  const overallAverage = unitStats.length > 0
    ? unitStats.reduce((sum, u) => sum + u.averageScore, 0) / unitStats.length
    : 0;
  const overallCompetencyRate = unitStats.length > 0
    ? unitStats.reduce((sum, u) => sum + u.competencyRate, 0) / unitStats.length
    : 0;

  return generateOverallReport({
    generatedAt: new Date(),
    generatedBy,
    units: unitStats,
    summary: {
      totalUnits: allUnits.length,
      totalTrainees: allTrainees.length,
      totalSubmissions: allSubmissions.length,
      overallAverage,
      overallCompetencyRate,
    },
  });
}
