import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { performAIMarking, saveAIMarkingResults, getMarkingSuggestions } from "@/lib/ai-marking";
import { db } from "@/db";
import { submissions, markingSchemes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { submissionId, markingSchemeId, autoSave } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Get submission
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Determine marking scheme
    let schemeId = markingSchemeId || submission.markingSchemeId;
    
    if (!schemeId) {
      // Try to find a marking scheme for the unit
      const scheme = await db.query.markingSchemes.findFirst({
        where: eq(markingSchemes.unitId, submission.unitId),
      });
      
      if (!scheme) {
        return NextResponse.json({ 
          error: "No marking scheme found for this submission" 
        }, { status: 400 });
      }
      
      schemeId = scheme.id;
    }

    // Get marking suggestions
    const result = await getMarkingSuggestions(submissionId, schemeId);

    // Auto-save if requested
    if (autoSave && !result.needsReview) {
      await saveAIMarkingResults(result.aiResult, user.id);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI marking error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform AI marking" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user || (user.role !== "trainer" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) {
    return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
  }

  try {
    // Get submission
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, parseInt(submissionId)),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Determine marking scheme
    let schemeId = submission.markingSchemeId;
    
    if (!schemeId) {
      const scheme = await db.query.markingSchemes.findFirst({
        where: eq(markingSchemes.unitId, submission.unitId),
      });
      
      if (!scheme) {
        return NextResponse.json({ 
          error: "No marking scheme found for this submission" 
        }, { status: 400 });
      }
      
      schemeId = scheme.id;
    }

    // Get marking suggestions
    const result = await getMarkingSuggestions(parseInt(submissionId), schemeId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI marking error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get marking suggestions" },
      { status: 500 }
    );
  }
}
