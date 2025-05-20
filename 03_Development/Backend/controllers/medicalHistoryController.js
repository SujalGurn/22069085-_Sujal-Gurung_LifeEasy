// backend/controllers/medicalHistoryController.js
import { createMedicalHistory, getMedicalHistoryByPatientId, getMedicalHistoryById, getAllMedicalHistory as getAllHistoryModel } from '../models/MedicalHistory.js';
import { getPatientById } from '../models/Patient.js'; // Ensure this import is correct

export const addMedicalHistory = async (req, res) => {
    try {
        const patientId = req.params.patientId; // Get patientId from URL

        // **Check if the patient exists BEFORE creating medical history**
        const patientExistsResult = await getPatientById(patientId);
        if (!patientExistsResult.success || !patientExistsResult.data) {
            return res.status(404).json({ success: false, message: `Patient with ID ${patientId} not found.` });
        }

        const historyData = {
            patient_id: patientId, // Ensure patient_id is included
            recorded_by_user_id: req.user.id,
            blood_pressure: req.body.blood_pressure,
            medication: req.body.medication,
            allergies: req.body.allergies,
            weight: req.body.weight,
            height: req.body.height,
            medical_condition: req.body.medical_condition,
            diagnosis: req.body.diagnosis,
            treatment: req.body.treatment,
            notes: req.body.notes,
            report_name: req.file ? req.file.originalname : null,
            report_path: req.file ? `/uploads/reports/${req.file.filename}` : null, // Store the path
            report_date: req.body.report_date || new Date(), // Get from frontend or default to now
            report_type: req.body.report_type || null,
            report_notes: req.body.report_notes || null,
        };
        const result = await createMedicalHistory(historyData);
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error adding medical history with report:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};



export const getPatientMedicalHistory = async (req, res) => {
    try {
        const loggedInUserId = req.user.id; // Get logged-in user ID
        const requestedPatientId = req.params.patientId; // Get patient ID from URL (if present)

        let patientIdToFetch;

        // If a patientId is in the URL (doctor viewing), use that
        if (requestedPatientId) {
            patientIdToFetch = requestedPatientId;
        } else {
            // Otherwise, fetch history for the logged-in patient
            // You'll need to query your 'patient' table to find the patientId
            // associated with the loggedInUserId
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
            res.json(result.data);
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


