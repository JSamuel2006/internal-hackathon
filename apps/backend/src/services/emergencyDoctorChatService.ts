import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';
import { patientContextService } from './patientContextService.js';
import { geminiService } from './ai-services/geminiService.js';
import { emitEmergencyRequestCreated, emitEmergencyRequestUpdated, emitRequestStatusUpdated, emitChatMessage } from '../socket/socketServer.js';

export interface DoctorRequestEntity {
  id: string;
  emergencyId: string;
  citizenUserId: string;
  doctorId: string | null;
  priority: string;
  status: string;
  requestedAt: Date;
  acceptedAt?: Date;
  closedAt?: Date;
}

export interface ChatMessageEntity {
  id: string;
  emergencyId: string;
  conversationId: string;
  senderUserId: string;
  senderRole: string; // CITIZEN, DOCTOR, SYSTEM
  message: string;
  originalText?: string;
  originalLanguage?: string;
  translatedText?: string;
  translatedLanguage?: string;
  translations?: Record<string, string>;
  translationStatus?: string;
  createdAt: Date;
  readAt?: Date;
}

export class EmergencyDoctorChatService {
  // ── Citizens: Request Assistance ─────────────────────────────

  async createRequest(sessionId: string, requestingUserId: string): Promise<DoctorRequestEntity> {
    // 1. Verify session exists and is owned by citizen
    const sessionRes = await pool.query('SELECT user_id, status FROM emergency_sessions WHERE id = $1', [sessionId]);
    if (sessionRes.rows.length === 0) {
      const err: any = new Error('Emergency session not found');
      err.status = 404;
      throw err;
    }
    if (sessionRes.rows[0].user_id !== requestingUserId) {
      const err: any = new Error('Forbidden: You do not own this emergency session');
      err.status = 403;
      throw err;
    }

    // 2. Prevent duplicate requests for same session
    const dupCheck = await pool.query(
      'SELECT * FROM emergency_doctor_requests WHERE emergency_id = $1 AND status != \'CLOSED\' AND status != \'CANCELLED\'',
      [sessionId]
    );
    if (dupCheck.rows.length > 0) {
      const err: any = new Error('Active doctor request already exists for this emergency session');
      err.status = 409;
      throw err;
    }

    // 3. Retrieve priority
    const classRes = await pool.query('SELECT priority, category, summary FROM emergency_classifications WHERE emergency_id = $1', [sessionId]);
    const priority = classRes.rows[0]?.priority || 'LOW';
    const category = classRes.rows[0]?.category || 'GENERAL';
    const summaryData = classRes.rows[0]?.summary ? JSON.parse(classRes.rows[0].summary) : {};
    const symptoms = summaryData.symptoms || [];

    // Find an eligible available doctor
    const docQuery = await pool.query(
      "SELECT id FROM doctors WHERE availability = 'AVAILABLE' ORDER BY created_at ASC LIMIT 1"
    );
    const assignedDoctorId = docQuery.rows[0]?.id || null;

    const requestId = `edr-${Date.now()}`;
    await pool.query(
      `INSERT INTO emergency_doctor_requests (id, emergency_id, citizen_user_id, doctor_id, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [requestId, sessionId, requestingUserId, assignedDoctorId, priority, 'REQUESTED']
    );

    // 4. Send high priority notification to the assigned doctor (or all doctors if unassigned)
    const notifyId = `ntf-${Date.now()}`;
    const notificationMsg = `🚨 Emergency Doctor Assistance Request. Priority: ${priority}. Category: ${category}. Reported symptoms: ${symptoms.join(', ')}`;
    
    if (assignedDoctorId) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, message, category, priority)
         VALUES ($1, $2, '🚨 Emergency Doctor Request', $3, 'EMERGENCY', 'Critical')`,
        [`${notifyId}-${assignedDoctorId}`, assignedDoctorId, notificationMsg]
      );
    } else {
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, message, category, priority)
         SELECT $1 || '-' || id, id, '🚨 Emergency Doctor Request', $2, 'EMERGENCY', 'Critical'
         FROM doctors`,
        [notifyId, notificationMsg]
      );
    }

    // Write system log event
    await pool.query(
      `INSERT INTO emergency_events (id, emergency_id, event_type, description, actor)
       VALUES ($1, $2, 'DOCTOR_REQUESTED', 'Citizen requested emergency doctor assistance', 'CITIZEN')`,
      [`ev-${Date.now()}-req`, sessionId]
    );

    logger.info({ tag: '[DOCTOR_CHAT]', message: `Doctor requested for session ${sessionId}, Request ID: ${requestId}, Assigned: ${assignedDoctorId}` });

    const result = {
      id: requestId,
      emergencyId: sessionId,
      citizenUserId: requestingUserId,
      doctorId: assignedDoctorId,
      priority,
      status: 'REQUESTED',
      requestedAt: new Date(),
    };

    // Emit event AFTER database persistence succeeded
    emitEmergencyRequestCreated(result);

    return result;
  }

  // ── Doctor Actions: Accept / Decline / Close ─────────────────

  async acceptRequest(requestId: string, doctorId: string): Promise<DoctorRequestEntity> {
    // All checks and updates run inside a single transaction.
    // SELECT ... FOR UPDATE locks the doctor row so two concurrent accept
    // calls cannot both pass the AVAILABLE check (double-booking guard).
    const acceptedAt = new Date();
    const client = await pool.connect();

    let doctorName = '';
    let requestEmergencyId = '';
    let requestCitizenUserId = '';
    let requestPriority = '';

    try {
      await client.query('BEGIN');

      // ── 1. Lock and verify doctor row atomically ────────────────
      const docRes = await client.query(
        'SELECT id, name, availability FROM doctors WHERE id = $1 FOR UPDATE',
        [doctorId]
      );
      if (docRes.rows.length === 0) {
        const err: any = new Error('Doctor profile not found');
        err.status = 404;
        throw err;
      }
      doctorName = docRes.rows[0].name;
      const availability = docRes.rows[0].availability || 'OFFLINE';

      if (availability !== 'AVAILABLE') {
        const err: any = new Error(
          `Cannot accept request: doctor status is ${availability} (must be AVAILABLE)`
        );
        err.status = 400;
        throw err;
      }

      // ── 2. Verify request exists and is still REQUESTED ─────────
      const reqRes = await client.query(
        'SELECT * FROM emergency_doctor_requests WHERE id = $1 FOR UPDATE',
        [requestId]
      );
      if (reqRes.rows.length === 0) {
        const err: any = new Error('Assistance request not found');
        err.status = 404;
        throw err;
      }
      const request = reqRes.rows[0];
      requestEmergencyId = request.emergency_id;
      requestCitizenUserId = request.citizen_user_id;
      requestPriority = request.priority;

      if (request.status !== 'REQUESTED') {
        const err: any = new Error('Request has already been accepted or is no longer available');
        err.status = 409;
        throw err;
      }

      // ── 3. Guard: request must not be claimed by a different doctor ─
      if (request.doctor_id && request.doctor_id !== doctorId) {
        const err: any = new Error('Request is already assigned to another doctor');
        err.status = 409;
        throw err;
      }

      // ── 4. Atomically accept the request and lock the doctor ────
      await client.query(
        `UPDATE emergency_doctor_requests
         SET status = 'ACCEPTED', doctor_id = $1, accepted_at = $2
         WHERE id = $3`,
        [doctorId, acceptedAt, requestId]
      );

      await client.query(
        'UPDATE doctors SET availability = $1 WHERE id = $2',
        ['IN_CONSULTATION', doctorId]
      );

      await client.query('COMMIT');
    } catch (txnErr) {
      await client.query('ROLLBACK');
      throw txnErr;
    } finally {
      client.release();
    }

    // ── 5. Post-transaction side effects (non-critical) ──────────
    await pool.query(
      `INSERT INTO emergency_events (id, emergency_id, event_type, description, actor)
       VALUES ($1, $2, 'DOCTOR_ACCEPTED', $3, 'DOCTOR')`,
      [`ev-${Date.now()}-acc`, requestEmergencyId, `Dr. ${doctorName} accepted assistance request`]
    );

    const msgId = `sysmsg-${Date.now()}`;
    await pool.query(
      `INSERT INTO emergency_chat_messages (id, emergency_id, conversation_id, sender_user_id, sender_role, message)
       VALUES ($1, $2, $3, 'SYSTEM', 'SYSTEM', $4)`,
      [
        msgId,
        requestEmergencyId,
        requestId,
        `Dr. ${doctorName} has joined the chat. Note: Healthcare advice provided here is human-in-the-loop clinical decision support. Always seek offline emergency care if symptoms are severe.`,
      ]
    );

    logger.info({
      tag: '[DOCTOR_CHAT]',
      message: `Doctor ${doctorId} accepted request ${requestId} for session ${requestEmergencyId}`,
    });

    const result = {
      id: requestId,
      emergencyId: requestEmergencyId,
      citizenUserId: requestCitizenUserId,
      doctorId,
      priority: requestPriority,
      status: 'ACCEPTED',
      requestedAt: new Date(),
      acceptedAt,
    };

    // Emit acceptance events
    const docInfo = { id: doctorId, name: doctorName };
    emitRequestStatusUpdated(requestEmergencyId, 'ACCEPTED', docInfo);
    emitEmergencyRequestUpdated({ id: requestId, emergencyId: requestEmergencyId, status: 'ACCEPTED', doctorId });

    return result;
  }

  async declineRequest(requestId: string, doctorId: string): Promise<void> {
    const reqRes = await pool.query('SELECT * FROM emergency_doctor_requests WHERE id = $1', [requestId]);
    if (reqRes.rows.length === 0) {
      const err: any = new Error('Assistance request not found');
      err.status = 404;
      throw err;
    }

    const request = reqRes.rows[0];
    if (request.status !== 'REQUESTED') {
      const err: any = new Error('Request cannot be declined as it is already active or closed');
      err.status = 400;
      throw err;
    }

    // Declining simply leaves request available for other doctors in SIH demo mode
    await pool.query(
      `INSERT INTO emergency_events (id, emergency_id, event_type, description, actor)
       VALUES ($1, $2, 'DOCTOR_DECLINED', 'Doctor declined request (returned to queue)', 'DOCTOR')`,
      [`ev-${Date.now()}-dec`, request.emergency_id]
    );
  }

  async closeRequest(requestId: string, userId: string, userRole: string): Promise<void> {
    const reqRes = await pool.query('SELECT * FROM emergency_doctor_requests WHERE id = $1', [requestId]);
    if (reqRes.rows.length === 0) {
      const err: any = new Error('Request not found');
      err.status = 404;
      throw err;
    }

    const request = reqRes.rows[0];

    // Access control: only the assigned doctor or the citizen owner can close it
    if (userRole === 'ROLE_DOCTOR') {
      if (request.doctor_id !== userId) {
        const err: any = new Error('Forbidden: You are not the assigned doctor for this request');
        err.status = 403;
        throw err;
      }
    } else {
      if (request.citizen_user_id !== userId) {
        const err: any = new Error('Forbidden: You do not own this request');
        err.status = 403;
        throw err;
      }
    }

    const closedAt = new Date();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE emergency_doctor_requests SET status = 'CLOSED', closed_at = $1 WHERE id = $2`,
        [closedAt, requestId]
      );

      // Only transition back to AVAILABLE if the closer is a doctor (or reset the assigned doctor's status)
      if (request.doctor_id) {
        await client.query('UPDATE doctors SET availability = $1 WHERE id = $2', ['AVAILABLE', request.doctor_id]);
      }

      await client.query('COMMIT');
    } catch (txnErr) {
      await client.query('ROLLBACK');
      throw txnErr;
    } finally {
      client.release();
    }

    // Send closing message
    await pool.query(
      `INSERT INTO emergency_chat_messages (id, emergency_id, conversation_id, sender_user_id, sender_role, message)
       VALUES ($1, $2, $3, 'SYSTEM', 'SYSTEM', 'This doctor assistance chat has been marked CLOSED.')`,
      [`sysmsg-${Date.now()}`, request.emergency_id, requestId]
    );

    await pool.query(
      `INSERT INTO emergency_events (id, emergency_id, event_type, description, actor)
       VALUES ($1, $2, 'DOCTOR_CLOSED', 'Doctor assistance chat closed', $3)`,
      [`ev-${Date.now()}-cls`, request.emergency_id, userRole === 'ROLE_DOCTOR' ? 'DOCTOR' : 'CITIZEN']
    );

    // Emit close events
    emitRequestStatusUpdated(request.emergency_id, 'CLOSED');
    emitEmergencyRequestUpdated({ id: requestId, emergencyId: request.emergency_id, status: 'CLOSED', doctorId: request.doctor_id });
  }

  // ── Messaging ────────────────────────────────────────────────

  // ── Messaging ────────────────────────────────────────────────

  async sendMessage(params: {
    requestId: string;
    senderId: string;
    senderRole: string;
    message: string;
    patientLanguage?: string;
    doctorLanguage?: string;
  }): Promise<ChatMessageEntity> {
    const { requestId, senderId, senderRole, message, patientLanguage, doctorLanguage } = params;

    const reqRes = await pool.query('SELECT * FROM emergency_doctor_requests WHERE id = $1', [requestId]);
    if (reqRes.rows.length === 0) {
      const err: any = new Error('Request not found');
      err.status = 404;
      throw err;
    }

    const request = reqRes.rows[0];
    if (request.status === 'CLOSED' || request.status === 'CANCELLED') {
      const err: any = new Error('Cannot send messages to a closed or cancelled conversation');
      err.status = 400;
      throw err;
    }

    // Access control
    if (senderRole === 'ROLE_DOCTOR') {
      if (request.doctor_id !== senderId) {
        const err: any = new Error('Forbidden: You are not assigned to this chat');
        err.status = 403;
        throw err;
      }
    } else {
      if (request.citizen_user_id !== senderId) {
        const err: any = new Error('Forbidden: You do not own this chat');
        err.status = 403;
        throw err;
      }
    }

    // Determine and update participant language preference if supplied
    let pLang = request.patient_language || 'ta';
    let dLang = request.doctor_language || 'en';

    if (senderRole === 'ROLE_DOCTOR' && doctorLanguage) {
      dLang = doctorLanguage;
      await pool.query('UPDATE emergency_doctor_requests SET doctor_language = $1 WHERE id = $2', [dLang, requestId]);
    } else if (senderRole !== 'ROLE_DOCTOR' && patientLanguage) {
      pLang = patientLanguage;
      await pool.query('UPDATE emergency_doctor_requests SET patient_language = $1 WHERE id = $2', [pLang, requestId]);
    }

    const isDoctor = senderRole === 'ROLE_DOCTOR';
    const sourceLang = isDoctor ? dLang : pLang;
    const targetLang = isDoctor ? pLang : dLang;
    const originalText = message.trim();

    // ── Translation Execution via Gemini Service ────────────────────
    let translatedText = originalText;
    let translationStatus = 'COMPLETED';

    if (sourceLang !== targetLang && originalText) {
      try {
        const sourceName = sourceLang === 'ta' ? 'Tamil' : sourceLang === 'hi' ? 'Hindi' : sourceLang === 'mr' ? 'Marathi' : 'English';
        const targetName = targetLang === 'ta' ? 'Tamil' : targetLang === 'hi' ? 'Hindi' : targetLang === 'mr' ? 'Marathi' : 'English';

        const systemInstruction = `You are a real-time clinical translator between a medical practitioner and a patient.
Translate directly from ${sourceName} to ${targetName}.
RULES:
1. Translate faithfully without summarizing, altering medical urgency, or adding commentary.
2. DO NOT change medical terms, drug names (e.g. Dolo-650, Paracetamol), medical abbreviations (ABHA, HbA1c, CBC, ECG, SpO2, BP, ICMR, WHO), clinical numbers, dosages, or phone numbers.
3. Output ONLY the translated text string.`;

        const prompt = `Translate this consultation message from ${sourceName} to ${targetName}:\n"${originalText}"`;
        const res = await geminiService.generateText(prompt, systemInstruction, 10000);
        if (res && res.trim()) {
          translatedText = res.trim().replace(/^["']|["']$/g, '');
        } else {
          translationStatus = 'UNAVAILABLE';
        }
      } catch (err: any) {
        logger.warn({ tag: '[DOCTOR_CHAT_TRANSLATE]', message: `Translation failed: ${err.message}` });
        translationStatus = 'UNAVAILABLE';
      }
    }

    const msgId = `msg-${Date.now()}`;
    const createdAt = new Date();
    const roleString = isDoctor ? 'DOCTOR' : 'CITIZEN';

    const translationsMap: Record<string, string> = {
      [sourceLang]: originalText,
    };
    if (translatedText && targetLang !== sourceLang) {
      translationsMap[targetLang] = translatedText;
    }

    await pool.query(
      `INSERT INTO emergency_chat_messages (
        id, emergency_id, conversation_id, sender_user_id, sender_role, message, 
        original_text, original_language, translated_text, translated_language, translations_json, translation_status, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        msgId, request.emergency_id, requestId, senderId, roleString, translatedText,
        originalText, sourceLang, translatedText, targetLang, JSON.stringify(translationsMap), translationStatus, createdAt
      ]
    );

    const result: ChatMessageEntity = {
      id: msgId,
      emergencyId: request.emergency_id,
      conversationId: requestId,
      senderUserId: senderId,
      senderRole: roleString,
      message: translatedText,
      originalText,
      originalLanguage: sourceLang,
      translatedText,
      translatedLanguage: targetLang,
      translations: translationsMap,
      translationStatus,
      createdAt,
    };

    // Emit chat message event via Socket.IO
    emitChatMessage(request.emergency_id, result);

    return result;
  }

  async getMessages(requestId: string, userId: string, userRole: string): Promise<ChatMessageEntity[]> {
    const reqRes = await pool.query('SELECT * FROM emergency_doctor_requests WHERE id = $1', [requestId]);
    if (reqRes.rows.length === 0) {
      const err: any = new Error('Request not found');
      err.status = 404;
      throw err;
    }

    const request = reqRes.rows[0];

    // Access check
    if (userRole === 'ROLE_DOCTOR') {
      if (request.doctor_id !== userId) {
        const err: any = new Error('Forbidden: You are not the assigned doctor for this conversation');
        err.status = 403;
        throw err;
      }
    } else {
      if (request.citizen_user_id !== userId) {
        const err: any = new Error('Forbidden: You do not own this conversation');
        err.status = 403;
        throw err;
      }
    }

    const res = await pool.query(
      'SELECT * FROM emergency_chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [requestId]
    );

    return res.rows.map((r) => {
      let translationsMap: Record<string, string> = {};
      try {
        if (r.translations_json) translationsMap = JSON.parse(r.translations_json);
      } catch {
        translationsMap = {};
      }
      const origText = r.original_text || r.message;
      const origLang = r.original_language || 'en';
      translationsMap[origLang] = origText;
      if (r.translated_text && r.translated_language) {
        translationsMap[r.translated_language] = r.translated_text;
      }

      return {
        id: r.id,
        emergencyId: r.emergency_id,
        conversationId: r.conversation_id,
        senderUserId: r.sender_user_id,
        senderRole: r.sender_role,
        message: r.translated_text || r.message,
        originalText: origText,
        originalLanguage: origLang,
        translatedText: r.translated_text || r.message,
        translatedLanguage: r.translated_language || 'en',
        translations: translationsMap,
        translationStatus: r.translation_status || 'COMPLETED',
        createdAt: r.created_at,
      };
    });
  }

  async translateMessageForUser(params: {
    requestId: string;
    userId: string;
    userRole: string;
    messageId: string;
    targetLanguage: string;
  }): Promise<{ messageId: string; targetLanguage: string; translatedText: string; translations: Record<string, string> }> {
    const { requestId, userId, userRole, messageId, targetLanguage } = params;

    // 1. Verify access to request
    await this.getMessages(requestId, userId, userRole);

    // 2. Fetch specific message
    const msgRes = await pool.query('SELECT * FROM emergency_chat_messages WHERE id = $1 AND conversation_id = $2', [messageId, requestId]);
    if (msgRes.rows.length === 0) {
      const err: any = new Error('Message not found');
      err.status = 404;
      throw err;
    }

    const row = msgRes.rows[0];
    const origText = row.original_text || row.message;
    const origLang = row.original_language || 'en';
    const targetLang = targetLanguage.toLowerCase().trim().substring(0, 2);

    let translationsMap: Record<string, string> = {};
    try {
      if (row.translations_json) translationsMap = JSON.parse(row.translations_json);
    } catch {
      translationsMap = {};
    }
    translationsMap[origLang] = origText;

    // Check if target language already matches original
    if (targetLang === origLang) {
      return { messageId, targetLanguage: origLang, translatedText: origText, translations: translationsMap };
    }

    // Check if stored translation exists in cache map
    if (translationsMap[targetLang]) {
      return { messageId, targetLanguage: targetLang, translatedText: translationsMap[targetLang], translations: translationsMap };
    }

    // Translate from AUTHORITATIVE ORIGINAL text into targetLanguage
    const sourceName = origLang === 'ta' ? 'Tamil' : origLang === 'hi' ? 'Hindi' : origLang === 'mr' ? 'Marathi' : 'English';
    const targetName = targetLang === 'ta' ? 'Tamil' : targetLang === 'hi' ? 'Hindi' : targetLang === 'mr' ? 'Marathi' : 'English';

    const systemInstruction = `You are a real-time clinical translator between a medical practitioner and a patient.
Translate directly from ${sourceName} to ${targetName}.
RULES:
1. Translate faithfully without summarizing, altering medical urgency, or adding commentary.
2. DO NOT change medical terms, drug names (e.g. Dolo-650, Paracetamol), medical abbreviations (ABHA, HbA1c, CBC, ECG, SpO2, BP, ICMR, WHO), clinical numbers, dosages, or phone numbers.
3. Output ONLY the translated text string.`;

    const prompt = `Translate this consultation message from ${sourceName} to ${targetName}:\n"${origText}"`;
    let translatedText = origText;

    try {
      const res = await geminiService.generateText(prompt, systemInstruction, 10000);
      if (res && res.trim()) {
        translatedText = res.trim().replace(/^["']|["']$/g, '');
      }
    } catch (err: any) {
      logger.warn({ tag: '[ON_DEMAND_TRANSLATE]', message: `On-demand translation failed: ${err.message}` });
    }

    // Save newly translated target text into translationsMap & DB
    translationsMap[targetLang] = translatedText;
    await pool.query(
      'UPDATE emergency_chat_messages SET translations_json = $1 WHERE id = $2',
      [JSON.stringify(translationsMap), messageId]
    );

    return {
      messageId,
      targetLanguage: targetLang,
      translatedText,
      translations: translationsMap,
    };
  }

  // ── List Queues ──────────────────────────────────────────────

  async getDoctorQueue(doctorId: string): Promise<any[]> {
    // Check doctor availability status
    const docRes = await pool.query('SELECT availability FROM doctors WHERE id = $1', [doctorId]);
    const availability = docRes.rows[0]?.availability || 'OFFLINE';

    let res;
    if (availability === 'AVAILABLE') {
      res = await pool.query(
        `SELECT edr.*, es.status as session_status, ecl.category, ecl.priority as ml_priority
         FROM emergency_doctor_requests edr
         JOIN emergency_sessions es ON edr.emergency_id = es.id
         LEFT JOIN emergency_classifications ecl ON ecl.emergency_id = edr.emergency_id
         WHERE (edr.doctor_id = $1 OR edr.doctor_id IS NULL)
           AND (edr.status = 'REQUESTED' OR (edr.status = 'ACCEPTED' AND edr.doctor_id = $1))
         ORDER BY 
           CASE edr.priority 
             WHEN 'HIGH' THEN 1
             WHEN 'MEDIUM' THEN 2
             WHEN 'LOW' THEN 3
             ELSE 4
           END,
           edr.requested_at DESC`,
        [doctorId]
      );
    } else {
      res = await pool.query(
        `SELECT edr.*, es.status as session_status, ecl.category, ecl.priority as ml_priority
         FROM emergency_doctor_requests edr
         JOIN emergency_sessions es ON edr.emergency_id = es.id
         LEFT JOIN emergency_classifications ecl ON ecl.emergency_id = edr.emergency_id
         WHERE edr.status = 'ACCEPTED' AND edr.doctor_id = $1
         ORDER BY 
           CASE edr.priority 
             WHEN 'HIGH' THEN 1
             WHEN 'MEDIUM' THEN 2
             WHEN 'LOW' THEN 3
             ELSE 4
           END,
           edr.requested_at DESC`,
        [doctorId]
      );
    }

    return res.rows.map((r) => ({
      requestId: r.id,
      emergencyId: r.emergency_id,
      citizenUserId: r.citizen_user_id,
      priority: r.priority,
      status: r.status,
      requestedAt: r.requested_at,
      acceptedAt: r.accepted_at || null,
      category: r.category || 'GENERAL',
      mlPriority: r.ml_priority || 'LOW',
    }));
  }

  async getEmergencyContext(requestId: string, doctorId: string): Promise<any> {
    const reqRes = await pool.query('SELECT * FROM emergency_doctor_requests WHERE id = $1', [requestId]);
    if (reqRes.rows.length === 0) {
      const err: any = new Error('Request not found');
      err.status = 404;
      throw err;
    }
    const request = reqRes.rows[0];

    // Authorization checks
    if (request.status !== 'REQUESTED' && request.doctor_id !== doctorId) {
      const err: any = new Error('Forbidden: You are not assigned to this emergency');
      err.status = 403;
      throw err;
    }

    const sessionRes = await pool.query('SELECT * FROM emergency_sessions WHERE id = $1', [request.emergency_id]);
    const session = sessionRes.rows[0];

    const classRes = await pool.query('SELECT * FROM emergency_classifications WHERE emergency_id = $1', [request.emergency_id]);
    const cls = classRes.rows[0];

    const summary = cls?.summary ? JSON.parse(cls.summary) : {};

    return {
      emergencyId: request.emergency_id,
      requestId: request.id,
      priority: request.priority,
      status: request.status,
      category: cls?.category || 'GENERAL',
      symptoms: summary.symptoms || [],
      warnings: summary.warnings || [],
      location: { latitude: parseFloat(session.latitude), longitude: parseFloat(session.longitude) },
      startedAt: session.created_at,
    };
  }

  // ── Feature 8: optional AI summarizes doctor chat/handoff ─────

  async generateAIHandoffSummary(requestId: string): Promise<string> {
    try {
      const messagesRes = await pool.query(
        'SELECT sender_role, message FROM emergency_chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [requestId]
      );
      if (messagesRes.rows.length === 0) return 'No messages exchanged yet.';

      const chatHistoryText = messagesRes.rows
        .map((m) => `${m.sender_role}: ${m.message}`)
        .join('\n');

      const systemPrompt = `You are a clinical assistant summarizer. Summarize the following citizen-doctor emergency chat history into a structured DOCTOR HANDOFF SUMMARY.
Include reported symptoms, timelines, actions taken, and missing information that a doctor should collect.
Do NOT diagnose or suggest medicines. Remind the doctor this is an AI-generated summary.`;

      const summary = await geminiService.generateText(chatHistoryText, systemPrompt);
      return summary;
    } catch (err: any) {
      logger.warn({ tag: '[DOCTOR_CHAT_AI]', message: 'AI summary failed, returning local default', error: err.message });
      return 'AI handoff summary unavailable. Please review chat log directly.';
    }
  }
}

export const emergencyDoctorChatService = new EmergencyDoctorChatService();
