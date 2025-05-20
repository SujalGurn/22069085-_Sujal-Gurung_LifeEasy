import express from 'express';
import authRoutes from './routes/authRoutes.js';
import { checkConnection } from './config/db.js';
import createAllTable from './utils/dbUtils.js';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes.js';
import path from 'path';
import doctorRoutes from './routes/doctorRoutes.js';
import statsRouter from './routes/statsRoute.js';
import patientRoutes from './routes/patientRoutes.js'; 
import medicalHistoryRoutes from './routes/medicalHistoryRoutes.js'; 
import salaryRoutes from './routes/salaryRoutes.js'; // Import your salary routes
import { verifyToken, adminOnly } from './middleware/authMiddleware.js';
import fs from 'fs';

const app = express();
const __dirname = path.resolve();

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,
    exposedHeaders: ['Authorization', 'Content-Type'],
    allowedHeaders: ['Authorization', 'Content-Type']
  }));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/salaries', salaryRoutes);
// app.use('/api/doctors', doctorRoutes);
app.use('/api', doctorRoutes);
app.use('/api', patientRoutes); 
app.use('/api', medicalHistoryRoutes)

app.use('/uploads', (req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
        } else if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', `image/${filePath.split('.').pop()}`);
        }
    }
}));

app.get('/api/users', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
  
});
app.get('/api/verifications/pending', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
   
});
app.use('/api/stats', statsRouter);
app.use('/qrcodes', express.static(path.join(process.cwd(), 'public', 'qrcodes')));
app.listen(3002, async() => {    
    console.log('Server is running on port 3002');
    try{
        await checkConnection();
        await createAllTable();
    }catch(error){
        console.log('Error connecting to database: ', error);
      
    }
});

