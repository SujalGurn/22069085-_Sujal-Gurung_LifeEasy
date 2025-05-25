import express from 'express';
import { authenticate, isDoctor } from '../middleware/authMiddleware.js';
import { addMedicalHistory, getPatientMedicalHistory, getMedicalHistoryEntry, getAllMedicalHistory } from '../controllers/medicalHistoryController.js';
import uploadMedicalReport from '../middleware/uploadMedicalReport.js';
import { FileService } from '../services/fileService.js';

const router = express.Router();

// Doctors can add medical history for a patient (with report upload)
router.post('/patients/:patientId/history', authenticate, isDoctor, uploadMedicalReport.single('report'), addMedicalHistory);

// Route for a logged-in patient to view their own medical history
router.get('/patient/medical-history', authenticate, getPatientMedicalHistory);

// Doctors can view medical history for a specific patient
router.get('/patients/:patientId/history', authenticate, isDoctor, getPatientMedicalHistory);

// Doctors or admins can view ALL medical history records
router.get('/medical-history', authenticate, getAllMedicalHistory);

// Doctors or patients can view a specific medical history entry
router.get('/history/:historyId', authenticate, getMedicalHistoryEntry);

// Serve medical reports
router.get('/reports/:filename', authenticate, async (req, res) => {
    try {
        const { filename } = req.params;
        const hasAccess = await FileService.verifyFileAccess(filename, req.user.id);

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const filePath = FileService.getFilePath(filename);
        FileService.serveFile(res, filePath);
    } catch (error) {
        console.error('Error serving report:', error);
        res.status(404).json({ success: false, message: error.message });
    }
});

router.post(
    '/patients/:patientId/history',
    authenticate,
    isDoctor,
    (req, res, next) => {
        uploadMedicalReport.single('report')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error('Multer error:', err);
                return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
            } else if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
            }
            next();
        });
    },
    addMedicalHistory
);

export default router;