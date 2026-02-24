import { db } from "@/db";
import { markingSchemes, submissions, results, users, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processDocument, extractInformation, type ExtractedData } from "@/lib/ocr";

interface MarkingSchemeQuestion {
  questionNumber: number;
  question?: string;
  expectedAnswer: string;
  marks: number;
  keywords?: string[];
  alternativeAnswers?: string[];
}

interface MarkingSchemeData {
  id: number;
  name: string;
  totalMarks: number;
  questions: MarkingSchemeQuestion[];
}

interface AIMarkingResult {
  submissionId: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  isCompetent: boolean;
  questionResults: Array<{
    questionNumber: number;
    extractedAnswer: string;
    expectedAnswer: string;
    marksAwarded: number;
    maxMarks: number;
    feedback: string;
    confidence: number;
  }>;
  overallFeedback: string;
  confidence: number;
}

// Calculate similarity between two strings (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  return 1 - distance / Math.max(s1.length, s2.length);
}

// Check if answer contains keywords
function checkKeywords(answer: string, keywords: string[]): { found: string[]; score: number } {
  const foundKeywords: string[] = [];
  const answerLower = answer.toLowerCase();
  
  for (const keyword of keywords) {
    if (answerLower.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  const score = keywords.length > 0 ? foundKeywords.length / keywords.length : 0;
  return { found: foundKeywords, score };
}

// Evaluate a single answer
function evaluateAnswer(
  extractedAnswer: string,
  question: MarkingSchemeQuestion
): { marks: number; feedback: string; confidence: number } {
  const { expectedAnswer, marks, keywords, alternativeAnswers } = question;
  
  // Exact match
  if (extractedAnswer.toLowerCase().trim() === expectedAnswer.toLowerCase().trim()) {
    return {
      marks,
      feedback: "Correct answer.",
      confidence: 1,
    };
  }
  
  // Check alternative answers
  if (alternativeAnswers && alternativeAnswers.length > 0) {
    for (const alt of alternativeAnswers) {
      if (extractedAnswer.toLowerCase().trim() === alt.toLowerCase().trim()) {
        return {
          marks,
          feedback: "Correct answer (alternative).",
          confidence: 0.95,
        };
      }
    }
  }
  
  // Calculate similarity
  const similarity = calculateSimilarity(extractedAnswer, expectedAnswer);
  
  // Check keywords
  const keywordResult = keywords ? checkKeywords(extractedAnswer, keywords) : { found: [], score: 0 };
  
  // Determine marks based on similarity and keywords
  if (similarity >= 0.9) {
    return {
      marks,
      feedback: "Answer is very close to expected. Minor differences in wording.",
      confidence: 0.9,
    };
  }
  
  if (similarity >= 0.7 || keywordResult.score >= 0.8) {
    const partialMarks = Math.round(marks * 0.8);
    return {
      marks: partialMarks,
      feedback: `Good answer. Contains most key concepts. Keywords found: ${keywordResult.found.join(", ") || "none"}`,
      confidence: 0.75,
    };
  }
  
  if (similarity >= 0.5 || keywordResult.score >= 0.5) {
    const partialMarks = Math.round(marks * 0.5);
    return {
      marks: partialMarks,
      feedback: `Partial answer. Some concepts present. Keywords found: ${keywordResult.found.join(", ") || "none"}`,
      confidence: 0.6,
    };
  }
  
  if (similarity >= 0.3 || keywordResult.score >= 0.3) {
    const partialMarks = Math.round(marks * 0.25);
    return {
      marks: partialMarks,
      feedback: `Answer shows some understanding. Review recommended. Keywords found: ${keywordResult.found.join(", ") || "none"}`,
      confidence: 0.4,
    };
  }
  
  return {
    marks: 0,
    feedback: "Answer does not match expected response. Manual review recommended.",
    confidence: 0.2,
  };
}

// Generate overall feedback
function generateOverallFeedback(
  questionResults: AIMarkingResult["questionResults"],
  percentage: number,
  isCompetent: boolean
): string {
  const correctCount = questionResults.filter((q) => q.marksAwarded === q.maxMarks).length;
  const partialCount = questionResults.filter(
    (q) => q.marksAwarded > 0 && q.marksAwarded < q.maxMarks
  ).length;
  const incorrectCount = questionResults.filter((q) => q.marksAwarded === 0).length;
  
  let feedback = `Overall Score: ${percentage}%\n`;
  feedback += `Status: ${isCompetent ? "Competent" : "Not Yet Competent"}\n\n`;
  feedback += `Summary:\n`;
  feedback += `- ${correctCount} question(s) answered correctly\n`;
  feedback += `- ${partialCount} question(s) partially correct\n`;
  feedback += `- ${incorrectCount} question(s) need improvement\n\n`;
  
  if (isCompetent) {
    feedback += "Congratulations! You have demonstrated competency in this assessment.";
    if (partialCount > 0 || incorrectCount > 0) {
      feedback += " However, there are areas that could use improvement.";
    }
  } else {
    feedback += "Additional study and practice is recommended. Please review the feedback for each question and consider resubmitting after addressing the gaps.";
  }
  
  return feedback;
}

// Main AI marking function
export async function performAIMarking(
  submissionId: number,
  markingSchemeId: number,
  ocrData?: ExtractedData
): Promise<AIMarkingResult> {
  // Get submission
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });
  
  if (!submission) {
    throw new Error("Submission not found");
  }
  
  // Get marking scheme
  const scheme = await db.query.markingSchemes.findFirst({
    where: eq(markingSchemes.id, markingSchemeId),
  });
  
  if (!scheme) {
    throw new Error("Marking scheme not found");
  }
  
  // Parse scheme data
  const schemeData: MarkingSchemeData = {
    id: scheme.id,
    name: scheme.name,
    totalMarks: scheme.totalMarks,
    questions: Array.isArray(scheme.schemeData) 
      ? (scheme.schemeData as MarkingSchemeQuestion[]) 
      : [],
  };
  
  // Get OCR data if not provided
  let extractedData = ocrData;
  if (!extractedData) {
    try {
      extractedData = await processDocument(submission.filePath);
    } catch (error) {
      console.error("OCR failed:", error);
      // Return empty result if OCR fails
      return {
        submissionId,
        totalMarks: 0,
        maxMarks: schemeData.totalMarks,
        percentage: 0,
        isCompetent: false,
        questionResults: schemeData.questions.map((q) => ({
          questionNumber: q.questionNumber,
          extractedAnswer: "",
          expectedAnswer: q.expectedAnswer,
          marksAwarded: 0,
          maxMarks: q.marks,
          feedback: "OCR processing failed. Manual marking required.",
          confidence: 0,
        })),
        overallFeedback: "Automated marking could not be performed due to OCR processing failure. Please mark manually.",
        confidence: 0,
      };
    }
  }
  
  // Extract answers from OCR data
  const extractedAnswers = extractedData.extractedInfo.answers || [];
  
  // Evaluate each question
  const questionResults: AIMarkingResult["questionResults"] = [];
  let totalMarks = 0;
  let totalConfidence = 0;
  
  for (const question of schemeData.questions) {
    const extracted = extractedAnswers.find(
      (a: { questionNumber: number; answer: string }) => a.questionNumber === question.questionNumber
    );
    
    const extractedAnswer = extracted?.answer || "";
    const evaluation = evaluateAnswer(extractedAnswer, question);
    
    totalMarks += evaluation.marks;
    totalConfidence += evaluation.confidence;
    
    questionResults.push({
      questionNumber: question.questionNumber,
      extractedAnswer,
      expectedAnswer: question.expectedAnswer,
      marksAwarded: evaluation.marks,
      maxMarks: question.marks,
      feedback: evaluation.feedback,
      confidence: evaluation.confidence,
    });
  }
  
  const maxMarks = schemeData.totalMarks;
  const percentage = Math.round((totalMarks / maxMarks) * 100);
  const isCompetent = percentage >= 50;
  const avgConfidence = questionResults.length > 0 
    ? totalConfidence / questionResults.length 
    : 0;
  
  const overallFeedback = generateOverallFeedback(questionResults, percentage, isCompetent);
  
  return {
    submissionId,
    totalMarks,
    maxMarks,
    percentage,
    isCompetent,
    questionResults,
    overallFeedback,
    confidence: avgConfidence,
  };
}

// Save AI marking results
export async function saveAIMarkingResults(
  result: AIMarkingResult,
  markedBy: number
): Promise<void> {
  // Check if result already exists
  const existingResult = await db.query.results.findFirst({
    where: eq(results.submissionId, result.submissionId),
  });
  
  if (existingResult) {
    // Update existing result
    await db
      .update(results)
      .set({
        totalMarks: result.totalMarks,
        maxMarks: result.maxMarks,
        percentage: result.percentage,
        isCompetent: result.isCompetent,
        questionResults: result.questionResults,
        feedback: result.overallFeedback,
        markedBy,
        markedAt: new Date(),
      })
      .where(eq(results.id, existingResult.id));
  } else {
    // Get submission for trainee and unit info
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, result.submissionId),
    });
    
    if (!submission) {
      throw new Error("Submission not found");
    }
    
    // Create new result
    await db.insert(results).values({
      submissionId: result.submissionId,
      traineeId: submission.traineeId,
      unitId: submission.unitId,
      totalMarks: result.totalMarks,
      maxMarks: result.maxMarks,
      percentage: result.percentage,
      isCompetent: result.isCompetent,
      questionResults: result.questionResults,
      feedback: result.overallFeedback,
      markedBy,
    });
  }
  
  // Update submission status
  await db
    .update(submissions)
    .set({
      status: "marked",
      markedAt: new Date(),
      markedBy,
    })
    .where(eq(submissions.id, result.submissionId));
}

// Get marking suggestions for manual review
export async function getMarkingSuggestions(
  submissionId: number,
  markingSchemeId: number
): Promise<{
  aiResult: AIMarkingResult;
  ocrData: ExtractedData | null;
  needsReview: boolean;
}> {
  // Get submission
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });
  
  if (!submission) {
    throw new Error("Submission not found");
  }
  
  // Try to get OCR data
  let ocrData: ExtractedData | null = null;
  try {
    ocrData = await processDocument(submission.filePath);
  } catch (error) {
    console.error("OCR failed:", error);
  }
  
  // Perform AI marking
  const aiResult = await performAIMarking(submissionId, markingSchemeId, ocrData || undefined);
  
  // Determine if manual review is needed
  const needsReview = 
    aiResult.confidence < 0.7 || 
    aiResult.questionResults.some((q) => q.confidence < 0.5);
  
  return {
    aiResult,
    ocrData,
    needsReview,
  };
}
