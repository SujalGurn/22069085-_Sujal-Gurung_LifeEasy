import { pool } from '../config/db.js';

export const createBed = async (bedData) => {
    try {
        const query = `
            INSERT INTO beds (bed_number, room_number, room_type, status, notes, assigned_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            bedData.bed_number,
            bedData.room_number,
            bedData.room_type,
            bedData.status || 'available',
            bedData.notes || null,
            bedData.assigned_by,
        ]);
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error('Error creating bed:', error);
        return { success: false, message: 'Failed to create bed', error: error.message };
    }
};

export const updateBed = async (id, bedData) => {
    try {
        const query = `
            UPDATE beds
            SET bed_number = ?, room_number = ?, room_type = ?, status = ?, notes = ?, last_updated_by = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [
            bedData.bed_number,
            bedData.room_number,
            bedData.room_type,
            bedData.status,
            bedData.notes || null,
            bedData.last_updated_by,
            id,
        ]);
        if (result.affectedRows === 0) {
            return { success: false, message: 'Bed not found' };
        }
        return { success: true };
    } catch (error) {
        console.error('Error updating bed:', error);
        return { success: false, message: 'Failed to update bed', error: error.message };
    }
};

export const deleteBed = async (id) => {
    try {
        const [check] = await pool.query('SELECT status FROM beds WHERE id = ?', [id]);
        if (check.length === 0) {
            return { success: false, message: 'Bed not found' };
        }
        if (check[0].status === 'occupied') {
            return { success: false, message: 'Cannot delete occupied bed' };
        }
        const [result] = await pool.query('DELETE FROM beds WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return { success: false, message: 'Bed not found' };
        }
        return { success: true };
    } catch (error) {
        console.error('Error deleting bed:', error);
        return { success: false, message: 'Failed to delete bed', error: error.message };
    }
};

export const assignBedToPatient = async (id, patientId, admissionDate, assignedBy) => {
    try {
        console.log('Assigning bed:', { id, patientId, admissionDate, assignedBy });

        // Check if bed exists
        const [bedCheck] = await pool.query('SELECT status FROM beds WHERE id = ?', [id]);
        if (bedCheck.length === 0) {
            console.error('Bed not found:', id);
            return { success: false, message: 'Bed not found' };
        }
        if (bedCheck[0].status !== 'available') {
            console.error('Bed is not available:', bedCheck[0].status);
            return { success: false, message: `Bed is not available (current status: ${bedCheck[0].status})` };
        }

        // Validate patient_id
        if (!patientId || isNaN(patientId)) {
            console.error('Invalid patient_id:', patientId);
            return { success: false, message: 'Invalid patient ID' };
        }
        const [patientCheck] = await pool.query('SELECT id FROM patient WHERE id = ?', [patientId]);
        if (patientCheck.length === 0) {
            console.error('Patient not found:', patientId);
            return { success: false, message: `Patient with ID ${patientId} not found` };
        }

        // Validate admission_date
        const parsedDate = new Date(admissionDate);
        if (isNaN(parsedDate.getTime())) {
            console.error('Invalid admission_date:', admissionDate);
            return { success: false, message: 'Invalid admission date' };
        }

        // Validate assigned_by
        const [userCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [assignedBy]);
        if (userCheck.length === 0) {
            console.error('Invalid assigned_by user:', assignedBy);
            return { success: false, message: 'Invalid user assigning the bed' };
        }

        const query = `
            UPDATE beds
            SET status = 'occupied', patient_id = ?, admission_date = ?, assigned_by = ?, last_updated_by = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [patientId, parsedDate, assignedBy, assignedBy, id]);
        if (result.affectedRows === 0) {
            console.error('Failed to update bed:', id);
            return { success: false, message: 'Failed to assign bed' };
        }

        console.log('Bed assigned successfully:', { id, patientId });
        return { success: true };
    } catch (error) {
        console.error('Error assigning bed:', error);
        return { success: false, message: 'Failed to assign bed', error: error.message };
    }
};

export const dischargePatientFromBed = async (id, dischargeDate, lastUpdatedBy) => {
    try {
        const [check] = await pool.query('SELECT status FROM beds WHERE id = ?', [id]);
        if (check.length === 0) {
            return { success: false, message: 'Bed not found' };
        }
        if (check[0].status !== 'occupied') {
            return { success: false, message: 'Bed is not occupied' };
        }

        // Get valid ENUM values for status
        const [enumResult] = await pool.query("SHOW COLUMNS FROM beds LIKE 'status'");
        const enumValues = enumResult[0].Type.match(/'([^']+)'/g).map(val => val.replace(/'/g, ''));
        const newStatus = 'cleaning';
        if (!enumValues.includes(newStatus)) {
            console.error(`Invalid status value: ${newStatus}. Valid values: ${enumValues.join(', ')}`);
            return { success: false, message: `Invalid status value: ${newStatus}` };
        }

        // Check if last_updated_by column exists
        const [columns] = await pool.query('SHOW COLUMNS FROM beds LIKE ?', ['last_updated_by']);
        const hasLastUpdatedBy = columns.length > 0;

        let query = `
            UPDATE beds
            SET status = ?, patient_id = NULL, discharge_date = ?
        `;
        const params = [newStatus, dischargeDate];
        if (hasLastUpdatedBy) {
            query += ', last_updated_by = ?';
            params.push(lastUpdatedBy);
        }
        query += ' WHERE id = ?';
        params.push(id);

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return { success: false, message: 'Bed not found' };
        }
        console.log('Patient discharged successfully:', { id });
        return { success: true };
    } catch (error) {
        console.error('Error discharging patient:', error);
        return { success: false, message: 'Failed to discharge patient', error: error.message };
    }
};


export const getAllBeds = async (filters = {}) => {
    try {
        let query = 'SELECT * FROM beds WHERE 1=1';
        const params = [];
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.room_type) {
            query += ' AND room_type = ?';
            params.push(filters.room_type);
        }
        if (filters.room_number) {
            query += ' AND room_number = ?';
            params.push(filters.room_number);
        }
        query += ' ORDER BY room_number, bed_number';
        const [rows] = await pool.query(query, params);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error fetching beds:', error);
        return { success: false, message: 'Failed to fetch beds', error: error.message };
    }
};

export const getBedById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM beds WHERE id = ?', [id]);
        if (rows.length === 0) {
            return { success: false, message: 'Bed not found' };
        }
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error('Error fetching bed:', error);
        return { success: false, message: 'Failed to fetch bed', error: error.message };
    }
};