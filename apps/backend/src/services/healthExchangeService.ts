import { healthExchangeRepository, InteropRecord } from '../repositories/healthExchangeRepository.js';
import { medicalReportRepository } from '../repositories/medicalReportRepository.js';
import { Bundle, Patient, Observation, FHIRResource } from '../types/fhir.types.js';

export class HealthExchangeService {
  async getProfile(userId: string): Promise<InteropRecord> {
    return healthExchangeRepository.getRecord(userId);
  }

  async createProfile(userId: string, abhaAddress: string): Promise<InteropRecord> {
    const record = await healthExchangeRepository.getRecord(userId);
    record.abhaAddress = abhaAddress;
    record.abhaId = `abha-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    record.verified = true;
    record.syncTimeline.push({
      id: `s-${Date.now()}`,
      type: 'Sync',
      description: `Registered new ABHA ID: ${record.abhaId}`,
      timestamp: new Date().toISOString(),
      system: 'ABDM registry'
    });
    await healthExchangeRepository.saveRecord(userId, record);
    return record;
  }

  async compileFHIRBundle(userId: string): Promise<Bundle> {
    const reports = await medicalReportRepository.findByUserId(userId);
    const clinicalReports = reports.filter(r => r.reportType !== 'USER_PROFILE' && r.reportType !== 'DISEASE_PREDICTION' && r.reportType !== 'HEALTH_SIMULATION' && r.reportType !== 'ABHA_INTEROPERABILITY');

    const patientResource: Patient = {
      resourceType: 'Patient',
      id: `pat-${userId}`,
      name: [{ text: 'Verified citizen account' }],
      gender: 'unknown'
    };

    const entries: { fullUrl: string; resource: FHIRResource }[] = [
      { fullUrl: `urn:uuid:patient-${userId}`, resource: patientResource }
    ];

    clinicalReports.forEach((rep, idx) => {
      const obsResource: Observation = {
        resourceType: 'Observation',
        id: `obs-${rep.id || idx}`,
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '55233-1', display: rep.fileName }],
          text: rep.geminiAnalysis || 'Diagnostic telemetry'
        },
        subject: { reference: `urn:uuid:patient-${userId}` },
        effectiveDateTime: rep.createdAt ? new Date(rep.createdAt).toISOString() : new Date().toISOString(),
        valueString: rep.geminiAnalysis
      };
      entries.push({ fullUrl: `urn:uuid:observation-${rep.id || idx}`, resource: obsResource });
    });

    return {
      resourceType: 'Bundle',
      id: `bundle-${userId}-${Date.now()}`,
      type: 'document',
      entry: entries
    };
  }

  async exportFHIRRecord(userId: string): Promise<any> {
    const bundle = await this.compileFHIRBundle(userId);
    const record = await healthExchangeRepository.getRecord(userId);
    record.syncTimeline.push({
      id: `s-${Date.now()}`,
      type: 'Export',
      description: `Exported FHIR bundle size: ${bundle.entry.length} resources`,
      timestamp: new Date().toISOString(),
      system: 'Citizen local store'
    });
    await healthExchangeRepository.saveRecord(userId, record);
    return bundle;
  }

  async importFHIRRecord(userId: string, bundle: any): Promise<void> {
    const record = await healthExchangeRepository.getRecord(userId);
    record.syncTimeline.push({
      id: `s-${Date.now()}`,
      type: 'Import',
      description: `Imported external FHIR package: ${bundle.id || 'bundle-102'}`,
      timestamp: new Date().toISOString(),
      system: 'ABDM Exchange'
    });
    await healthExchangeRepository.saveRecord(userId, record);
  }

  async updateConsent(userId: string, consentId: string, action: 'Approved' | 'Rejected' | 'Revoked'): Promise<InteropRecord> {
    const record = await healthExchangeRepository.getRecord(userId);
    const target = record.consents.find(c => c.id === consentId);
    if (target) {
      target.status = action;
      record.syncTimeline.push({
        id: `s-${Date.now()}`,
        type: 'Consent',
        description: `Consent status for ${target.hospital} changed to ${action}`,
        timestamp: new Date().toISOString(),
        system: 'ABDM Gateway'
      });
      await healthExchangeRepository.saveRecord(userId, record);
    }
    return record;
  }
}

export const healthExchangeService = new HealthExchangeService();
