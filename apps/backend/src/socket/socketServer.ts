import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { authenticateSocket, AuthenticatedSocket } from './socketAuth.js';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';

let io: Server | null = null;

export function initializeSocketServer(server: HTTPServer) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(authenticateSocket as any);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return socket.disconnect();

    logger.info({ tag: '[SOCKET]', message: `Socket connected: ${socket.id} (User: ${user.id}, Role: ${user.role})` });

    if (user.role === 'ROLE_DOCTOR') {
      socket.join(`doctor:${user.id}`);
      socket.join('doctors');
    } else if (user.role === 'ROLE_CITIZEN') {
      socket.join(`citizen:${user.id}`);
    }

    socket.on('join_session', async ({ sessionId }, callback) => {
      try {
        if (user.role === 'ROLE_CITIZEN') {
          const sessionRes = await pool.query(
            'SELECT user_id FROM emergency_sessions WHERE id = $1',
            [sessionId]
          );
          if (sessionRes.rows.length > 0 && sessionRes.rows[0].user_id === user.id) {
            socket.join(`session:${sessionId}`);
            if (callback) callback({ success: true });
            logger.info({ tag: '[SOCKET]', message: `Citizen ${user.id} joined session room session:${sessionId}` });
          } else {
            if (callback) callback({ success: false, message: 'Forbidden' });
          }
        } else if (user.role === 'ROLE_DOCTOR') {
          const requestRes = await pool.query(
            "SELECT id FROM emergency_doctor_requests WHERE emergency_id = $1 AND doctor_id = $2 AND status = 'ACCEPTED'",
            [sessionId, user.id]
          );
          if (requestRes.rows.length > 0) {
            socket.join(`session:${sessionId}`);
            if (callback) callback({ success: true });
            logger.info({ tag: '[SOCKET]', message: `Doctor ${user.id} joined session room session:${sessionId}` });
          } else {
            if (callback) callback({ success: false, message: 'Forbidden' });
          }
        }
      } catch (err) {
        logger.error({ tag: '[SOCKET]', message: 'Error in join_session', error: err });
        if (callback) callback({ success: false, message: 'Server error' });
      }
    });

    socket.on('disconnect', () => {
      logger.info({ tag: '[SOCKET]', message: `Socket disconnected: ${socket.id}` });
    });
  });

  return io;
}

export function getSocketIO() {
  return io;
}

export function emitEmergencyRequestCreated(request: any) {
  if (!io) return;
  
  const payload = {
    requestId: request.id,
    emergencyId: request.emergencyId || request.emergency_id,
    citizenUserId: request.citizenUserId || request.citizen_user_id,
    priority: request.priority,
    status: request.status,
    requestedAt: request.requestedAt || request.requested_at,
  };

  const docId = request.doctorId || request.doctor_id;
  if (docId) {
    io.to(`doctor:${docId}`).emit('emergency_request_created', payload);
    logger.info({ tag: '[SOCKET]', message: `Emitted emergency_request_created to doctor:${docId}` });
  } else {
    io.to('doctors').emit('emergency_request_created', payload);
    logger.info({ tag: '[SOCKET]', message: 'Emitted emergency_request_created to doctors room' });
  }
}

export function emitEmergencyRequestUpdated(request: any) {
  if (!io) return;

  const payload = {
    requestId: request.id || request.requestId,
    emergencyId: request.emergency_id || request.emergencyId,
    status: request.status,
    doctorId: request.doctor_id || request.doctorId,
  };

  const docId = request.doctor_id || request.doctorId;
  if (docId) {
    io.to(`doctor:${docId}`).emit('emergency_request_updated', payload);
  }
}

export function emitRequestStatusUpdated(sessionId: string, status: string, doctorInfo?: any) {
  if (!io) return;
  io.to(`session:${sessionId}`).emit('doctor_request_status_updated', {
    sessionId,
    status,
    doctor: doctorInfo,
  });
  logger.info({ tag: '[SOCKET]', message: `Emitted doctor_request_status_updated for session:${sessionId}` });
}

export function emitChatMessage(sessionId: string, message: any) {
  if (!io) return;
  io.to(`session:${sessionId}`).emit('emergency_chat_message', message);
}
