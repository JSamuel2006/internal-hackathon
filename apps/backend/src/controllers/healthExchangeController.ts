import { Request, Response, NextFunction } from 'express';
import { healthExchangeService } from '../services/healthExchangeService.js';

export async function getInteropProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await healthExchangeService.getProfile('usr-901');
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function createInteropProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { abhaAddress = 'citizen@abha' } = req.body;
    const profile = await healthExchangeService.createProfile('usr-901', abhaAddress);
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function getFHIRBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const bundle = await healthExchangeService.compileFHIRBundle('usr-901');
    return res.status(200).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
}

export async function exportFHIRBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const bundle = await healthExchangeService.exportFHIRRecord('usr-901');
    return res.status(200).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
}

export async function importFHIRBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const { bundle } = req.body;
    await healthExchangeService.importFHIRRecord('usr-901', bundle);
    return res.status(200).json({ success: true, message: 'FHIR bundle imported successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getExchangeHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await healthExchangeService.getProfile('usr-901');
    return res.status(200).json({ success: true, data: profile.syncTimeline });
  } catch (error) {
    next(error);
  }
}

export async function updateExchangeConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const { consentId, action } = req.body;
    const profile = await healthExchangeService.updateConsent('usr-901', consentId, action);
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function getConsentHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await healthExchangeService.getProfile('usr-901');
    return res.status(200).json({ success: true, data: profile.consents });
  } catch (error) {
    next(error);
  }
}
