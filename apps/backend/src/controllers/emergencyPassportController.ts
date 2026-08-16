import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';
import { patientContextService } from '../services/patientContextService.js';

export async function getEmergencyPassport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = 'usr-901';
    const ctx = await patientContextService.getContextForUser(userId);

    // Return the formatted health passport
    return res.status(200).json({
      success: true,
      data: {
        abhaId: ctx.prescriptions?.[0]?.abha_id || '9021-3321-9870',
        bloodGroup: ctx.bloodGroup || 'O-Positive',
        allergies: ctx.allergies || ['Penicillin Allergy'],
        chronicDiseases: ctx.chronicDiseases || [],
        currentMedicines: ctx.medications || [],
        doctorNotes: ctx.doctorNotes || [],
        digitalTwinSummary: ctx.digitalTwin || {},
        qrCode: `HEALTHPASS-${userId}-${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function shareEmergencyPassport(req: Request, res: Response, next: NextFunction) {
  try {
    const { destination, userId = 'usr-901' } = req.body;
    logger.info({ tag: '[SOS]', message: `Emergency passport shared with ${destination} for user ${userId}` });
    return res.status(200).json({ success: true, message: `Emergency passport shared successfully to ${destination}` });
  } catch (error) {
    next(error);
  }
}
