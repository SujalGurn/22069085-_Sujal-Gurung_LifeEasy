import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { schedule } from 'node-cron';
import QRCode from 'qrcode';
import moment from 'moment-timezone';
import dotenv from 'dotenv';

dotenv.config();
moment.tz.setDefault('Asia/Kathmandu');

// Constants
const TOKEN_PREFIX = 'TKN';
const MAX_TOKEN_LENGTH = 512;
const TOKEN_EXPIRATION_BUFFER = { hours: 24 };
const APPOINTMENT_EXPIRATION_BUFFER = { hours: 1 };

const generateTokenNumber = async (doctorId, date, connection) => {
    const dateMoment = moment(date, 'YYYY-MM-DD', true);
    if (!dateMoment.isValid()) {
        throw new Error(`Invalid date format: ${date}`);
    }
    
    const dateStr = dateMoment.format('YYYYMMDD');
    const pattern = `${TOKEN_PREFIX}-${String(doctorId).padStart(3, '0')}-${dateStr}-%`;

    const [existing] = await connection.query(
        `SELECT MAX(token_number) AS last_token 
        FROM appointments 
        WHERE doctor_id = ? 
        AND token_number LIKE ?
        FOR UPDATE`,
        [doctorId, pattern]
    );

    const sequence = existing[0].last_token 
        ? parseInt(existing[0].last_token.split('-').pop(), 10) + 1 
        : 1;

    return `${TOKEN_PREFIX}-${String(doctorId).padStart(3, '0')}-${dateStr}-${String(sequence).padStart(4, '0')}`;
};

const validateAppointmentIds = (appointment) => {
    const numericIds = {
        appointmentId: Number(appointment.id),
        doctorId: Number(appointment.doctor_id),
        patientId: Number(appointment.patient_id)
    };

    if (Object.values(numericIds).some(isNaN)) {
        throw new Error('Invalid appointment IDs - non-numeric values detected');
    }

    return numericIds;
};

const calculateExpiration = (appointmentDateTime) => {
    const now = moment().tz('Asia/Kathmandu');
    const expirationFromNow = now.clone().add(24, 'hours'); // 24-hour validity
    const appointmentExpiration = moment(appointmentDateTime).add(1, 'hour');
    
    return moment.max(expirationFromNow, appointmentExpiration).utc();
  };

  const generateSecureToken = (appointment) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable not configured');
    }

    // Convert to strings explicitly
    const rawDate = String(appointment.appointment_date);
    const rawTime = String(appointment.appointment_time);

    // Debug raw inputs
    console.log('[DEBUG] Raw Date:', rawDate, 'Type:', typeof rawDate);
    console.log('[DEBUG] Raw Time:', rawTime, 'Type:', typeof rawTime);

    // Validate formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    
    if (!dateRegex.test(rawDate)) {
        throw new Error(`Invalid date format: ${rawDate}. Expected YYYY-MM-DD`);
    }
  
    if (!timeRegex.test(rawTime)) {
        throw new Error(`Invalid time format: ${rawTime}. Expected HH:mm:ss`);
    }

    // Create ISO-like string with explicit timezone
    const appointmentDateTime = moment.tz(
        `${rawDate}T${rawTime}`,
        'YYYY-MM-DDTHH:mm:ss',
        'Asia/Kathmandu'
    );

    // Detailed validation
    if (!appointmentDateTime.isValid()) {
        console.error('[DEBUG] Moment Validation Failed:', {
            input: `${rawDate}T${rawTime}`,
            isValid: appointmentDateTime.isValid(),
            invalidAt: appointmentDateTime.invalidAt(),
            zone: appointmentDateTime.format('Z')
        });
        throw new Error(`Invalid datetime combination: ${rawDate} ${rawTime}`);
    }

    console.log('[DEBUG] Valid DateTime:', appointmentDateTime.format());

    // Calculate expiration
    const numericIds = validateAppointmentIds(appointment);
    const expiresAt = calculateExpiration(appointmentDateTime);

    // Generate JWT
    return {
        qrToken: jwt.sign(
            { 
                ...numericIds, 
                exp: expiresAt.unix() 
            },
            process.env.JWT_SECRET,
            { algorithm: 'HS256' }
        ),
        expiresAt: expiresAt.utc().format('YYYY-MM-DD HH:mm:ss')
    };
};

export const confirmAppointmentService = async (appointment, connection) => {
    try {
      if (!process.env.JWT_SECRET || !process.env.FRONTEND_URL) {
        throw new Error("JWT_SECRET or FRONTEND_URL is missing in .env");
      }
  
      // Generate tokens
      const [displayToken, { qrToken, expiresAt }] = await Promise.all([
        generateTokenNumber(appointment.doctor_id, appointment.appointment_date, connection),
        generateSecureToken(appointment)
      ]);
  
      // ✅ Update database with trimmed token
      await connection.query(
        `UPDATE appointments SET qr_token = ? WHERE id = ?`,
        [qrToken, appointment.id]  // No .trim() here
      );
  
      if (qrToken.length > MAX_TOKEN_LENGTH) {
        throw new Error(`Token exceeds ${MAX_TOKEN_LENGTH} characters`);
      }
  
      // ✅ Proper URL construction
      const verificationUrl = new URL(
        "/verify-appointment",
        process.env.FRONTEND_URL
      );
      verificationUrl.searchParams.set("token", encodeURIComponent(qrToken));
  
      const qrImageUrl = await QRCode.toDataURL(verificationUrl.toString(), {
        errorCorrectionLevel: "H",
        margin: 2,
        scale: 8,
      });
  
      return { qrToken, displayToken, expiresAt, qrImageUrl };
  
    } catch (error) {
      console.error("Appointment confirmation failed:", error);
      throw new Error(`Confirmation failed: ${error.message}`);
    }
  };

const cleanupExpiredTokens = async () => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(`
            UPDATE appointments 
            SET status = 'expired'
            WHERE expires_at < UTC_TIMESTAMP()
            AND status = 'confirmed'
            AND is_used = 0
        `);
        
        if (result.affectedRows > 0) {
            console.log(`Marked ${result.affectedRows} expired appointments`);
        }
    } catch (error) {
        console.error('Expired appointments cleanup failed:', error);
        throw error;
    } finally {
        connection.release();
    }
};

schedule('0 0 * * *', cleanupExpiredTokens);

export default {
    generateTokenNumber,
    confirmAppointmentService
};