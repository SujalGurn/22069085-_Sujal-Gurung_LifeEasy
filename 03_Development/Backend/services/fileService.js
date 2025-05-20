import { pool } from '../config/db.js';
import path from 'path';
import fs from 'fs';

export const FileService = {
  verifyFileAccess: async (filename, userId) => {
    const [record] = await pool.query(
      `SELECT mh.* 
       FROM medical_history mh
       JOIN users u ON mh.patient_id = u.id
       WHERE mh.report_path = ? 
       AND (mh.patient_id = ? OR mh.doctor_id = ?)`,
      [filename, userId, userId]
    );
    return record.length > 0;
  },

  getFilePath: (filename) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'medical-reports');
    return path.join(uploadsDir, filename);
  },

  serveFile: (res, filePath) => {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    res.sendFile(filePath, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline'
      }
    });
  }
};