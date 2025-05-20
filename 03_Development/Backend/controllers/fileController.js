import { FileService } from '../services/fileService.js';

export const FileController = {
  getMedicalReport: async (req, res) => {
    try {
      const hasAccess = await FileService.verifyFileAccess(
        req.params.filename,
        req.user.id
      );
      
      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized access' 
        });
      }

      const filePath = FileService.getFilePath(req.params.filename);
      FileService.serveFile(res, filePath);

    } catch (error) {
      res.status(error.message === 'File not found' ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }
  }
};