import express from 'express';
import {
    configureSalary, // You can reuse this or create a new one
    approveSalary,
    getDeductionTypes,
    assignInitialSalary ,
    getPendingSalaries
} from '../controllers/salaryController.js';
import { authenticate, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin Endpoints
router.post('/configure', authenticate, adminOnly, configureSalary); // Existing
router.post('/assign-initial', authenticate, adminOnly, assignInitialSalary); // New route
router.put('/approve/:paymentId', authenticate, adminOnly, approveSalary);
router.get('/deduction-types', authenticate, adminOnly, getDeductionTypes);
router.get('/pending', authenticate, adminOnly, getPendingSalaries);


export default router;