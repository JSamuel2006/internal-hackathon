import { emitAshaScreeningEvent } from '../socket/socketServer.js';
import crypto from 'crypto';
import { screeningRepository, ScreeningRecord } from '../repositories/screeningRepository.js';
import { userRepository } from '../repositories/userRepository.js';

export interface FieldScreeningInput {
  client_record_id: string;
  citizen_user_id?: string;
  citizen_name: string;
  age: number;
  gender: string;
  village: string;
  phone?: string;
  emergency_contact?: string;
  screening_date: string;
  systolic: number | null;
  systolic_status: string;
  diastolic: number | null;
  diastolic_status: string;
  pulse: number | null;
  pulse_status: string;
  spo2: number | null;
  spo2_status: string;
  temperature: number | null;
  temperature_status: string;
  glucose: number | null;
  glucose_status: string;
  weight: number | null;
  weight_status: string;
  height: number | null;
  height_status: string;
  known_conditions: string[];
  allergies: string[];
  current_medicines: string[];
  symptoms: string[];
  notes?: string;
}

export class WorkerService {
  public evaluateRisk(input: FieldScreeningInput): { riskLevel: string; riskFlags: string[] } {
    const flags: string[] = [];
    let maxSeverity: 'NORMAL' | 'NEEDS_REVIEW' | 'PRIORITY' | 'URGENT' = 'NORMAL';

    // 1. SpO2 Check
    if (input.spo2_status === 'MEASURED' && input.spo2 !== null) {
      if (input.spo2 < 90) {
        flags.push('Urgent medical attention recommended (Critical oxygen level: < 90% SpO2)');
        maxSeverity = 'URGENT';
      } else if (input.spo2 < 95) {
        flags.push('Medical review recommended (Mild oxygen saturation depression: < 95% SpO2)');
        if (maxSeverity === 'NORMAL') maxSeverity = 'NEEDS_REVIEW';
      }
    }

    // 2. Blood Pressure Check
    const sys = input.systolic;
    const dia = input.diastolic;
    const bpMeasured = input.systolic_status === 'MEASURED' && input.diastolic_status === 'MEASURED' && sys !== null && dia !== null;

    if (bpMeasured) {
      if (sys > 180 || dia > 120) {
        flags.push('Urgent medical attention recommended (Severe Hypertension reading - emergency review required)');
        maxSeverity = 'URGENT';
      } else if (sys > 140 || dia > 90) {
        flags.push('Medical review recommended (Elevated Blood Pressure reading)');
        if (maxSeverity === 'NORMAL') maxSeverity = 'NEEDS_REVIEW';
      }
    }

    // 3. Symptoms Check
    const symptoms = input.symptoms || [];
    if (symptoms.includes('Chest Pain') || symptoms.includes('Difficulty Breathing')) {
      flags.push('Urgent medical attention recommended (Concerning symptoms: chest pain or breathing difficulty)');
      maxSeverity = 'URGENT';
    }

    // 4. Pregnancy Specifics
    const conditions = input.known_conditions || [];
    const isPregnant = conditions.includes('Pregnancy');
    if (isPregnant) {
      const hasConcerningBP = bpMeasured && (sys > 140 || dia > 90);
      const hasConcerningSymptoms = symptoms.includes('Severe Headache') || symptoms.includes('Dizziness') || symptoms.includes('Severe Abdominal Pain') || symptoms.includes('Vomiting');
      
      if (hasConcerningBP) {
        flags.push('Priority assessment recommended (Elevated BP in Pregnancy)');
        if (maxSeverity !== 'URGENT') maxSeverity = 'PRIORITY';
      }
      if (hasConcerningSymptoms) {
        flags.push('Priority assessment recommended (Severe symptoms reported in Pregnancy)');
        if (maxSeverity !== 'URGENT') maxSeverity = 'PRIORITY';
      }
    }

    // 5. Temperature Check
    if (input.temperature_status === 'MEASURED' && input.temperature !== null && input.temperature > 100.4) {
      flags.push('Medical review recommended (Fever detected)');
      if (maxSeverity === 'NORMAL') maxSeverity = 'NEEDS_REVIEW';
    }

    // 6. Blood Glucose Check
    if (input.glucose_status === 'MEASURED' && input.glucose !== null) {
      if (input.glucose > 250 || input.glucose < 70) {
        flags.push('Medical review recommended (Uncontrolled blood sugar reading)');
        if (maxSeverity === 'NORMAL') maxSeverity = 'NEEDS_REVIEW';
      }
    }

    return {
      riskLevel: maxSeverity,
      riskFlags: flags,
    };
  }

  public async registerCitizen(data: {
    name: string;
    age: number;
    gender: string;
    village: string;
    phone?: string;
    emergency_contact?: string;
  }): Promise<any> {
    const abhaId = `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const phoneOrId = data.phone || `uid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const email = `citizen.${phoneOrId}@arogyamitra.local`;
    
    // Check if citizen exists (either by phone or by name+village matches to prevent double register)
    const existing = await userRepository.findByEmail(email);
    if (existing) return existing;

    const user = await userRepository.createUser({
      name: data.name,
      email,
      role: 'ROLE_CITIZEN',
      abhaId,
      jurisdiction: data.village,
    });
    return user;
  }

  public async ingestScreening(workerId: string, input: FieldScreeningInput): Promise<any> {
    let citizenId = input.citizen_user_id;

    // Register citizen if not exists
    if (!citizenId) {
      const newUser = await this.registerCitizen({
        name: input.citizen_name,
        age: input.age,
        gender: input.gender,
        village: input.village,
        phone: input.phone,
        emergency_contact: input.emergency_contact,
      });
      citizenId = newUser.id;
    }

    const { riskLevel, riskFlags } = this.evaluateRisk(input);
    const dbRecord: ScreeningRecord = {
      id: `scr-${crypto.randomUUID().substring(0, 20)}`,
      client_record_id: input.client_record_id,
      worker_user_id: workerId,
      citizen_user_id: citizenId || '',
      citizen_name: input.citizen_name,
      village: input.village,
      screening_date: new Date(input.screening_date),
      systolic: input.systolic_status === 'MEASURED' ? input.systolic : null,
      systolic_status: input.systolic_status,
      diastolic: input.diastolic_status === 'MEASURED' ? input.diastolic : null,
      diastolic_status: input.diastolic_status,
      pulse: input.pulse_status === 'MEASURED' ? input.pulse : null,
      pulse_status: input.pulse_status,
      spo2: input.spo2_status === 'MEASURED' ? input.spo2 : null,
      spo2_status: input.spo2_status,
      temperature: input.temperature_status === 'MEASURED' ? input.temperature : null,
      temperature_status: input.temperature_status,
      glucose: input.glucose_status === 'MEASURED' ? input.glucose : null,
      glucose_status: input.glucose_status,
      weight: input.weight_status === 'MEASURED' ? input.weight : null,
      weight_status: input.weight_status,
      height: input.height_status === 'MEASURED' ? input.height : null,
      height_status: input.height_status,
      known_conditions: JSON.stringify(input.known_conditions || []),
      allergies: JSON.stringify(input.allergies || []),
      current_medicines: JSON.stringify(input.current_medicines || []),
      symptoms: JSON.stringify(input.symptoms || []),
      risk_flags: JSON.stringify(riskFlags),
      risk_level: riskLevel,
    };

    const created = await screeningRepository.create(dbRecord);
    try {
      emitAshaScreeningEvent('asha_screening_created', {
        recordId: created.id,
        workerId,
        timestamp: new Date().toISOString(),
        riskLevel: created.risk_level,
      });
    } catch { /* non-blocking */ }
    return created;
  }

  public async syncScreenings(workerId: string, screenings: FieldScreeningInput[]): Promise<any[]> {
    const results: any[] = [];
    for (const scr of screenings) {
      try {
        const res = await this.ingestScreening(workerId, scr);
        results.push({ client_record_id: scr.client_record_id, status: 'SUCCESS', id: res.id });
        try {
          emitAshaScreeningEvent('asha_screening_synced', {
            recordId: res.id,
            workerId,
            timestamp: new Date().toISOString(),
            riskLevel: res.risk_level,
          });
        } catch { /* non-blocking */ }
      } catch (err: any) {
        results.push({ client_record_id: scr.client_record_id, status: 'FAILED', error: err.message });
      }
    }
    return results;
  }
}

export const workerService = new WorkerService();
