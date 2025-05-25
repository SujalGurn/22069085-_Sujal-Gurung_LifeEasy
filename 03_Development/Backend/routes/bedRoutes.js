import express from 'express';
import { BedController } from '../controllers/bedController.js';
import { authenticate, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only routes
router.post('/', authenticate, adminOnly, BedController.addBed);
router.put('/:id', authenticate, adminOnly, BedController.updateBed);
router.delete('/:id', authenticate, adminOnly, BedController.deleteBed);
router.post('/:id/assign', authenticate, adminOnly, BedController.assignBed);
router.post('/:id/discharge', authenticate, adminOnly, BedController.dischargePatient);
router.get('/', authenticate, adminOnly, BedController.getBeds);
router.get('/:id', authenticate, adminOnly, BedController.getBed);

export default router;