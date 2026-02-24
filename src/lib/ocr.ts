import Tesseract from "tesseract.js";
import fs from "fs/promises";
import path from "path";

interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
  }>;
}

export interface ExtractedData {
  rawText: string;
  confidence: number;
  extractedInfo: {
    studentName?: string;
    studentId?: string;
    unitCode?: string;
    unitName?: string;
    answers?: Array<{
      questionNumber: number;
      answer: string;
    }>;
  };
}

// Common patterns for extracting information
const patterns = {
  studentName: /(?:student\s*name|name|candidate)\s*[:\-]?\s*([A-Za-z\s]+)/i,
  studentId: /(?:student\s*id|id\s*number|registration\s*number|adm\s*no)\s*[:\-]?\s*([A-Z0-9\/]+)/i,
  unitCode: /(?:unit\s*code|course\s*code|code)\s*[:\-]?\s*([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/i,
  unitName: /(?:unit\s*name|course\s*name|subject)\s*[:\-]?\s*([A-Za-z\s&]+?)(?:\n|$)/i,
  questionAnswer: /(?:question|q\.?)\s*(\d+)\s*[:\-\.]?\s*([A-Za-z0-9\s\.\,\-\(\)]+?)(?=(?:question|q\.?)\s*\d+|$)/gi,
};

export async function processImageWithOCR(imagePath: string): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Access data safely with type assertions
    const data = result.data as {
      text: string;
      confidence: number;
      words?: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }>;
      lines?: Array<{ text: string; confidence: number }>;
    };

    const words = data.words?.map((word: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: {
        x0: word.bbox.x0,
        y0: word.bbox.y0,
        x1: word.bbox.x1,
        y1: word.bbox.y1,
      },
    })) || [];

    const lines = data.lines?.map((line: { text: string; confidence: number }) => ({
      text: line.text,
      confidence: line.confidence,
    })) || [];

    return {
      text: data.text,
      confidence: data.confidence,
      words,
      lines,
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error("Failed to process image with OCR");
  }
}

export function extractInformation(ocrResult: OCRResult): ExtractedData {
  const text = ocrResult.text;
  const extractedInfo: ExtractedData["extractedInfo"] = {};

  // Extract student name
  const nameMatch = text.match(patterns.studentName);
  if (nameMatch) {
    extractedInfo.studentName = nameMatch[1].trim();
  }

  // Extract student ID
  const idMatch = text.match(patterns.studentId);
  if (idMatch) {
    extractedInfo.studentId = idMatch[1].trim();
  }

  // Extract unit code
  const codeMatch = text.match(patterns.unitCode);
  if (codeMatch) {
    extractedInfo.unitCode = codeMatch[1].trim();
  }

  // Extract unit name
  const unitMatch = text.match(patterns.unitName);
  if (unitMatch) {
    extractedInfo.unitName = unitMatch[1].trim();
  }

  // Extract question answers
  const answers: Array<{ questionNumber: number; answer: string }> = [];
  let answerMatch;
  const answerPattern = new RegExp(patterns.questionAnswer.source, "gi");
  
  while ((answerMatch = answerPattern.exec(text)) !== null) {
    const questionNum = parseInt(answerMatch[1]);
    const answer = answerMatch[2].trim();
    if (questionNum && answer) {
      answers.push({ questionNumber: questionNum, answer });
    }
  }
  
  if (answers.length > 0) {
    extractedInfo.answers = answers;
  }

  return {
    rawText: text,
    confidence: ocrResult.confidence,
    extractedInfo,
  };
}

// Process PDF by converting to images (requires pdf-poppler or similar)
// For now, we'll handle image files directly
export async function processDocument(filePath: string): Promise<ExtractedData> {
  const ext = path.extname(filePath).toLowerCase();
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error("File not found");
  }

  // Process image files with OCR
  if ([".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"].includes(ext)) {
    const ocrResult = await processImageWithOCR(filePath);
    return extractInformation(ocrResult);
  }

  // For PDF files, we would need to convert to images first
  // This is a placeholder - in production, you'd use pdf-poppler or similar
  if (ext === ".pdf") {
    throw new Error("PDF OCR requires additional setup. Please convert to image first or use scanned image files.");
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// Compare extracted answers with marking scheme
export function compareAnswers(
  extractedAnswers: Array<{ questionNumber: number; answer: string }>,
  markingScheme: Array<{ questionNumber: number; expectedAnswer: string; marks: number }>
): {
  results: Array<{
    questionNumber: number;
    extractedAnswer: string;
    expectedAnswer: string;
    isMatch: boolean;
    marks: number;
    confidence: number;
  }>;
  totalMarks: number;
  maxMarks: number;
} {
  const results = [];
  let totalMarks = 0;
  let maxMarks = 0;

  for (const scheme of markingScheme) {
    const extracted = extractedAnswers.find(
      (a) => a.questionNumber === scheme.questionNumber
    );

    const extractedAnswer = extracted?.answer || "";
    const expectedAnswer = scheme.expectedAnswer;
    
    // Simple matching - in production, you'd use fuzzy matching or AI
    const isMatch = extractedAnswer.toLowerCase().trim() === expectedAnswer.toLowerCase().trim();
    
    const marks = isMatch ? scheme.marks : 0;
    totalMarks += marks;
    maxMarks += scheme.marks;

    results.push({
      questionNumber: scheme.questionNumber,
      extractedAnswer,
      expectedAnswer,
      isMatch,
      marks,
      confidence: extracted ? 1 : 0,
    });
  }

  return { results, totalMarks, maxMarks };
}

// Batch process multiple images
export async function batchProcessImages(
  filePaths: string[],
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedData[]> {
  const results: ExtractedData[] = [];
  
  for (let i = 0; i < filePaths.length; i++) {
    try {
      const result = await processDocument(filePaths[i]);
      results.push(result);
      onProgress?.(i + 1, filePaths.length);
    } catch (error) {
      console.error(`Failed to process ${filePaths[i]}:`, error);
      results.push({
        rawText: "",
        confidence: 0,
        extractedInfo: {},
      });
    }
  }
  
  return results;
}
