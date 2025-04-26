import express from 'express';
import { authenticate, adminOnly } from '../middleware/authMiddleware.js';
import { getPendingVerifications, approveDoctor, rejectDoctor, getAllUsers,getPatients,getSingleDoctor,updateDoctor , updatePatient,getApprovedDoctors  } from '../controllers/adminController.js';
import { createStaffMember, getStaffList, updateStaffMember, deleteStaffMember  } from '../controllers/staffController.js';

const router = express.Router();
console.log("Admin Routes Loaded");
router.get('/verifications/pending', authenticate, adminOnly, getPendingVerifications);
router.put('/verifications/approve/:doctorId', authenticate, adminOnly, approveDoctor);
router.put('/verifications/reject/:doctorId', authenticate, adminOnly, rejectDoctor);
router.get('/users', authenticate, adminOnly, getAllUsers);
router.get('/patients', authenticate, adminOnly, getPatients);
router.put('/patients/:id', authenticate, adminOnly, updatePatient);

router.get('/doctors', authenticate, adminOnly, getApprovedDoctors );

// Get single doctor
router.get('/doctors/:id', authenticate, adminOnly, getSingleDoctor);

// Update doctor
router.put('/doctors/:id', authenticate, adminOnly, updateDoctor);



// routes/admin.js
router.post('/staff', authenticate, adminOnly, createStaffMember);

router.get('/staff', authenticate, adminOnly,getStaffList);

router.put('/staff/:id', authenticate,adminOnly, updateStaffMember
);

router.delete('/staff/:id', authenticate, adminOnly, deleteStaffMember
);

export default router;