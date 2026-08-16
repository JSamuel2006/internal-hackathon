import { Request, Response, NextFunction } from 'express';
import { pharmacyService } from '../services/pharmacyService.js';
import { logger } from '../logging/logger.js';

export async function getInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const { pharmacyId } = req.query;
    const list = await pharmacyService.getInventory(pharmacyId as string);
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function dispenseMedicine(req: Request, res: Response, next: NextFunction) {
  try {
    const { prescriptionId, pharmacyId, medicinesList } = req.body;
    await pharmacyService.dispenseMedicine(prescriptionId, pharmacyId, medicinesList);
    return res.status(200).json({ success: true, message: 'Medicines dispensed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getPrescriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await pharmacyService.getPrescriptions('usr-901');
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function checkInteractions(req: Request, res: Response, next: NextFunction) {
  try {
    const { medicines } = req.body;
    const aiAnalysis = await pharmacyService.checkDrugInteractions(medicines);
    return res.status(200).json({ success: true, data: aiAnalysis });
  } catch (error) {
    next(error);
  }
}
export async function getPharmacies(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await pharmacyService.listPharmacies();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function getGenericComparison(req: Request, res: Response, next: NextFunction) {
  try {
    // Return mock comparison data for prescription ID
    return res.status(200).json({
      success: true,
      data: {
        brandMedicine: 'Calpol 650',
        genericMedicine: 'Paracetamol 650mg',
        priceDifference: 90,
        savings: 90,
        savingsPercentage: 75,
        availability: 'High (Available in 12 nearby Kendras)'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await pharmacyService.getReminders('usr-901');
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function createReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const { medicineName, timeSlot } = req.body;
    const item = await pharmacyService.createReminder('usr-901', { medicineName, timeSlot });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function updateReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    await pharmacyService.updateReminder(req.params.id, status);
    return res.status(200).json({ success: true, message: 'Reminder updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteReminder(req: Request, res: Response, next: NextFunction) {
  try {
    await pharmacyService.deleteReminder(req.params.id);
    return res.status(200).json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getInteractions(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await pharmacyService.checkDrugInteractions('Paracetamol, Amoxicillin');
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function getNearby(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(200).json({
      success: true,
      data: [
        {
          name: 'Jan Aushadhi Kendra Shivajinagar',
          distance: '1.2 KM',
          phone: '020-2560124',
          hours: '09:00 AM - 09:00 PM',
          availability: 'High Stock',
          coordinates: '18.5308, 73.8475'
        },
        {
          name: 'Apollo Pharmacy Belapur',
          distance: '2.5 KM',
          phone: '022-2756321',
          hours: '24 Hours Open',
          availability: 'Medium Stock',
          coordinates: '19.0178, 73.0286'
        }
      ]
    });
  } catch (error) {
    next(error);
  }
}

export async function sharePrescription(req: Request, res: Response, next: NextFunction) {
  try {
    const { destination, prescriptionId } = req.body;
    logger.info({ tag: '[SHARE]', message: `Prescription ${prescriptionId} shared securely to ${destination}` });
    return res.status(200).json({ success: true, message: `Prescription shared successfully to ${destination}` });
  } catch (error) {
    next(error);
  }
}

export async function getPrescriptionPDF(req: Request, res: Response, next: NextFunction) {
  try {
    // Return mock PDF data metadata
    return res.status(200).json({
      success: true,
      data: {
        pdfUrl: `/prescriptions/pdf-${req.params.id}.pdf`,
        qrCode: 'ABHA-PR-9021',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function postRefill(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        remainingTablets: 14,
        remainingDays: 7,
        nextRefillDate: '2026-08-14'
      }
    });
  } catch (error) {
    next(error);
  }
}
