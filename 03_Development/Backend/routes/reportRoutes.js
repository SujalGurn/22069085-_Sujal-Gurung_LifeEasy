import express from 'express';
import { FileController } from '../controllers/fileController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/:filename',
  authenticate, // Replaced verifyToken
  FileController.getMedicalReport
);
export default router;