import { Router } from 'express';
import { handleVoiceQuery, getVoiceHistory, deleteVoiceHistoryItem, addVoiceHistory } from '../controllers/voiceAssistantController.js';

const router = Router();

router.post('/query', handleVoiceQuery);
router.post('/history', addVoiceHistory);
router.get('/history/:userId', getVoiceHistory);
router.delete('/history/:conversationId', deleteVoiceHistoryItem);

export default router;
