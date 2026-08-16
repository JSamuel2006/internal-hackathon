import { Router } from 'express';
import {
  handleSaveProfile,
  handleGetProfile,
  handleRegenerateTwin,
  handleGetLatestTwin,
  handleGetTwinHistory,
  handleLiveSimulation,
  handleSaveSimulation,
  handleGetSimulations,
  handleDeleteSimulation
} from '../controllers/twinController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/v1/twin/profile - Save or update user demographics/profile
router.post('/profile', handleSaveProfile);

// GET /api/v1/twin/profile/:userId - Retrieve user profile
router.get('/profile/:userId', handleGetProfile);

// POST /api/v1/twin/predict - Manually request digital twin regeneration
router.post('/predict', handleRegenerateTwin);

// GET /api/v1/twin/latest/:userId - Get latest computed digital twin
router.get('/latest/:userId', handleGetLatestTwin);

// GET /api/v1/twin/history/:userId - Get all previous digital twins
router.get('/history/:userId', handleGetTwinHistory);

// POST /api/v1/twin/simulate - Live recalculation What-If simulation
router.post('/simulate', authenticateJWT, handleLiveSimulation);

// POST /api/v1/twin/simulations/save - Save simulation
router.post('/simulations/save', handleSaveSimulation);

// GET /api/v1/twin/simulations/:userId - Get all simulations
router.get('/simulations/:userId', handleGetSimulations);

// DELETE /api/v1/twin/simulations/:id - Delete saved simulation
router.delete('/simulations/:id', handleDeleteSimulation);

export default router;
