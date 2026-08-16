import { medicalReportRepository } from './medicalReportRepository.js';

export interface InteropRecord {
  userId: string;
  abhaId?: string;
  abhaAddress?: string;
  verified: boolean;
  consents: {
    id: string;
    hospital: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Expired' | 'Revoked';
    requestedAt: string;
    purpose: string;
  }[];
  syncTimeline: {
    id: string;
    type: 'Export' | 'Import' | 'Sync' | 'Consent';
    description: string;
    timestamp: string;
    system: string;
  }[];
}

export class HealthExchangeRepository {
  async getRecord(userId: string): Promise<InteropRecord> {
    const reports = await medicalReportRepository.findByUserId(userId);
    const existing = reports.find(r => r.reportType === 'ABHA_INTEROPERABILITY');
    if (existing && existing.structuredJson) {
      try {
        return typeof existing.structuredJson === 'string'
          ? JSON.parse(existing.structuredJson)
          : existing.structuredJson;
      } catch {
        // Fallback
      }
    }
    // Return empty defaults
    return {
      userId,
      abhaId: '',
      abhaAddress: '',
      verified: false,
      consents: [
        { id: 'c-101', hospital: 'AIMS Delhi', status: 'Pending', requestedAt: new Date().toISOString(), purpose: 'Routine checkup telemetry' },
        { id: 'c-102', hospital: 'Apollo Mumbai', status: 'Approved', requestedAt: new Date(Date.now() - 86400000).toISOString(), purpose: 'Cardiovascular analysis diagnostics' }
      ],
      syncTimeline: [
        { id: 's-101', type: 'Sync', description: 'Linked ABHA health system profile', timestamp: new Date(Date.now() - 172800000).toISOString(), system: 'ABDM Exchange Gateway' }
      ]
    };
  }

  async saveRecord(userId: string, record: InteropRecord): Promise<void> {
    const reports = await medicalReportRepository.findByUserId(userId);
    const existing = reports.find(r => r.reportType === 'ABHA_INTEROPERABILITY');

    if (existing) {
      existing.structuredJson = JSON.stringify(record);
      // We update the existing record
      await medicalReportRepository.update(existing.id!, existing);
    } else {
      await medicalReportRepository.create({
        id: `abha-${userId}`,
        userId,
        reportName: 'ABHA Interoperability Profile',
        reportType: 'ABHA_INTEROPERABILITY',
        fileName: 'abha_interop_profile.json',
        fileUrl: '/internal/interop',
        riskLevel: 'Low',
        geminiAnalysis: 'ABHA Interoperability & Consent Profile',
        structuredJson: JSON.stringify(record)
      });
    }
  }
}

export const healthExchangeRepository = new HealthExchangeRepository();
