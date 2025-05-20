import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Use lowercase directory name for consistency
const UPLOAD_BASE = process.env.UPLOAD_DIR || 'uploads';
const kycDir = path.join(UPLOAD_BASE, 'kyc');
// Ensure directory exists with proper permissions
if (!fs.existsSync(kycDir)) {
    fs.mkdirSync(kycDir, { 
        recursive: true,
        mode: 0o755 // Read/write/execute permissions for owner, read/execute for others
    });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, kycDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') // Remove special characters
            .replace(/\s+/g, '_')            // Replace spaces with underscores
            .toLowerCase();                  // Force lowercase
        
        const ext = path.extname(sanitizedName);
        const baseName = path.basename(sanitizedName, ext);
        const newFilename = `${baseName}-${uniqueSuffix}${ext}`;
        
        console.log(`Saving file to: ${path.join(kycDir, newFilename)}`);
        cb(null, newFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png', 
            'application/pdf',
            'image/jpg' // Added JPG explicitly
        ];
        
        const isValidType = allowedTypes.includes(file.mimetype);
        const isValidExtension = ['.jpg', '.jpeg', '.png', '.pdf']
            .includes(path.extname(file.originalname).toLowerCase());

        if (isValidType && isValidExtension) {
            console.log(`Valid file: ${file.originalname} (${file.mimetype})`);
            cb(null, true);
        } else {
            console.error(`Rejected file: ${file.originalname} (${file.mimetype})`);
            cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
        }
    }
});

export default upload;