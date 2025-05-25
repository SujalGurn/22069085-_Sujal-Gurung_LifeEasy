import { FileService } from '../services/fileService.js';
import fs from 'fs';

export const FileController = {
  getMedicalReport: async (req, res) => {
    try {
      console.log('Request headers:', req.headers);
      console.log('User context:', req.user);
      console.log('Requested filename:', req.params.filename);

      const hasAccess = await FileService.verifyFileAccess(
        req.params.filename,
        req.user.id
      );
      
      console.log('Access check result:', hasAccess);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: User does not have permission to view this file'
        });
      }

      const filePath = FileService.getFilePath(req.params.filename);
      console.log('Resolved file path:', filePath);
      
      if (!fs.existsSync(filePath)) {
        console.error('File does not exist at path:', filePath);
        return res.status(404).json({
          success: false,
          message: `File not found at path: ${filePath}`
        });
      }

      res.sendFile(filePath, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline'
        }
      }, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({
            success: false,
            message: 'Error sending file',
            error: err.message
          });
        }
      });
      
    } catch (error) {
      console.error('File controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        stack: error.stack
      });
    }
  }
};