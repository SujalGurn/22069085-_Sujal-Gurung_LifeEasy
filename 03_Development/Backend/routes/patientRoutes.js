import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createPatientProfile, getUserPatientProfile, getPatientMedicalHistory, updateUserPatientProfile, getAllPatientProfiles} from '../controllers/patientController.js';
import upload from '../middleware/patientProfile.js';

const router = express.Router();

// User can create their patient profile (if they don't have one)

router.post('/profile/patient', authenticate, upload.single('profile_picture'), createPatientProfile);
router.put('/profile/patient', authenticate, upload.single('profile_picture'), updateUserPatientProfile);
router.get('/profile/patient', authenticate, getUserPatientProfile);

// Admin/Doctors can view all patient profiles
router.get('/patients', authenticate, getAllPatientProfiles);
router.get('/patient/medical-history', authenticate, getPatientMedicalHistory);

export default router;