// routes/statsRoute.js
import express from 'express';
import { getAdminStats,getAppointmentTrends } from '../controllers/statsController.js';
import { authenticate, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin-stats', 
  authenticate, 
  checkRole(['admin']),
  getAdminStats
);
router.get(
  '/appointments-trend',
  authenticate,
  checkRole(['admin']),
  getAppointmentTrends
);
export default router;