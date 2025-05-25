import { pool } from '../config/db.js';
import path from 'path';
import fs from 'fs';

export const FileService = {
    verifyFileAccess: async (filename, userId) => {
        try {
            console.log('Verifying file access for filename:', filename, 'userId:', userId);
            const [records] = await pool.query(
                `SELECT mh.* 
                 FROM medicalHistory mh
                 WHERE mh.report_path = ?
                 AND (
                     mh.patient_id IN (SELECT id FROM patient WHERE user_id = ?)
                     OR mh.recorded_by_user_id = ?
                 )`,
                [filename, userId, userId]
            );
            console.log('Access query result:', records);
            return records.length > 0;
        } catch (error) {
            console.error('Error verifying file access:', error);
            throw new Error(`Failed to verify file access: ${error.message}`);
        }
    },

    getFilePath: (filename) => {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'medical-reports');
        const filePath = path.join(uploadsDir, filename);
        console.log('Constructed file path:', filePath);
        if (!fs.existsSync(uploadsDir)) {
            console.error('Uploads directory does not exist:', uploadsDir);
            throw new Error('Uploads directory does not exist');
        }
        return filePath;
    },

    serveFile: (res, filePath) => {
        console.log(`Attempting to serve file: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            throw new Error('File not found');
        }
        res.sendFile(filePath, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline'
            }
        }, (err) => {
            if (err) {
                console.error('Error serving file:', err);
                throw new Error(`Failed to serve file: ${err.message}`);
            }
        });
    }
};