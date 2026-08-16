import { Request, Response, NextFunction } from 'express';
import { medicalReportRepository } from '../repositories/medicalReportRepository.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { logger } from '../logging/logger.js';

function getFriendlyType(type: string, name?: string): string {
  switch (type) {
    case 'MEDICINE_SCAN':
      return 'Medicine Scan';
    case 'DISEASE_PREDICTION':
      return 'Disease Risk Assessment';
    case 'HEALTH_SIMULATION':
      return 'Health Journey Simulation';
    case 'USER_PROFILE':
      return 'Health Profile Update';
    case 'ABHA_INTEROPERABILITY':
      return 'ABHA Sync';
    case 'APPOINTMENT':
      return 'Doctor Appointment';
    default:
      return name || 'Medical Report Analysis';
  }
}

export async function handleGetTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User session not found.'
      });
    }

    logger.info({ tag: '[TIMELINE_API]', message: 'Fetching health timeline', userId });

    // Fetch real data from DB
    const [reports, appointments] = await Promise.all([
      medicalReportRepository.findByUserId(userId),
      appointmentRepository.findByUserId(userId)
    ]);

    // Normalize timeline records
    const normalizedEvents: any[] = [];

    reports.forEach((r) => {
      let desc = 'Medical records successfully parsed and analyzed.';
      if (r.reportType === 'MEDICINE_SCAN') {
        desc = 'Medicine scan successfully processed and matched with local drug formulary.';
      } else if (r.reportType === 'DISEASE_PREDICTION') {
        desc = 'Cardiovascular and metabolic multi-system disease risk estimation completed.';
      } else if (r.reportType === 'HEALTH_SIMULATION') {
        desc = 'Clinical trajectory progression simulation generated.';
      } else if (r.reportType === 'USER_PROFILE') {
        desc = 'Health Profile and baseline telemetry updated.';
      }

      normalizedEvents.push({
        id: r.id,
        type: r.reportType || 'MEDICAL_REPORT',
        displayType: getFriendlyType(r.reportType || 'MEDICAL_REPORT', r.reportName),
        title: r.reportName || getFriendlyType(r.reportType || 'MEDICAL_REPORT', r.reportName),
        description: desc,
        timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        status: r.status || 'completed',
        metadata: {
          hospitalName: r.hospitalName,
          doctorName: r.doctorName,
          reportDate: r.reportDate,
          healthScore: r.healthScore,
          riskLevel: r.riskLevel,
          specialistRecommended: r.specialistRecommended,
          confidenceScore: r.confidenceScore,
          ocrText: r.ocrText,
          structuredJson: r.structuredJson,
          abnormalValues: r.abnormalValues,
          geminiAnalysis: r.geminiAnalysis
        },
        source: 'medical_reports'
      });
    });

    appointments.forEach((a) => {
      normalizedEvents.push({
        id: a.id,
        type: 'APPOINTMENT',
        displayType: 'Doctor Appointment',
        title: `Appointment with Dr. ${a.doctorName || 'Specialist'}`,
        description: `Scheduled consultation at ${a.hospitalName || 'Clinic'}.`,
        timestamp: a.createdAt ? new Date(a.createdAt).toISOString() : new Date(`${a.date}T${a.time || '12:00:00'}`).toISOString(),
        status: a.status || 'completed',
        metadata: {
          doctorName: a.doctorName,
          hospitalName: a.hospitalName,
          date: a.date,
          time: a.time
        },
        source: 'appointments'
      });
    });

    // Apply Search
    const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';
    let filteredEvents = normalizedEvents;
    if (search) {
      filteredEvents = filteredEvents.filter((e) => {
        const titleMatch = e.title?.toLowerCase().includes(search);
        const descMatch = e.description?.toLowerCase().includes(search);
        const typeMatch = e.displayType?.toLowerCase().includes(search);
        
        // Metadata fields match
        const docMatch = e.metadata?.doctorName?.toLowerCase().includes(search);
        const hospMatch = e.metadata?.hospitalName?.toLowerCase().includes(search);
        
        // Scan details match
        let structuredMatch = false;
        if (e.metadata?.structuredJson) {
          try {
            const parsed = typeof e.metadata.structuredJson === 'string' 
              ? JSON.parse(e.metadata.structuredJson) 
              : e.metadata.structuredJson;
            structuredMatch = JSON.stringify(parsed).toLowerCase().includes(search);
          } catch (_) {}
        }
        
        return titleMatch || descMatch || typeMatch || docMatch || hospMatch || structuredMatch;
      });
    }

    // Apply Type Filter
    const type = req.query.type;
    if (type && type !== 'All') {
      filteredEvents = filteredEvents.filter((e) => {
        if (type === 'Medicine Scans') return e.type === 'MEDICINE_SCAN';
        if (type === 'Disease Predictions') return e.type === 'DISEASE_PREDICTION';
        if (type === 'Health Assessments') return e.type === 'USER_PROFILE' || e.type === 'HEALTH_SIMULATION';
        if (type === 'Reports') return e.type === 'MEDICAL_REPORT' || (e.source === 'medical_reports' && e.type !== 'MEDICINE_SCAN' && e.type !== 'DISEASE_PREDICTION' && e.type !== 'USER_PROFILE' && e.type !== 'HEALTH_SIMULATION');
        if (type === 'Appointments') return e.type === 'APPOINTMENT';
        return e.type === type;
      });
    }

    // Apply Status Filter
    const status = req.query.status;
    if (status && status !== 'All') {
      filteredEvents = filteredEvents.filter((e) => e.status?.toLowerCase() === (status as string).toLowerCase());
    }

    // Apply Date Filter / Range
    const from = req.query.from;
    const to = req.query.to;
    if (from) {
      const fromDate = new Date(from as string);
      filteredEvents = filteredEvents.filter((e) => new Date(e.timestamp) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to as string);
      // set to end of day
      toDate.setHours(23, 59, 59, 999);
      filteredEvents = filteredEvents.filter((e) => new Date(e.timestamp) <= toDate);
    }

    // Apply Sorting
    const sort = req.query.sort || 'newest';
    filteredEvents.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sort === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const total = filteredEvents.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedEvents = filteredEvents.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      data: paginatedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error: any) {
    logger.error({ tag: '[TIMELINE_API_ERROR]', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'An internal error occurred while fetching your health timeline.'
    });
  }
}
