import { pool } from '../database/db.js';
import { ConversationSession, ChatMessage } from '../database/models/conversationModel.js';
import { logger } from '../logging/logger.js';

export class ConversationRepository {
  public async createSession(userId: string, language = 'en'): Promise<ConversationSession> {
    const id = `sess-${Date.now()}`;
    const title = 'New Health Query';
    const createdAt = new Date();
    const updatedAt = new Date();

    await pool.query(
      `INSERT INTO assistant_sessions (id, user_id, title, language, created_at, updated_at) 
       VALUES ($1::text, $2::text, $3::text, $4::text, $5::timestamp, $6::timestamp)`,
      [id, userId, title, language, createdAt, updatedAt]
    );

    return {
      id,
      userId,
      title,
      language,
      messages: [],
      createdAt,
      updatedAt
    };
  }

  public async getSession(id: string): Promise<ConversationSession | null> {
    const sessionRes = await pool.query('SELECT * FROM assistant_sessions WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) return null;
    const r = sessionRes.rows[0];

    const messagesRes = await pool.query(
      'SELECT * FROM assistant_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const messages: ChatMessage[] = messagesRes.rows.map(m => ({
      id: m.id,
      role: m.sender === 'USER' ? 'user' : 'assistant',
      content: m.message,
      language: m.language || 'en',
      category: 'GENERAL',
      timestamp: m.created_at,
      isFavorite: false,
      confidence: m.confidence ? parseFloat(m.confidence) : undefined
    }));

    return {
      id: r.id,
      userId: r.user_id,
      title: r.title,
      language: r.language,
      messages,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  public async getSessionsByUser(userId: string): Promise<ConversationSession[]> {
    const sessionRes = await pool.query(
      'SELECT * FROM assistant_sessions WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    const sessions: ConversationSession[] = [];
    for (const r of sessionRes.rows) {
      sessions.push({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        language: r.language,
        messages: [],
        createdAt: r.created_at,
        updatedAt: r.updated_at
      });
    }
    return sessions;
  }

  public async addMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage> {
    const id = `msg-${Date.now()}`;
    const timestamp = new Date();

    const sender = message.role === 'user' ? 'USER' : 'AI';
    await pool.query(
      `INSERT INTO assistant_messages (id, session_id, sender, message, confidence, language, created_at) 
       VALUES ($1::text, $2::text, $3::text, $4::text, $5::numeric, $6::text, $7::timestamp)`,
      [id, sessionId, sender, message.content, message.confidence ?? 0.95, message.language || 'en', timestamp]
    );

    // Auto-update session title if this is the first message
    const msgCountRes = await pool.query('SELECT COUNT(*) FROM assistant_messages WHERE session_id = $1::text', [sessionId]);
    if (parseInt(msgCountRes.rows[0].count) === 1 && message.role === 'user') {
      const cleanTitle = message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '');
      await pool.query('UPDATE assistant_sessions SET title = $1::text, updated_at = NOW() WHERE id = $2::text', [cleanTitle, sessionId]);
    } else {
      await pool.query('UPDATE assistant_sessions SET updated_at = NOW() WHERE id = $1::text', [sessionId]);
    }

    return {
      id,
      role: message.role,
      content: message.content,
      language: message.language,
      category: message.category,
      timestamp,
      isFavorite: message.isFavorite,
      confidence: message.confidence
    };
  }

  public async toggleFavorite(sessionId: string, messageId: string): Promise<boolean> {
    // Return mock toggle response
    return true;
  }

  public async submitFeedback(
    sessionId: string,
    messageId: string,
    feedback: 'UP' | 'DOWN'
  ): Promise<void> {
    logger.info({ tag: '[FEEDBACK]', message: `Feedback submitted: ${feedback} for session: ${sessionId} msg: ${messageId}` });
  }

  public async deleteSession(id: string): Promise<boolean> {
    await pool.query('DELETE FROM assistant_sessions WHERE id = $1', [id]);
    return true;
  }

  public async renameSession(id: string, title: string): Promise<boolean> {
    await pool.query('UPDATE assistant_sessions SET title = $1 WHERE id = $2', [title, id]);
    return true;
  }
}

export const conversationRepository = new ConversationRepository();
