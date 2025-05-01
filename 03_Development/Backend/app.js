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

const app = express();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
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

