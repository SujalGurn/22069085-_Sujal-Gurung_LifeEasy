// backend/controllers/medicalHistoryController.js
import { pool } from '../config/db.js'; // Add this import
import { createMedicalHistory, getMedicalHistoryByPatientId, getMedicalHistoryById, getAllMedicalHistory as getAllHistoryModel } from '../models/MedicalHistory.js';
import { getPatientById } from '../models/Patient.js';
import fs from 'fs';
import path from 'path';

export const addMedicalHistory = async (req, res) => {
    try {
        const patientId = req.params.patientId;

        console.log('Adding medical history for patientId:', patientId);
        console.log('Request body:', req.body);
        console.log('Uploaded file:', req.file);

        const patientExistsResult = await getPatientById(patientId);
        if (!patientExistsResult.success || !patientExistsResult.data) {
            if (req.file) {
                const filePath = path.join(process.cwd(), 'uploads', 'medical-reports', req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Cleaned up uploaded file:', filePath);
                }
            }
            return res.status(404).json({ success: false, message: `Patient with ID ${patientId} not found.` });
        }

        // Verify file existence if uploaded
        let reportPath = null;
        if (req.file) {
            const filePath = path.join(process.cwd(), 'uploads', 'medical-reports', req.file.filename);
            console.log('Checking uploaded file at:', filePath);
            if (!fs.existsSync(filePath)) {
                console.error('Uploaded file not found:', filePath);
                return res.status(500).json({ success: false, message: 'File upload failed: File not found on server.' });
            }
            reportPath = req.file.filename;
        }

        const historyData = {
            patient_id: patientId,
            recorded_by_user_id: req.user.id,
            blood_pressure: req.body.blood_pressure || null,
            medication: req.body.medication || null,
            allergies: req.body.allergies || null,
            weight: req.body.weight || null,
            height: req.body.height || null,
            medical_condition: req.body.medical_condition || null,
            diagnosis: req.body.diagnosis || null,
            treatment: req.body.treatment || null,
            notes: req.body.notes || null,
            report_name: req.file ? req.file.originalname : null,
            report_path: reportPath,
            report_date: req.body.report_date ? new Date(req.body.report_date) : new Date(),
            report_type: req.body.report_type || null,
            report_notes: req.body.report_notes || null,
        };

        console.log('Saving medical history with data:', historyData);

        const result = await createMedicalHistory(historyData);

        if (result.success) {
            res.status(201).json(result);
        } else {
            if (req.file && reportPath) {
                const filePath = path.join(process.cwd(), 'uploads', 'medical-reports', reportPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Cleaned up uploaded file:', filePath);
                }
            }
            res.status(400).json(result);
        }
    } catch (error) {
        if (req.file) {
            const filePath = path.join(process.cwd(), 'uploads', 'medical-reports', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Cleaned up uploaded file on error:', filePath);
            }
        }
        console.error('Error adding medical history with report:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getPatientMedicalHistory = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const requestedPatientId = req.params.patientId;

        let patientIdToFetch;

        if (requestedPatientId) {
            // Doctor viewing a specific patient's history
            patientIdToFetch = requestedPatientId;

            // Verify that the user is a doctor or the patient themselves
            const patientResult = await pool.query('SELECT user_id FROM patient WHERE id = ?', [requestedPatientId]);
            if (patientResult[0].length === 0) {
                return res.status(404).json({ success: false, message: 'Patient not found.' });
            }
            const patientUserId = patientResult[0][0].user_id;

            if (req.user.role !== 'doctor' && req.user.id !== patientUserId) {
                return res.status(403).json({ success: false, message: 'Access denied: Only doctors or the patient can view this medical history.' });
            }
        } else {
            // Patient viewing their own history
            const patientResult = await pool.query('SELECT id FROM patient WHERE user_id = ?', [loggedInUserId]);
            if (patientResult[0].length > 0) {
                patientIdToFetch = patientResult[0][0].id;
            } else {
                return res.status(404).json({ success: false, message: 'Patient not found for this user.' });
            }
        }

        const result = await getMedicalHistoryByPatientId(patientIdToFetch);
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json({ success: false, message: 'Medical history not found for this patient' });
        }
    } catch (error) {
        console.error('Error fetching patient medical history:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getMedicalHistoryEntry = async (req, res) => {
    const { historyId } = req.params;
    try {
        const result = await getMedicalHistoryById(historyId);
        if (result.success && result.data) {
            // Verify access: Only the patient or a doctor can view
            const patientResult = await pool.query('SELECT user_id FROM patient WHERE id = ?', [result.data.patient_id]);
            if (patientResult[0].length === 0) {
                return res.status(404).json({ success: false, message: 'Patient not found.' });
            }
            const patientUserId = patientResult[0][0].user_id;

            if (req.user.role !== 'doctor' && req.user.id !== patientUserId) {
                return res.status(403).json({ success: false, message: 'Access denied: Only doctors or the patient can view this medical history entry.' });
            }

            res.json(result);
        } else {
            res.status(404).json({ success: false, message: 'Medical history entry not found' });
        }
    } catch (error) {
        console.error('Error fetching medical history entry:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getAllMedicalHistory = async (req, res) => {
    try {
        // Restrict to admins or doctors
        if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
            return res.status(403).json({ success: false, message: 'Access denied: Only admins or doctors can view all medical history.' });
        }
        const result = await getAllHistoryModel();
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(500).json({ success: false, message: 'Failed to fetch all medical history' });
        }
    } catch (error) {
        console.error('Error fetching all medical history:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};