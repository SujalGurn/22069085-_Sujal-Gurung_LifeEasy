// routes/statsRoute.js
import express from 'express';
import { getAdminStats } from '../controllers/statsController.js';
import { authenticate, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin-stats', 
  authenticate, 
  checkRole(['admin']),
  getAdminStats
);

export default router;