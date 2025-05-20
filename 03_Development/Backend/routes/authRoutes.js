import express from 'express';
import { 
    register, 
    login, 
    getUserDetails, 
    generateOTP, 
    verifyOTP, 
    registerDoctor 
} from '../controllers/authController.js';
import upload from '../middleware/uploadMiddleware.js';
import { authenticate } from '../middleware/authMiddleware.js';


const router = express.Router();

// Regular user registration
router.post('/register-user', register);

// Doctor registration with file uploads
router.post('/register-doctor', 
    upload.fields([
        { name: 'certification', maxCount: 1 },
        { name: 'idProof', maxCount: 1 }
    ]),
    registerDoctor
);

router.post('/login', login);
router.get('/get-userDetails', authenticate, getUserDetails);
router.post('/generate-otp', generateOTP);
router.post('/verify-otp', verifyOTP);
console.log(process.env.JWT_SECRET)




export default router;

