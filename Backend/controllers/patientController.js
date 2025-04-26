// patientController.js
import { createPatient, getPatientByUserId, updatePatient, getAllPatients } from '../models/Patient.js';
import { getMedicalHistoryByPatientId } from '../models/MedicalHistory.js';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from '../models/userModel.js'; // Assuming you have a User model (MySQL)

export const createPatientProfile = async (req, res) => {
    try {
        const patientData = { ...req.body, user_id: req.user.id, patient_code: `PAT-${uuidv4().substring(0, 8).toUpperCase()}` }; // Associate with logged-in user
        const result = await createPatient(patientData);
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error creating patient profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getUserPatientProfile = async (req, res) => {
    try {
        const userId = req.user.id; // User ID from the authenticated token
        const patientResult = await getPatientByUserId(userId);

        if (patientResult.success && patientResult.data) {
            const userResult = await getUserById(userId); // Assuming a function to fetch user by ID
            if (userResult.success && userResult.data) {
                return res.status(200).json({
                    success: true,
                    data: { ...patientResult.data, fullname: userResult.data.fullname, email: userResult.data.email },
                });
            } else {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
        } else {
            return res.status(200).json({ success: true, data: null }); // Patient profile not found
        }
    } catch (error) {
        console.error('Error fetching patient profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateUserPatientProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const patientResult = await getPatientByUserId(userId);
        if (patientResult.success && patientResult.data) {
            const patientId = patientResult.data.id;
            const result = await updatePatient(patientId, req.body);
            return res.status(result.success ? 200 : 404).json(result);
        } else {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
    } catch (error) {
        console.error('Error updating patient profile:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



export const getAllPatientProfiles = async (req, res) => {
    const result = await getAllPatients();
    res.status(result.success ? 200 : 400).json(result);
};

export const getPatientMedicalHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const patientResult = await getPatientByUserId(userId);
        if (patientResult.success && patientResult.data) {
            const patientId = patientResult.data.id;
            const result = await getMedicalHistoryByPatientId(patientId);
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(404).json({ success: false, message: 'Medical history not found for this patient' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
    } catch (error) {
        console.error('Error fetching patient medical history:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};