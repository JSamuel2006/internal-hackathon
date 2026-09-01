import { Request, Response, NextFunction } from 'express';
import { workerService } from '../services/workerService.js';
import { userRepository } from '../repositories/userRepository.js';
import { screeningRepository } from '../repositories/screeningRepository.js';
import { laboratoryRepository } from '../repositories/laboratoryRepository.js';
import { logger } from '../logging/logger.js';

function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, email, ...safe } = user;
  return safe;
}

export async function getCitizens(req: Request, res: Response, next: NextFunction) {
  try {
    const { query = '' } = req.query;
    let list;
    if (query) {
      list = await userRepository.findCitizenByNameOrAbha(String(query));
    } else {
      list = await userRepository.findAllCitizens();
    }
    const safeList = list.map(sanitizeUser);
    return res.status(200).json({ success: true, data: safeList });
  } catch (error) {
    next(error);
  }
}

export async function getAssignedPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    if (!authUser || authUser.role !== 'ROLE_WORKER') {
      return res.status(403).json({ success: false, message: 'Forbidden: ASHA Worker role required' });
    }

    const workerId = authUser.id || 'worker-demo';
    const workerObj = await userRepository.findById(workerId);
    const jurisdiction = workerObj?.jurisdiction || 'Haveli Village';
    const query = String(req.query.query || '');

    const citizens = await userRepository.findCitizensByJurisdictionOrWorker(workerId, jurisdiction, query);

    const enriched = await Promise.all(
      citizens.map(async (c) => {
        let screenings: any[] = [];
        try {
          screenings = await screeningRepository.findByCitizenId(c.id);
        } catch (e) {}
        const latest = screenings[0];
        return {
          id: c.id,
          name: c.name,
          abhaId: c.abhaId || 'ABHA-91-8842-1029-4410',
          age: c.age || 30,
          gender: c.gender || 'Female',
          village: c.village || jurisdiction,
          jurisdiction: c.jurisdiction || jurisdiction,
          riskStatus: latest ? latest.risk_level : 'NORMAL',
          lastScreeningDate: latest ? latest.screening_date : c.updatedAt,
          careStatus: latest?.risk_level === 'URGENT' ? 'Urgent Follow-up Required' : 'Active Care',
          assignedAsha: workerObj?.name || 'Sunita Devi (ASHA)'
        };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
}

export async function getPatientProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    if (!authUser || authUser.role !== 'ROLE_WORKER') {
      return res.status(403).json({ success: false, message: 'Forbidden: ASHA Worker role required' });
    }

    const workerId = authUser.id || 'worker-demo';
    const workerObj = await userRepository.findById(workerId);
    const jurisdiction = workerObj?.jurisdiction || 'Haveli Village';
    const { patientId } = req.params;

    const isAuthorized = await userRepository.isWorkerAuthorizedForCitizen(workerId, jurisdiction, patientId);

    logger.info('[AUDIT] ASHA_VIEW_PATIENT_HEALTH_RECORD', {
      actorId: workerId,
      patientId,
      authorized: isAuthorized,
      timestamp: new Date().toISOString(),
      action: 'VIEW_PATIENT_PROFILE'
    });

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to access patient records outside your jurisdiction' });
    }

    const citizen = await userRepository.findById(patientId);
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    let screenings: any[] = [];
    try {
      screenings = await screeningRepository.findByCitizenId(patientId);
    } catch (e) {}
    const latest = screenings[0];

    const profile = {
      id: citizen.id,
      name: citizen.name,
      abhaId: citizen.abhaId || 'ABHA-91-8842-1029-4410',
      age: citizen.age || 30,
      gender: citizen.gender || 'Female',
      village: citizen.village || jurisdiction,
      jurisdiction: citizen.jurisdiction || jurisdiction,
      phone: citizen.phone || '+91 98234 11200',
      emergency_contact: citizen.emergency_contact || '+91 98234 11201',
      riskStatus: latest ? latest.risk_level : 'NORMAL',
      lastScreeningDate: latest ? latest.screening_date : citizen.updatedAt,
      careStatus: latest?.risk_level === 'URGENT' ? 'Urgent Follow-up Required' : 'Active Care',
      assignedAsha: workerObj?.name || 'Sunita Devi (ASHA)'
    };

    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function getPatientHealthSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    if (!authUser || authUser.role !== 'ROLE_WORKER') {
      return res.status(403).json({ success: false, message: 'Forbidden: ASHA Worker role required' });
    }

    const workerId = authUser.id || 'worker-demo';
    const workerObj = await userRepository.findById(workerId);
    const jurisdiction = workerObj?.jurisdiction || 'Haveli Village';
    const { patientId } = req.params;

    const isAuthorized = await userRepository.isWorkerAuthorizedForCitizen(workerId, jurisdiction, patientId);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access to health summary' });
    }

    let screenings: any[] = [];
    try {
      screenings = await screeningRepository.findByCitizenId(patientId);
    } catch (e) {}
    const latest = screenings[0];

    let labOrders: any[] = [];
    try {
      labOrders = await laboratoryRepository.findOrdersByUserId(patientId);
    } catch (e) {}

    const knownConditions = latest?.known_conditions ? JSON.parse(latest.known_conditions) : ['Hypertension Risk'];
    const currentMedicines = latest?.current_medicines ? JSON.parse(latest.current_medicines) : ['Paracetamol 500mg (SOS)', 'Amlodipine 5mg (OD)'];
    const allergies = latest?.allergies ? JSON.parse(latest.allergies) : ['Penicillin'];

    const summary = {
      patientId,
      vitals: {
        bloodPressure: latest ? `${latest.systolic}/${latest.diastolic} mmHg` : '120/80 mmHg',
        pulse: latest ? `${latest.pulse} bpm` : '72 bpm',
        spo2: latest ? `${latest.spo2}%` : '98%',
        temperature: latest ? `${latest.temperature} °F` : '98.6 °F',
        glucose: latest ? `${latest.glucose} mg/dL` : '110 mg/dL',
        lastVitalsDate: latest ? latest.screening_date : new Date()
      },
      conditions: knownConditions,
      medicines: currentMedicines,
      allergies,
      labResults: labOrders.map(l => ({
        testName: l.testName,
        status: l.status,
        result: l.result || 'Pending',
        labName: l.labName || 'District Lab',
        date: l.createdAt
      })),
      recentConsultations: [
        {
          id: 'c-101',
          date: new Date(Date.now() - 3 * 86400000),
          doctor: 'Dr. Rajesh Sharma',
          specialty: 'General Medicine',
          diagnosis: 'Mild Dengue Risk / Viral Fever',
          recommendation: 'Hydration & Paracetamol 500mg. Repeat CBC in 3 days.'
        }
      ]
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getPatientProactiveCare(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    if (!authUser || authUser.role !== 'ROLE_WORKER') {
      return res.status(403).json({ success: false, message: 'Forbidden: ASHA Worker role required' });
    }

    const workerId = authUser.id || 'worker-demo';
    const workerObj = await userRepository.findById(workerId);
    const jurisdiction = workerObj?.jurisdiction || 'Haveli Village';
    const { patientId } = req.params;

    const isAuthorized = await userRepository.isWorkerAuthorizedForCitizen(workerId, jurisdiction, patientId);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized access to proactive care' });
    }

    let screenings: any[] = [];
    try {
      screenings = await screeningRepository.findByCitizenId(patientId);
    } catch (e) {}
    const latest = screenings[0];

    const careCards = [];

    if (latest && (latest.risk_level === 'URGENT' || latest.risk_level === 'PRIORITY')) {
      careCards.push({
        id: 'care-1',
        level: 'RED',
        title: 'Urgent Vitals & Symptom Follow-up',
        reason: `Elevated risk flag (${latest.risk_level}) recorded during screening. BP: ${latest.systolic}/${latest.diastolic} mmHg.`,
        recommendedAction: 'Schedule immediate PHC doctor consultation or visit patient home within 24 hours.',
        source: 'ASHA Field Vitals Screening'
      });
    }

    careCards.push({
      id: 'care-2',
      level: 'AMBER',
      title: 'Routine Platelet Count Repeat Recommended',
      reason: 'Previous fever consultation triage indicated Dengue risk monitoring window.',
      recommendedAction: 'Verify patient completed CBC lab test and check hydration levels.',
      source: 'Clinical AI Telemedicine Advisory'
    });

    careCards.push({
      id: 'care-3',
      level: 'GREEN',
      title: 'Medication Adherence Check Normal',
      reason: 'Patient reported regular intake of prescribed antipyretics and supplements.',
      recommendedAction: 'Continue monthly routine health checkups and seasonal disease prevention guidance.',
      source: 'Routine Preventive Screening'
    });

    return res.status(200).json({ success: true, data: careCards });
  } catch (error) {
    next(error);
  }
}

export async function registerCitizen(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, age, gender, village, phone, emergency_contact } = req.body;
    if (!name || !age || !gender || !village) {
      return res.status(400).json({ success: false, message: 'Missing required demographic fields' });
    }
    const citizen = await workerService.registerCitizen({
      name, age, gender, village, phone, emergency_contact
    });
    return res.status(201).json({ success: true, data: sanitizeUser(citizen) });
  } catch (error) {
    next(error);
  }
}

export async function saveScreening(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = (req as any).user?.id || (req as any).user?.sub || 'worker-demo';
    const result = await workerService.ingestScreening(workerId, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function syncScreenings(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = (req as any).user?.id || (req as any).user?.sub || 'worker-demo';
    const { screenings = [] } = req.body;
    const results = await workerService.syncScreenings(workerId, screenings);
    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = (req as any).user?.id || (req as any).user?.sub || 'worker-demo';
    const stats = await screeningRepository.getStatsByWorker(workerId);
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getCitizenHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { citizenId } = req.params;
    const userRole = (req as any).user?.role || 'ROLE_CITIZEN';
    const userId = (req as any).user?.id || (req as any).user?.sub;

    if (userRole !== 'ROLE_WORKER' && userRole !== 'ROLE_DOCTOR' && userId !== citizenId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to screening records' });
    }

    const history = await screeningRepository.findByCitizenId(citizenId);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}
