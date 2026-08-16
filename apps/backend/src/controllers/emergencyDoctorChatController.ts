import { Request, Response, NextFunction } from 'express';
import { emergencyDoctorChatService } from '../services/emergencyDoctorChatService.js';
import { logger } from '../logging/logger.js';

import { pool } from '../database/db.js';

function getVerifiedUser(req: Request) {
  const user = (req as any).user;
  if (!user || !user.id) {
    const err: any = new Error('Unauthorized: JWT user identity missing');
    err.status = 401;
    throw err;
  }
  return user;
}

function verifyDoctorRole(req: Request) {
  const user = getVerifiedUser(req);
  if (user.role !== 'ROLE_DOCTOR') {
    const err: any = new Error('Forbidden: Only qualified doctors can perform this operation');
    err.status = 403;
    throw err;
  }
  return user;
}

function safeHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
      }
      next(err);
    }
  };
}

// GET /api/v1/emergency-network/session/:id/doctor-status
export const getDoctorAssistanceStatus = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;

  // Verify session ownership
  const sessionRes = await pool.query('SELECT user_id FROM emergency_sessions WHERE id = $1', [sessionId]);
  if (sessionRes.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }
  if (sessionRes.rows[0].user_id !== user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not own this emergency session' });
  }

  // Fetch active request
  const reqRes = await pool.query(
    'SELECT id, status, doctor_id FROM emergency_doctor_requests WHERE emergency_id = $1 ORDER BY requested_at DESC LIMIT 1',
    [sessionId]
  );
  if (reqRes.rows.length === 0) {
    return res.status(200).json({ success: true, data: null });
  }

  const request = reqRes.rows[0];
  let doctorObj: any = null;

  if (request.doctor_id) {
    const docQuery = await pool.query(
      `SELECT d.id, d.name, d.specialty, h.name as hospital_name 
       FROM doctors d 
       LEFT JOIN hospitals h ON d.hospital_id = h.id 
       WHERE d.id = $1`,
      [request.doctor_id]
    );
    if (docQuery.rows.length > 0) {
      const docRow = docQuery.rows[0];
      doctorObj = {
        id: docRow.id,
        name: docRow.name,
        specialty: docRow.specialty,
        hospital: docRow.hospital_name || 'Government General Hospital'
      };
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      requestId: request.id,
      status: request.status,
      doctor: doctorObj
    }
  });
});

// POST /api/v1/emergency-network/session/:id/doctor-assistance
export const requestDoctorAssistance = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;

  const result = await emergencyDoctorChatService.createRequest(sessionId, user.id);

  return res.status(201).json({
    success: true,
    data: result,
    message: 'Doctor assistance request created. Doctors in the region have been notified.',
  });
});

// GET /api/v1/emergency-network/doctor/requests
export const getDoctorRequests = safeHandler(async (req, res) => {
  const user = verifyDoctorRole(req);
  const doctorId = user.id.startsWith('usr-') ? 'doc-demo' : user.id;

  const list = await emergencyDoctorChatService.getDoctorQueue(doctorId);

  return res.status(200).json({ success: true, data: list });
});

// POST /api/v1/emergency-network/doctor/requests/:requestId/accept
export const acceptDoctorRequest = safeHandler(async (req, res) => {
  const user = verifyDoctorRole(req);
  const doctorId = user.id.startsWith('usr-') ? 'doc-demo' : user.id;
  const { requestId } = req.params;

  const result = await emergencyDoctorChatService.acceptRequest(requestId, doctorId);

  return res.status(200).json({
    success: true,
    data: result,
    message: 'Request accepted. Chat session is now active.',
  });
});

// POST /api/v1/emergency-network/doctor/requests/:requestId/decline
export const declineDoctorRequest = safeHandler(async (req, res) => {
  const user = verifyDoctorRole(req);
  const doctorId = user.id.startsWith('usr-') ? 'doc-demo' : user.id;
  const { requestId } = req.params;

  await emergencyDoctorChatService.declineRequest(requestId, doctorId);

  return res.status(200).json({
    success: true,
    message: 'Request declined and returned to active queue.',
  });
});

// GET /api/v1/emergency-network/doctor/requests/:requestId/messages
export const getChatMessages = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { requestId } = req.params;
  const resolvedId = (user.role === 'ROLE_DOCTOR' && user.id.startsWith('usr-')) ? 'doc-demo' : user.id;

  const messages = await emergencyDoctorChatService.getMessages(requestId, resolvedId, user.role);

  return res.status(200).json({ success: true, data: messages });
});

// POST /api/v1/emergency-network/doctor/requests/:requestId/messages
export const sendChatMessage = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { requestId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }

  const resolvedId = (user.role === 'ROLE_DOCTOR' && user.id.startsWith('usr-')) ? 'doc-demo' : user.id;

  const result = await emergencyDoctorChatService.sendMessage({
    requestId,
    senderId: resolvedId,
    senderRole: user.role,
    message: String(message),
  });

  return res.status(201).json({ success: true, data: result });
});

// POST /api/v1/emergency-network/doctor/requests/:requestId/close
export const closeDoctorRequest = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { requestId } = req.params;
  const resolvedId = (user.role === 'ROLE_DOCTOR' && user.id.startsWith('usr-')) ? 'doc-demo' : user.id;

  await emergencyDoctorChatService.closeRequest(requestId, resolvedId, user.role);

  return res.status(200).json({
    success: true,
    message: 'Conversation closed successfully.',
  });
});

// GET /api/v1/emergency-network/doctor/requests/:requestId/context
export const getEmergencyContext = safeHandler(async (req, res) => {
  const user = verifyDoctorRole(req);
  const { requestId } = req.params;
  const doctorId = user.id.startsWith('usr-') ? 'doc-demo' : user.id;

  const context = await emergencyDoctorChatService.getEmergencyContext(requestId, doctorId);

  return res.status(200).json({ success: true, data: context });
});

// GET /api/v1/emergency-network/doctor/requests/:requestId/ai-summary
export const getChatSummary = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req); // either doctor or citizen
  const { requestId } = req.params;

  const summary = await emergencyDoctorChatService.generateAIHandoffSummary(requestId);

  return res.status(200).json({ success: true, summary });
});
