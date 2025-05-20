import { pool } from '../config/db.js';

export const createStaff = async (staffData) => {
    try {
        const query = `
            INSERT INTO staff
            (full_name, address, email, role, department, shift, specialization, contact_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            staffData.full_name,
            staffData.address,
            staffData.email,
            staffData.role,
            staffData.department,
            staffData.shift,
            staffData.specialization || null,
            staffData.contact_number
        ];

        const [result] = await pool.query(query, values);
        return {
            success: true,
            staffId: result.insertId,
            message: `${staffData.role} created successfully`
        };
    } catch (error) {
        console.error('Database error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, message: "Email already exists" };
        }
        return { success: false, message: "Database operation failed" };
    }
};

export const getAllStaff = async () => {
    try {
        const [rows] = await pool.query(`
            SELECT id, full_name , address, role, department, shift,
                   contact_number, specialization, email
            FROM staff
            ORDER BY created_at DESC
        `);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error fetching staff:', error);
        return {
            success: false,
            message: "Failed to retrieve staff list",
            error: error.message
        };
    }
};

export const updateStaff = async (id, staffData) => {
    try {
        const query = `
            UPDATE staff
            SET full_name = ?,
                address = ?,
                email = ?,
                role = ?,
                department = ?,
                shift = ?,
                specialization = ?,
                contact_number = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const values = [
            staffData.full_name,
            staffData.address,
            staffData.email,
            staffData.role,
            staffData.department,
            staffData.shift,
            staffData.specialization || null,
            staffData.contact_number,
            id
        ];

        const [result] = await pool.query(query, values);
        return result.affectedRows > 0
            ? { success: true, message: `Staff member with ID ${id} updated` }
            : { success: false, message: `Staff member with ID ${id} not found` };
    } catch (error) {
        console.error(`Error updating staff member with ID ${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, message: "Email already exists" };
        }
        return { success: false, message: "Database update failed" };
    }
};

export const deleteStaff = async (id) => {
    try {
        const [result] = await pool.query('DELETE FROM staff WHERE id = ?', [id]);
        return result.affectedRows > 0
            ? { success: true, message: `Staff member with ID ${id} deleted` }
            : { success: false, message: `Staff member with ID ${id} not found` };
    } catch (error) {
        console.error(`Error deleting staff member with ID ${id}:`, error);
        return { success: false, message: "Database delete failed" };
    }
};