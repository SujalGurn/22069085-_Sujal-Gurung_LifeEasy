import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createPatientProfile, getUserPatientProfile, getPatientMedicalHistory, updateUserPatientProfile, getAllPatientProfiles} from '../controllers/patientController.js';

const router = express.Router();

// User can create their patient profile (if they don't have one)
router.post('/profile/patient', authenticate, createPatientProfile);

router.get('/profile/patient', authenticate, getUserPatientProfile);
router.put('/profile/patient', authenticate, updateUserPatientProfile);

// Admin/Doctors can view all patient profiles
router.get('/patients', authenticate, getAllPatientProfiles);
router.get('/patient/medical-history', authenticate, getPatientMedicalHistory);

export default router;