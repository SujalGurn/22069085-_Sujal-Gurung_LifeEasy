import { createPatient, getPatientByUserId, updatePatient, getAllPatients } from '../models/Patient.js';
import { getMedicalHistoryByPatientId } from '../models/MedicalHistory.js';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from '../models/userModel.js';

export const createPatientProfile = async (req, res) => {
    try {
        const patientData = {
            user_id: req.user.id,
            patient_code: `PAT-${uuidv4().substring(0, 8).toUpperCase()}`,
            gender: req.body.gender,
            blood_group: req.body.blood_group,
            address: req.body.address,
            contact_number: req.body.contact_number,
            emergency_contact_name: req.body.emergency_contact_name,
            emergency_contact_number: req.body.emergency_contact_number,
            profile_picture: req.file ? `uploads/profiles/${req.file.filename}` : null,
        };
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
        const userId = req.user.id;
        const patientResult = await getPatientByUserId(userId);

        if (patientResult.success && patientResult.data) {
            const userResult = await getUserById(userId);
            if (userResult.success && userResult.data) {
                return res.status(200).json({
                    success: true,
                    data: { ...patientResult.data, fullname: userResult.data.fullname, email: userResult.data.email },
                });
            } else {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
        } else {
            return res.status(200).json({ success: true, data: null });
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
            const patientData = {
                gender: req.body.gender,
                blood_group: req.body.blood_group,
                address: req.body.address,
                contact_number: req.body.contact_number,
                emergency_contact_name: req.body.emergency_contact_name,
                emergency_contact_number: req.body.emergency_contact_number,
                profile_picture: req.file ? `uploads/profiles/${req.file.filename}` : patientResult.data.profile_picture,
            };
            const result = await updatePatient(patientId, patientData);
            return res.status(result.success ? 200 : 404).json(result);
        } else {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }
    } catch (error) {
        console.error('Error updating patient profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
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