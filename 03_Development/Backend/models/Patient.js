import { pool } from '../config/db.js';

export const createPatient = async (patientData) => {
    try {
        const query = `
            INSERT INTO patient (
                user_id, 
                patient_code, 
                gender, 
                blood_group, 
                address, 
                contact_number, 
                emergency_contact_name, 
                emergency_contact_number, 
                profile_picture
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            patientData.user_id,
            patientData.patient_code,
            patientData.gender,
            patientData.blood_group,
            patientData.address,
            patientData.contact_number,
            patientData.emergency_contact_name,
            patientData.emergency_contact_number,
            patientData.profile_picture || null,
        ];
        const [result] = await pool.query(query, values);
        return { success: true, patientId: result.insertId, message: 'Patient created successfully' };
    } catch (error) {
        console.error('Error creating patient:', error);
        return { success: false, message: 'Failed to create patient', error: error.message };
    }
};

export const getPatientByUserId = async (userId) => {
    try {
        console.log('Fetching patient with user ID:', userId);
        const [rows] = await pool.query('SELECT * FROM patient WHERE user_id = ?', [userId]);
        console.log('Query Results:', rows);
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error('Error fetching patient by user ID:', error);
        return { success: false, message: 'Failed to fetch patient', error: error.message };
    }
};

export const updatePatient = async (patientId, patientData) => {
    try {
        const query = `
            UPDATE patient
            SET 
                gender = ?, 
                blood_group = ?, 
                address = ?, 
                contact_number = ?, 
                emergency_contact_name = ?, 
                emergency_contact_number = ?, 
                profile_picture = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const values = [
            patientData.gender,
            patientData.blood_group,
            patientData.address,
            patientData.contact_number,
            patientData.emergency_contact_name,
            patientData.emergency_contact_number,
            patientData.profile_picture || null,
            patientId,
        ];
        const [result] = await pool.query(query, values);
        return result.affectedRows > 0
            ? { success: true, message: 'Patient updated successfully' }
            : { success: false, message: 'Patient not found' };
    } catch (error) {
        console.error('Error updating patient:', error);
        return { success: false, message: 'Failed to update patient', error: error.message };
    }
};

export const getAllPatients = async () => {
    try {
        const [rows] = await pool.query('SELECT p.*, u.fullname, u.email FROM patient p JOIN users u ON p.user_id = u.id');
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error fetching all patients:', error);
        return { success: false, message: 'Failed to fetch all patients', error: error.message };
    }
};

export const getPatientById = async (patientId) => {
    try {
        const [rows] = await pool.query('SELECT * FROM patient WHERE id = ?', [patientId]);
        if (rows.length > 0) {
            return { success: true, data: rows[0] };
        } else {
            return { success: false, message: 'Patient not found' };
        }
    } catch (error) {
        console.error('Error fetching patient by ID:', error);
        return { success: false, message: 'Failed to fetch patient', error: error.message };
    }
};