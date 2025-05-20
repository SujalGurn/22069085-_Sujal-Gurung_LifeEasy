// backend/models/MedicalHistory.js

import { pool } from '../config/db.js';

export const createMedicalHistory = async (historyData) => {
    try {
        const query = `
            INSERT INTO medicalHistory (patient_id, recorded_by_user_id, blood_pressure, medication, allergies, weight, height, medical_condition, diagnosis, treatment, notes, report_name, report_path, report_date, report_type, report_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            historyData.patient_id,
            historyData.recorded_by_user_id,
            historyData.blood_pressure,
            historyData.medication,
            historyData.allergies,
            historyData.weight,
            historyData.height,
            historyData.medical_condition,
            historyData.diagnosis,
            historyData.treatment,
            historyData.notes,
            historyData.report_name,
            historyData.report_path,
            historyData.report_date,
            historyData.report_type,
            historyData.report_notes,
        ];
        const [result] = await pool.query(query, values);
        return { success: true, historyId: result.insertId, message: 'Medical history created successfully' };
    } catch (error) {
        console.error('Error creating medical history:', error);
        return { success: false, message: 'Failed to create medical history', error: error.message };
    }
};

export const getMedicalHistoryByPatientId = async (patientId) => {
    try {
        const [rows] = await pool.query('SELECT * FROM medicalHistory WHERE patient_id = ? ORDER BY recorded_at DESC', [patientId]);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error fetching medical history:', error);
        return { success: false, message: 'Failed to fetch medical history', error: error.message };
    }
};

export const updateMedicalHistory = async (historyId, historyData) => {
    try {
        const query = `
            UPDATE medicalHistory
            SET blood_pressure = ?, medication = ?, allergies = ?, weight = ?, height = ?,
                medical_condition = ?, diagnosis = ?, treatment = ?, notes = ?,
                report_name = ?, report_path = ?, report_date = ?, report_type = ?, report_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const values = [
            historyData.blood_pressure,
            historyData.medication,
            historyData.allergies,
            historyData.weight,
            historyData.height,
            historyData.medical_condition,
            historyData.diagnosis,
            historyData.treatment,
            historyData.notes,
            historyData.report_name,
            historyData.report_path,
            historyData.report_date,
            historyData.report_type,
            historyData.report_notes,
            historyId,
        ];
        const [result] = await pool.query(query, values);
        return result.affectedRows > 0
            ? { success: true, message: 'Medical history updated successfully' }
            : { success: false, message: 'Medical history not found' };
    } catch (error) {
        console.error('Error updating medical history:', error);
        return { success: false, message: 'Failed to update medical history', error: error.message };
    }
};


export const getMedicalHistoryById = async (historyId) => {
    try {
        const [rows] = await pool.query('SELECT * FROM medicalHistory WHERE id = ?', [historyId]);
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error('Error fetching medical history by ID:', error);
        return { success: false, message: 'Failed to fetch medical history', error: error.message };
    }
};

export const getAllMedicalHistory = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM medicalHistory ORDER BY recorded_at DESC');
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error fetching all medical history:', error);
        return { success: false, message: 'Failed to fetch all medical history', error: error.message };
    }
};


