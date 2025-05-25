// import { pool } from '../config/db.js';

// export const createLog = async (logData) => {
//     try {
//         const query = `
//             INSERT INTO systemlog (doctorId, loginTime, logoutTime, activityDetail)
//             VALUES (?, ?, ?, ?)
//         `;
//         const values = [
//             logData.doctorId,
//             logData.loginTime || new Date(),
//             logData.logoutTime || null,
//             logData.activityDetail,
//         ];
//         const [result] = await pool.query(query, values);
//         return { success: true, logId: result.insertId, message: 'Log created successfully' };
//     } catch (error) {
//         console.error('Error creating log:', error);
//         return { success: false, message: 'Failed to create log', error: error.message };
//     }
// };

// export const updateLog = async (logId, logData) => {
//     try {
//         const query = `
//             UPDATE systemlog
//             SET logoutTime = ?, activityDetail = ?
//             WHERE LogId = ?
//         `;
//         const values = [
//             logData.logoutTime || null,
//             logData.activityDetail,
//             logId,
//         ];
//         const [result] = await pool.query(query, values);
//         return result.affectedRows > 0
//             ? { success: true, message: 'Log updated successfully' }
//             : { success: false, message: 'Log not found' };
//     } catch (error) {
//         console.error('Error updating log:', error);
//         return { success: false, message: 'Failed to update log', error: error.message };
//     }
// };

// export const getLogsByDoctorId = async (doctorId) => {
//     try {
//         const [rows] = await pool.query('SELECT * FROM systemlog WHERE doctorId = ?', [doctorId]);
//         return { success: true, data: rows };
//     } catch (error) {
//         console.error('Error fetching logs:', error);
//         return { success: false, message: 'Failed to fetch logs', error: error.message };
//     }
// };

// export const getAllLogs = async () => {
//     try {
//         const [rows] = await pool.query('SELECT s.*, u.fullname FROM systemlog s JOIN users u ON s.doctorId = u.id');
//         return { success: true, data: rows };
//     } catch (error) {
//         console.error('Error fetching all logs:', error);
//         return { success: false, message: 'Failed to fetch all logs', error: error.message };
//     }
// };