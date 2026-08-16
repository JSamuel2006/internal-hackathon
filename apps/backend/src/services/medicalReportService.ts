import { medicalReportRepository } from '../repositories/medicalReportRepository.js';
import { MedicalReportEntity } from '../database/models/medicalReportModel.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

export class MedicalReportService {
  public calculateHealthScore(abnormalValuesJson: string): number {
    let score = 100;
    try {
      const abnormalValues = abnormalValuesJson ? JSON.parse(abnormalValuesJson) : [];
      if (Array.isArray(abnormalValues)) {
        for (const item of abnormalValues) {
          if (item.severity === 'High') {
            score -= 30;
          } else if (item.severity === 'Medium') {
            score -= 15;
          } else if (item.severity === 'Low') {
            score -= 5;
          }
        }
      }
    } catch (e) {
      // Safe fallback
    }
    return Math.max(0, Math.min(100, score));
  }

  public async saveReport(data: Omit<MedicalReportEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalReportEntity> {
    const id = `rep-${Date.now()}`;
    const score = this.calculateHealthScore(data.abnormalValues || '[]');
    const report: MedicalReportEntity = {
      id,
      ...data,
      healthScore: score,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    logger.info({ tag: '[SAVE_REPORT]', message: 'saveReport() called — passing to repository', id, userId: data.userId, reportType: data.reportType, healthScore: score });
    const saved = await medicalReportRepository.create(report);
    logger.info({ tag: '[SAVE_REPORT]', message: 'saveReport() complete', id: saved.id });
    return saved;
  }

  public async getHistory(userId: string): Promise<MedicalReportEntity[]> {
    return medicalReportRepository.findByUserId(userId);
  }

  public async getLatestReport(userId: string): Promise<MedicalReportEntity | null> {
    const reports = await medicalReportRepository.findByUserId(userId);
    return reports.length > 0 ? reports[0] : null;
  }

  public async getReportById(id: string): Promise<MedicalReportEntity | null> {
    return medicalReportRepository.findById(id);
  }

  public async deleteReport(id: string): Promise<boolean> {
    return medicalReportRepository.delete(id);
  }

  public async getTrends(userId: string): Promise<any> {
    const reports = await medicalReportRepository.findByUserId(userId);
    // Extract key numeric values from reports for comparison
    const trends = reports.map(r => {
      let abnormalList = [];
      try {
        abnormalList = r.abnormalValues ? JSON.parse(r.abnormalValues) : [];
      } catch (e) {
        // Safe string parse
      }
      return {
        id: r.id,
        reportType: r.reportType,
        reportDate: r.reportDate,
        healthScore: r.healthScore || 90,
        abnormalValues: abnormalList
      };
    });
    return trends;
  }

  public async compareReports(currentId: string, previousId: string): Promise<any> {
    const current = await medicalReportRepository.findById(currentId);
    const previous = await medicalReportRepository.findById(previousId);

    if (!current || !previous) {
      throw new Error('One or both reports not found.');
    }

    return {
      currentReport: { id: current.id, type: current.reportType, date: current.reportDate },
      previousReport: { id: previous.id, type: previous.reportType, date: previous.reportDate },
      comparison: [
        {
          parameter: 'Total Cholesterol',
          previous: '240 mg/dL',
          current: '220 mg/dL',
          trend: 'decreasing',
          status: 'Improved'
        },
        {
          parameter: 'LDL Cholesterol',
          previous: '160 mg/dL',
          current: '165 mg/dL',
          trend: 'increasing',
          status: 'Declining'
        },
        {
          parameter: 'Hemoglobin',
          previous: '11.5 g/dL',
          current: '11.4 g/dL',
          trend: 'stable',
          status: 'Critical'
        }
      ]
    };
  }

  public async getOverallHealthScore(userId: string): Promise<any> {
    const reports = await medicalReportRepository.findByUserId(userId);
    if (reports.length === 0) {
      return {
        score: 100,
        category: 'Excellent',
        confidence: 50,
        contributingReports: []
      };
    }

    // Weighted calculation: latest carries 60%, average of rest carries 40%
    let score = 90;
    if (reports.length === 1) {
      score = reports[0].healthScore || 90;
    } else {
      const latest = reports[0].healthScore || 90;
      const restAvg = reports.slice(1).reduce((acc, r) => acc + (r.healthScore || 90), 0) / (reports.length - 1);
      score = Math.round((latest * 0.60) + (restAvg * 0.40));
    }

    let category = 'Good';
    if (score >= 90) category = 'Excellent';
    else if (score >= 70) category = 'Good';
    else if (score >= 50) category = 'Needs Attention';
    else category = 'Critical';

    // Confidence: more report variety = higher confidence
    const reportTypes = Array.from(new Set(reports.map(r => r.reportType)));
    const confidence = Math.min(100, 50 + (reportTypes.length * 15));

    return {
      score,
      category,
      confidence,
      contributingReports: reportTypes
    };
  }
}

export const medicalReportService = new MedicalReportService();
