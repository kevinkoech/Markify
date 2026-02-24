import { jsPDF } from "jspdf";

interface ReportData {
  title: string;
  generatedAt: Date;
  generatedBy: string;
}

interface TraineeReportData extends ReportData {
  traineeName: string;
  traineeEmail: string;
  department?: string;
  submissions: Array<{
    unitName: string;
    unitCode: string;
    fileName: string;
    uploadedAt: Date;
    status: string;
    score?: number;
    maxScore?: number;
    percentage?: number;
    isCompetent?: boolean;
    feedback?: string;
  }>;
  summary: {
    totalSubmissions: number;
    markedSubmissions: number;
    competentCount: number;
    averageScore: number;
  };
}

interface UnitReportData extends ReportData {
  unitName: string;
  unitCode: string;
  department?: string;
  trainees: Array<{
    traineeName: string;
    traineeEmail: string;
    submissions: number;
    averageScore: number;
    competentCount: number;
  }>;
  summary: {
    totalTrainees: number;
    totalSubmissions: number;
    averageScore: number;
    competencyRate: number;
  };
}

// Add custom font support for better formatting
const COLORS = {
  primary: [37, 99, 235] as [number, number, number], // blue-600
  secondary: [55, 65, 81] as [number, number, number], // gray-700
  success: [22, 163, 74] as [number, number, number], // green-600
  danger: [220, 38, 38] as [number, number, number], // red-600
  muted: [107, 114, 128] as [number, number, number], // gray-500
};

function addHeader(doc: jsPDF, title: string, generatedAt: Date, generatedBy: string) {
  // Logo/Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 30, "F");
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 15, 18);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}`, 15, 25);
  doc.text(`By: ${generatedBy}`, 120, 25);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    `Page ${pageNumber} of ${totalPages} - Engineering Training System`,
    105,
    pageHeight - 10,
    { align: "center" }
  );
}

export function generateTraineeReport(data: TraineeReportData): Buffer {
  const doc = new jsPDF();
  let currentPage = 1;
  let yPosition = 40;
  
  // Header
  addHeader(doc, "Trainee Progress Report", data.generatedAt, data.generatedBy);
  
  // Trainee Info Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  doc.text("Trainee Information", 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${data.traineeName}`, 15, yPosition);
  doc.text(`Email: ${data.traineeEmail}`, 100, yPosition);
  yPosition += 6;
  if (data.department) {
    doc.text(`Department: ${data.department}`, 15, yPosition);
    yPosition += 6;
  }
  yPosition += 5;
  
  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Summary boxes
  const boxWidth = 45;
  const boxHeight = 20;
  const boxY = yPosition;
  
  // Total Submissions
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Total Submissions", 15 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text(String(data.summary.totalSubmissions), 15 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Marked
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15 + boxWidth + 5, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Marked", 15 + boxWidth + 5 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text(String(data.summary.markedSubmissions), 15 + boxWidth + 5 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Competent
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(15 + (boxWidth + 5) * 2, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Competent", 15 + (boxWidth + 5) * 2 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.success);
  doc.text(String(data.summary.competentCount), 15 + (boxWidth + 5) * 2 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Average Score
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(15 + (boxWidth + 5) * 3, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Average Score", 15 + (boxWidth + 5) * 3 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.summary.averageScore.toFixed(1)}%`, 15 + (boxWidth + 5) * 3 + boxWidth / 2, boxY + 15, { align: "center" });
  
  yPosition = boxY + boxHeight + 10;
  
  // Submissions Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  doc.text("Submission Details", 15, yPosition);
  yPosition += 8;
  
  // Table Header
  const tableHeaders = ["Unit", "File", "Date", "Score", "Status"];
  const colWidths = [50, 50, 30, 25, 35];
  let xPosition = 15;
  
  doc.setFillColor(249, 250, 251);
  doc.rect(15, yPosition - 4, 180, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  
  tableHeaders.forEach((header, i) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[i];
  });
  yPosition += 8;
  
  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  data.submissions.forEach((submission, index) => {
    // Check if we need a new page
    if (yPosition > 260) {
      addFooter(doc, currentPage, 1); // Will update total pages later
      doc.addPage();
      currentPage++;
      yPosition = 20;
    }
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(15, yPosition - 4, 180, 8, "F");
    
    xPosition = 15;
    doc.setTextColor(...COLORS.secondary);
    
    // Unit name (truncate if too long)
    const unitName = submission.unitName.length > 20 
      ? submission.unitName.substring(0, 17) + "..." 
      : submission.unitName;
    doc.text(unitName, xPosition, yPosition);
    xPosition += colWidths[0];
    
    // File name (truncate if too long)
    const fileName = submission.fileName.length > 22 
      ? submission.fileName.substring(0, 19) + "..." 
      : submission.fileName;
    doc.text(fileName, xPosition, yPosition);
    xPosition += colWidths[1];
    
    // Date
    doc.text(submission.uploadedAt.toLocaleDateString(), xPosition, yPosition);
    xPosition += colWidths[2];
    
    // Score
    if (submission.percentage !== undefined) {
      doc.text(`${submission.percentage}%`, xPosition, yPosition);
    } else {
      doc.setTextColor(...COLORS.muted);
      doc.text("-", xPosition, yPosition);
    }
    xPosition += colWidths[3];
    
    // Status
    if (submission.isCompetent !== undefined) {
      if (submission.isCompetent) {
        doc.setTextColor(...COLORS.success);
        doc.text("Competent", xPosition, yPosition);
      } else {
        doc.setTextColor(...COLORS.danger);
        doc.text("Not Competent", xPosition, yPosition);
      }
    } else {
      doc.setTextColor(...COLORS.muted);
      doc.text(submission.status, xPosition, yPosition);
    }
    
    yPosition += 8;
  });
  
  // Footer
  addFooter(doc, currentPage, currentPage);
  
  return Buffer.from(doc.output("arraybuffer"));
}

export function generateUnitReport(data: UnitReportData): Buffer {
  const doc = new jsPDF();
  let currentPage = 1;
  let yPosition = 40;
  
  // Header
  addHeader(doc, "Unit Performance Report", data.generatedAt, data.generatedBy);
  
  // Unit Info Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  doc.text("Unit Information", 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Unit: ${data.unitName} (${data.unitCode})`, 15, yPosition);
  if (data.department) {
    doc.text(`Department: ${data.department}`, 100, yPosition);
  }
  yPosition += 10;
  
  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 15, yPosition);
  yPosition += 8;
  
  // Summary boxes
  const boxWidth = 45;
  const boxHeight = 20;
  const boxY = yPosition;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Total Trainees
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Total Trainees", 15 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text(String(data.summary.totalTrainees), 15 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Total Submissions
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15 + boxWidth + 5, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Submissions", 15 + boxWidth + 5 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text(String(data.summary.totalSubmissions), 15 + boxWidth + 5 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Average Score
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(15 + (boxWidth + 5) * 2, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Average Score", 15 + (boxWidth + 5) * 2 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.summary.averageScore.toFixed(1)}%`, 15 + (boxWidth + 5) * 2 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Competency Rate
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(15 + (boxWidth + 5) * 3, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Competency Rate", 15 + (boxWidth + 5) * 3 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.success);
  doc.text(`${data.summary.competencyRate.toFixed(1)}%`, 15 + (boxWidth + 5) * 3 + boxWidth / 2, boxY + 15, { align: "center" });
  
  yPosition = boxY + boxHeight + 10;
  
  // Trainees Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  doc.text("Trainee Performance", 15, yPosition);
  yPosition += 8;
  
  // Table Header
  const tableHeaders = ["Trainee", "Email", "Submissions", "Avg Score", "Competent"];
  const colWidths = [45, 50, 30, 25, 30];
  let xPosition = 15;
  
  doc.setFillColor(249, 250, 251);
  doc.rect(15, yPosition - 4, 180, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  
  tableHeaders.forEach((header, i) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[i];
  });
  yPosition += 8;
  
  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  data.trainees.forEach((trainee, index) => {
    // Check if we need a new page
    if (yPosition > 260) {
      addFooter(doc, currentPage, 1);
      doc.addPage();
      currentPage++;
      yPosition = 20;
    }
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(15, yPosition - 4, 180, 8, "F");
    
    xPosition = 15;
    doc.setTextColor(...COLORS.secondary);
    
    // Trainee name
    const name = trainee.traineeName.length > 18 
      ? trainee.traineeName.substring(0, 15) + "..." 
      : trainee.traineeName;
    doc.text(name, xPosition, yPosition);
    xPosition += colWidths[0];
    
    // Email
    const email = trainee.traineeEmail.length > 22 
      ? trainee.traineeEmail.substring(0, 19) + "..." 
      : trainee.traineeEmail;
    doc.text(email, xPosition, yPosition);
    xPosition += colWidths[1];
    
    // Submissions
    doc.text(String(trainee.submissions), xPosition, yPosition);
    xPosition += colWidths[2];
    
    // Average Score
    doc.text(`${trainee.averageScore.toFixed(1)}%`, xPosition, yPosition);
    xPosition += colWidths[3];
    
    // Competent count
    doc.setTextColor(...COLORS.success);
    doc.text(String(trainee.competentCount), xPosition, yPosition);
    
    yPosition += 8;
  });
  
  // Footer
  addFooter(doc, currentPage, currentPage);
  
  return Buffer.from(doc.output("arraybuffer"));
}

export function generateOverallReport(data: {
  generatedAt: Date;
  generatedBy: string;
  units: Array<{
    unitName: string;
    unitCode: string;
    totalTrainees: number;
    totalSubmissions: number;
    averageScore: number;
    competencyRate: number;
  }>;
  summary: {
    totalUnits: number;
    totalTrainees: number;
    totalSubmissions: number;
    overallAverage: number;
    overallCompetencyRate: number;
  };
}): Buffer {
  const doc = new jsPDF();
  let currentPage = 1;
  let yPosition = 40;
  
  // Header
  addHeader(doc, "Overall System Report", data.generatedAt, data.generatedBy);
  
  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  doc.text("System Overview", 15, yPosition);
  yPosition += 8;
  
  // Summary boxes - 2 rows
  const boxWidth = 45;
  const boxHeight = 20;
  let boxY = yPosition;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Row 1
  // Total Units
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Total Units", 15 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text(String(data.summary.totalUnits), 15 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Total Trainees
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15 + boxWidth + 5, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Total Trainees", 15 + boxWidth + 5 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text(String(data.summary.totalTrainees), 15 + boxWidth + 5 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Total Submissions
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15 + (boxWidth + 5) * 2, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Submissions", 15 + (boxWidth + 5) * 2 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  doc.text(String(data.summary.totalSubmissions), 15 + (boxWidth + 5) * 2 + boxWidth / 2, boxY + 15, { align: "center" });
  
  // Overall Average
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(15 + (boxWidth + 5) * 3, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Avg Score", 15 + (boxWidth + 5) * 3 + boxWidth / 2, boxY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${data.summary.overallAverage.toFixed(1)}%`, 15 + (boxWidth + 5) * 3 + boxWidth / 2, boxY + 15, { align: "center" });
  
  yPosition = boxY + boxHeight + 10;
  
  // Units Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  doc.text("Unit Performance", 15, yPosition);
  yPosition += 8;
  
  // Table Header
  const tableHeaders = ["Unit", "Trainees", "Submissions", "Avg Score", "Competency"];
  const colWidths = [55, 30, 35, 30, 30];
  let xPosition = 15;
  
  doc.setFillColor(249, 250, 251);
  doc.rect(15, yPosition - 4, 180, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondary);
  
  tableHeaders.forEach((header, i) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[i];
  });
  yPosition += 8;
  
  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  data.units.forEach((unit, index) => {
    if (yPosition > 260) {
      addFooter(doc, currentPage, 1);
      doc.addPage();
      currentPage++;
      yPosition = 20;
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(15, yPosition - 4, 180, 8, "F");
    
    xPosition = 15;
    doc.setTextColor(...COLORS.secondary);
    
    const unitName = unit.unitName.length > 25 
      ? unit.unitName.substring(0, 22) + "..." 
      : unit.unitName;
    doc.text(unitName, xPosition, yPosition);
    xPosition += colWidths[0];
    
    doc.text(String(unit.totalTrainees), xPosition, yPosition);
    xPosition += colWidths[1];
    
    doc.text(String(unit.totalSubmissions), xPosition, yPosition);
    xPosition += colWidths[2];
    
    doc.text(`${unit.averageScore.toFixed(1)}%`, xPosition, yPosition);
    xPosition += colWidths[3];
    
    doc.setTextColor(...COLORS.success);
    doc.text(`${unit.competencyRate.toFixed(1)}%`, xPosition, yPosition);
    
    yPosition += 8;
  });
  
  addFooter(doc, currentPage, currentPage);
  
  return Buffer.from(doc.output("arraybuffer"));
}
