// backend/routes/medicalHistoryRoutes.js
import express from 'express';
import { authenticate , isDoctor} from '../middleware/authMiddleware.js';
import { addMedicalHistory, getPatientMedicalHistory, getMedicalHistoryEntry, getAllMedicalHistory } from '../controllers/medicalHistoryController.js';
import upload from '../middleware/uploadMiddleware.js'; // Import your multer middleware

const router = express.Router();

// Doctors can add medical history for a patient (with report upload)
router.post('/patients/:patientId/history', authenticate, upload.single('report'), addMedicalHistory); // Removed isDoctor if non-doctors can also add

// Doctors can view medical history for a specific patient
// router.get('/patients/:patientId/history', authenticate, getPatientMedicalHistory); // Removed isDoctor if non-doctors can also view

// Route for a logged-in patient to view their OWN medical history
router.get('/patient/medical-history', authenticate, getPatientMedicalHistory); // ADD THIS LINE
// Doctors can view ALL medical history records
router.get('/medical-history', authenticate, getAllMedicalHistory); // Removed isDoctor if non-doctors can also view
router.get('/patients/:patientId/history', authenticate, isDoctor, getPatientMedicalHistory);
// Doctors can view a specific medical history entry
router.get('/history/:historyId', authenticate,  getMedicalHistoryEntry); // Removed isDoctor if non-doctors can also view

export default router;