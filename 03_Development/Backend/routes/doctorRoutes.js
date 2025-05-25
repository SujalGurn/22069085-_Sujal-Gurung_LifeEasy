import {
    getAllDoctors,
    getDoctorDetails,
    getAvailableDates,
    getAvailableTimeSlots,
    createAppointment,
    confirmAppointmentHandler,
    getPendingAppointments,
    rejectAppointmentHandler,
    verifyAppointment,
    getConfirmedAppointments,
    getCompletedAppointments,
    getAppointmentDetails,
    getPatientAppointments,
    esewaCallback,
    sendPaymentReceiptEndpoint,
    getDoctorPendingAppointments,
    getPaymentByTransaction
} from '../controllers/appointmentController.js';
import { authenticate, checkRole, isDoctor, isSameDoctor } from '../middleware/authMiddleware.js';
import { 
    addAvailability,
    updateAvailability,
    getDoctorAvailability,
    deleteAvailability
} from '../controllers/availabilityController.js';
import {
    getPatientMedicalHistoryForDoctor,
    addMedicalHistory,
    updateMedicalHistory,
    addQualification,
    addExperience,
    updateDoctorProfile,
    getDoctorIdByUserId,
    getDoctorProfile,
    deleteQualification,
    deleteExperience,
} from '../controllers/doctorController.js'; 
import uploadMedicalReport from '../middleware/uploadMedicalReport.js'; 
import { getPatients } from '../controllers/adminController.js';
import express from 'express';
import { handlePaymentSuccess, handlePaymentFailure } from '../controllers/paymentController.js';
import { uploadProfilePicture } from '../middleware/profileConfig.js';


const esewaCallbackParser = express.urlencoded({ extended: true });
const router = express.Router();

// ID validation middleware for all routes using :id
router.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid ID format - must be numeric" 
        });
    }
    next();
});

// Public routes
router.get('/doctors', getAllDoctors);
router.get('/doctors/by-user/:userId', getDoctorIdByUserId);

// Doctor profile routes
router.get('/doctors/:id/profile', getDoctorProfile);
router.get('/doctors/:id/profile', authenticate, isDoctor, isSameDoctor, getDoctorProfile);  
router.get('/doctors/:id', getDoctorDetails);

router.put(
  '/doctors/:id/profile', 
  authenticate, 
  isDoctor, 
  isSameDoctor, 
  uploadProfilePicture.single('profile_picture'), 
  updateDoctorProfile
);


// Protected routes
router.get('/doctors/:id/availability/days', authenticate, getAvailableDates);
router.get('/doctors/:id/availability/times', authenticate, getAvailableTimeSlots);

// Appointment routes
router.post('/appointments', authenticate, createAppointment);
router.post('/appointments/esewa-callback', esewaCallbackParser, esewaCallback);
router.get('/appointments/send-receipt/:id', sendPaymentReceiptEndpoint);
router.put('/appointments/:id/confirm', authenticate, checkRole(['doctor', 'admin']), confirmAppointmentHandler);
router.get('/appointments/pending', authenticate, checkRole(['doctor', 'admin']), getPendingAppointments);
router.put('/appointments/:id/reject', authenticate, checkRole(['doctor', 'admin']), rejectAppointmentHandler);
router.get('/appointments/confirmed', authenticate, checkRole(['doctor', 'admin']), getConfirmedAppointments);
router.get('/appointments/completed', authenticate, checkRole(['doctor', 'admin']), getCompletedAppointments);
router.get('/appointments/patient', authenticate, getPatientAppointments);
router.get('/appointments/:id', authenticate, getAppointmentDetails);
router.get('/doctor-pending', authenticate, getDoctorPendingAppointments);
router.get('/payments/transaction/:transactionId', getPaymentByTransaction);
// Availability management
router.post('/availability', authenticate, checkRole(['doctor', 'admin']), addAvailability);
router.get('/availability', authenticate, checkRole(['doctor', 'admin']), getDoctorAvailability);
router.put('/availability/:id', authenticate, checkRole(['doctor', 'admin']), updateAvailability);
router.delete('/availability/:id', authenticate, checkRole(['doctor', 'admin']), deleteAvailability);

// Medical history routes
router.get('/patient/:patientId/medical-history', authenticate, isDoctor, getPatientMedicalHistoryForDoctor);
router.post('/patient/:patientId/medical-history', authenticate, isDoctor, uploadMedicalReport.single('report'), addMedicalHistory);
router.put('/patient/:patientId/medical-history/:recordId', authenticate, isDoctor, uploadMedicalReport.single('report'), updateMedicalHistory);

// Doctor profile management
// router.put('/doctors/:id/profile', authenticate, isDoctor, updateDoctorProfile);
router.post('/doctors/:id/qualifications', authenticate, isDoctor, addQualification);
router.post('/doctors/:id/experience', authenticate, isDoctor, addExperience);
router.delete('/doctors/:id/qualifications/:qualId', deleteQualification);
router.delete('/doctors/:id/experience/:expId', deleteExperience); 

// Admin routes
router.get('/patients', authenticate, getPatients);
router.get('/appointments/verify', verifyAppointment);

// Payment routes (public)
router.get('/payment/success', handlePaymentSuccess); 
router.get('/payment/failure', handlePaymentFailure);

export default router;