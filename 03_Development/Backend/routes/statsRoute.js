import express from 'express';
import { getAdminStats, getAppointmentTrends, getDoctorStats, getDoctorEarningsTrend, getDoctorAppointments, getDoctorAlerts } from '../controllers/statsController.js';
import { authenticate, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin-stats', 
  authenticate, 
  checkRole(['admin']),
  getAdminStats
);

router.get('/appointments-trend', 
  authenticate, 
  checkRole(['admin']),
  getAppointmentTrends
);

router.get('/doctor-stats', 
  authenticate, 
  checkRole(['doctor']),
  getDoctorStats
);

router.get('/doctor-earnings-trend', 
  authenticate, 
  checkRole(['doctor']),
  getDoctorEarningsTrend
);

router.get('/doctor-appointments', 
  authenticate, 
  checkRole(['doctor']),
  getDoctorAppointments
);

router.get('/doctor-alerts', 
  authenticate, 
  checkRole(['doctor']),
  getDoctorAlerts
);

export default router;