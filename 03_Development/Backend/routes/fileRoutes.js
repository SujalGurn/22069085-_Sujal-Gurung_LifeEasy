import express from 'express';
import { FileController } from '../controllers/fileController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/reports/:filename',
  authMiddleware,
  FileController.getMedicalReport
);

export default router;