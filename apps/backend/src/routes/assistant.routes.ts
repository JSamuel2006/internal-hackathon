import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSession,
  deleteSession,
  sendMessage,
  toggleFavorite,
  submitFeedback,
  renameSession
} from '../controllers/aiAssistantController.js';

const router = Router();

// Session Management
router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.delete('/sessions/:id', deleteSession);
router.post('/sessions/:id/rename', renameSession);

// Messaging
router.post('/sessions/:sessionId/messages', sendMessage);

// Interactions
router.post('/sessions/:sessionId/messages/:messageId/favorite', toggleFavorite);
router.post('/sessions/:sessionId/messages/:messageId/feedback', submitFeedback);

export default router;
