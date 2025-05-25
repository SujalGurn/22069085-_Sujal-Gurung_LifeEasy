import express from 'express';
import { getDoctorAlerts } from '../controllers/alertController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/doctor', authenticate, getDoctorAlerts);

export default router;