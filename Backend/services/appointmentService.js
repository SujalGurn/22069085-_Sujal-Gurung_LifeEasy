import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { schedule } from 'node-cron';
import QRCode from 'qrcode';
import moment from 'moment-timezone'; 
import dotenv from 'dotenv';

dotenv.config();

moment.tz.setDefault('Asia/Kathmandu');

console.log('JWT Secret:', process.env.JWT_SECRET ? 'exists' : 'missing');


function combineDateAndTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;

    // Extract date part only
    const dateOnly = new Date(dateStr).toISOString().split('T')[0];

    // Combine date and time into ISO format
    const dateTimeStr = `${dateOnly}T${timeStr}`;

    const combined = new Date(dateTimeStr);
    return isNaN(combined) ? null : combined;
}


const generateTokenNumber = async (doctorId, date, connection) => {
    try {
      const appointmentDate = moment(date).tz('Asia/Kathmandu');
      if (!appointmentDate.isValid()) {
        throw new Error(`Invalid date: ${date}`);
      }
  
      const dateStr = appointmentDate.format('YYYYMMDD');
      
      // Get last token atomically
      const [existing] = await connection.query(`
        SELECT MAX(token_number) AS last_token
        FROM appointments
        WHERE doctor_id = ?
        AND token_number LIKE ?
        FOR UPDATE
      `, [doctorId, `TKN-${String(doctorId).padStart(3,'0')}-${dateStr}-%`]);
  
      let sequence = 1;
      if (existing[0].last_token) {
        const lastSeq = existing[0].last_token.split('-').pop();
        sequence = parseInt(lastSeq, 10) + 1;
      }
  
      return `TKN-${String(doctorId).padStart(3,'0')}-${dateStr}-${String(sequence).padStart(4,'0')}`;
    } catch (error) {
      console.error('Token generation failed:', error);
      throw new Error('Failed to generate token');
    }
  };

const generateSecureToken = (appointment) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is undefined');
    }
    
    console.log("appointment.appointment_date:", appointment.appointment_date);
    console.log(" appointment.appointment_time:", appointment.appointment_time);

    const appointmentDateTime = combineDateAndTime(appointment.appointment_date, appointment.appointment_time);

    console.log(" parsed appointment datetime:", appointmentDateTime);
    console.log(" typeof:", typeof appointmentDateTime);
    
    if (!appointmentDateTime || isNaN(appointmentDateTime.getTime())) {
        throw new Error(`Invalid appointment datetime:\n  ${appointment.appointment_date} ${appointment.appointment_time}`);
    }

    const timeParts = appointment.appointment_time.split(':');
    if (timeParts.length !== 3 || timeParts.some(part => isNaN(part))) {
        throw new Error(`Malformed appointment time: ${appointment.appointment_time}`);
    }

    // Convert to moment objects
    const appointmentMoment = moment(appointmentDateTime);
    const expirationFromNow = moment().add(24, 'hours');
    const expirationFromAppointment = appointmentMoment.clone().add(1, 'hour');

    const expiresAt = moment.max(expirationFromNow, expirationFromAppointment);

    if (!expiresAt.isValid()) {
        throw new Error(`Invalid expiration calculation: 
          From Now: ${expirationFromNow.toString()}
          From Appointment: ${expirationFromAppointment.toString()}`);
    }

    // Convert expiresAt to MySQL-compatible format: 'YYYY-MM-DD HH:MM:SS'
    const expiresAtFormatted = expiresAt.format('YYYY-MM-DD HH:mm:ss');

    const payload = {
        appointmentId: appointment.id,
        doctorId: appointment.doctor_id,
        patientId: appointment.patient_id,
        version: 1,
        iat: moment().unix(),
        exp: expiresAt.unix()
    };

    // Return the token and expiration formatted as MySQL datetime
    return { 
        qrToken: jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' }),
        expiresAt: expiresAtFormatted // use formatted date here
    };
};


// Main appointment confirmation service
export const confirmAppointmentService = async (appointmentId, connection) => {
    let qrToken = null;
    
    try {
        const [appointment] = await connection.query(
            `SELECT 
    id,
    doctor_id,
    patient_id,
    appointment_date,
    DATE_FORMAT(appointment_time, '%H:%i:%s') AS appointment_time,
    status
  FROM appointments 
  WHERE id = ? FOR UPDATE`,
            [appointmentId]
        );

        if (!appointment.length) throw new Error("Appointment not found");
        if (appointment[0].status !== 'pending') throw new Error("Invalid appointment status");

        // Generate display token
        const displayToken = await generateTokenNumber(
            appointment[0].doctor_id,
            appointment[0].appointment_date,
            connection
        );

        // Generate secure token with proper expiration
        const { qrToken, expiresAt } = generateSecureToken(appointment[0]);

        // Check for invalid QR token length before proceeding
        if (!qrToken || qrToken.length > 500) {
            throw new Error('Invalid QR token generated');
        }

        // Generate QR image URL
        let qrImageUrl;
        try {
            qrImageUrl = await QRCode.toDataURL(qrToken);
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }

        // Update appointment in database
        await connection.query(
            `UPDATE appointments 
            SET token_number = ?,
                qr_token = ?,
                expires_at = ?,
                status = 'confirmed',
                is_used = 0
            WHERE id = ?`,
            [
                displayToken,
                qrToken,
                expiresAt,
                appointmentId
            ]
        );

        const [updated] = await connection.query(
            `SELECT qr_token, status 
             FROM appointments 
             WHERE id = ?`,
            [appointmentId]
        );

        const [verification] = await connection.query(
            `SELECT qr_token, LENGTH(qr_token) AS token_length 
             FROM appointments 
             WHERE id = ?`,
            [appointmentId]
        );

        if (updated[0].qr_token !== qrToken) {
            throw new Error('QR token mismatch in database storage');
        }

        console.log('Token Storage Verification:', {
            storedLength: verification[0].token_length,
            generatedLength: qrToken.length,
            match: verification[0].qr_token === qrToken
        });

        const [doctor] = await connection.query(
            `SELECT u.fullname 
             FROM doctors d
             JOIN users u ON d.user_id = u.id
             WHERE d.id = ?`,
            [appointment[0].doctor_id]
        );
        
        const doctorName = doctor.length ? doctor[0].fullname : 'Unknown Doctor';
        
        return { 
            displayToken,
            qrImageUrl,
            appointmentDetails: {
                patient_email: appointment[0].patient_email,
                patient_name: appointment[0].patient_name,
                doctor_name: doctorName,
                appointment_date: appointment[0].appointment_date,
                appointment_time: appointment[0].appointment_time
            }
        };

    } catch (error) {
        console.error('Confirmation Failed:', {
            error: error.message,
            appointmentId,
            tokenLength: qrToken?.length
        });
        throw error;
    }
};

// Cleanup expired tokens
const cleanupExpiredTokens = async () => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(`
            UPDATE appointments 
            SET status = 'completed'
            WHERE CONVERT_TZ(expires_at, '+00:00', 'Asia/Kathmandu') < NOW()
            AND status = 'confirmed'
            AND is_used = 0
        `);

        if (result.affectedRows > 0) {
            console.log(`Cleaned up ${result.affectedRows} expired appointments`);
        } else {
            console.log('No expired appointments to clean up');
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    } finally {
        connection.release();
    }
};

// Schedule daily cleanup at midnight Nepal time
schedule('0 0 * * *', cleanupExpiredTokens);

export default {
    generateTokenNumber,
    generateSecureToken,
    confirmAppointmentService
};