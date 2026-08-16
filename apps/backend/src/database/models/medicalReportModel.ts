export interface MedicalReportEntity {
  id: string;
  userId: string;
  reportName?: string;
  reportType?: string;
  hospitalName?: string;
  doctorName?: string;
  reportDate?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  ocrText?: string;
  structuredJson?: string;
  geminiAnalysis?: string;
  abnormalValues?: string;
  healthScore?: number;
  riskLevel?: string;
  specialistRecommended?: string;
  confidenceScore?: number;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
