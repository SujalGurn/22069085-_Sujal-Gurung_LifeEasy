import { pool } from "../config/db.js";
import crypto from "crypto";
import moment from "moment";
import { confirmAppointmentService } from "../services/appointmentService.js";
import { sendAppointmentConfirmation } from "../services/notificationService.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import qrcode from 'qrcode';

dotenv.config();


moment.tz.setDefault('Asia/Kathmandu');

export const createAppointment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { doctor_id, date, time, reason, notes } = req.body;
        const patient_id = req.user.id;

        // Validate inputs
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format (YYYY-MM-DD required)"
            });
        }

        if (!moment(time, 'HH:mm:ss', true).isValid()) {
            return res.status(400).json({
                success: false,
                message: "Invalid time format (HH:mm:ss required)"
            });
        }

        await connection.beginTransaction();

        // Check doctor availability
        const [doctor] = await connection.query(
            'SELECT id FROM doctors WHERE id = ?',
            [doctor_id]
        );
        if (!doctor.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const appointmentDate = moment.tz(
            `${date} ${time}`,
            'YYYY-MM-DD HH:mm:ss',
            'Asia/Kathmandu'
        );
        
        if (!appointmentDate.isValid()) {
            return res.status(400).json({
                success: false,
                message: "Invalid date-time combination"
            });
        }
  

        const [availability] = await connection.query(`
            SELECT id 
            FROM doctor_availability 
            WHERE doctor_id = ? 
            AND day_of_week = ? 
            AND ? BETWEEN start_time AND end_time 
            AND is_available = 1 
            LIMIT 1`,
            [doctor_id, appointmentDate.format('dddd'), time]
        );

        if (!availability.length) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Doctor not available at this time"
            });
        }

        const tempExpiration = moment()
            .tz('Asia/Kathmandu')
            .add(2, 'hours')
            .utc()
            .format('YYYY-MM-DD HH:mm:ss');

            const [result] = await connection.query(
                `INSERT INTO appointments (
                    patient_id, 
                    doctor_id, 
                    appointment_date, 
                    appointment_time, 
                    reason, 
                    notes, 
                    status,
                    expires_at,
                    qr_token  -- Remove JavaScript-style comment
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [
                    patient_id,
                    doctor_id,
                    moment(date).format('YYYY-MM-DD'),
                    moment(time, 'HH:mm:ss').format('HH:mm:ss'),
                    reason,
                    notes || '',
                    'pending',
                    tempExpiration,
                    'pending_generation' 
                ]
              );

        await connection.commit();
        return res.status(201).json({ 
            success: true, 
            appointmentId: result.insertId 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Appointment Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    } finally {
        connection.release();
    }
};


export const confirmAppointmentHandler = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const appointmentId = Number(req.params.id);
        if (isNaN(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID format"
            });
        }
        const [appointment] = await connection.query(`
                SELECT 
                    id,
                    DATE_FORMAT(appointment_date, '%Y-%m-%d') AS appointment_date,
                    TIME_FORMAT(appointment_time, '%H:%i:%s') AS appointment_time,
                    doctor_id,
                    patient_id,
                    status
                FROM appointments 
                WHERE id = ? FOR UPDATE`,
            [appointmentId]
        );

        if (!appointment.length) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        const currentStatus = appointment[0].status;
        if (currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Cannot confirm cancelled appointment"
            });
        }
        if (currentStatus === 'confirmed') {
            return res.status(400).json({
                success: false,
                message: "Appointment already confirmed"
            });
        }
        const doctorId = Number(appointment[0].doctor_id);
        if (isNaN(doctorId)) {
            throw new Error('Invalid doctor ID in appointment');
        }

        //  Call confirmAppointmentService to generate tokens and other data
        const {  qrToken, displayToken, expiresAt, qrImageUrl  } = await confirmAppointmentService(appointment[0], connection);

        // Generate QR code URL using the token
        // const verificationUrl = `${process.env.BASE_URL}/api/appointments/verify?token=${qrToken}`;
        // let qrImageUrl;
        // try {
        //     qrImageUrl = await qrcode.toDataURL(verificationUrl); // Generate QR code image URL
        // } catch (qrCodeError) {
        //     console.error("QR Code generation error:", qrCodeError);
        //     return res.status(500).json({
        //         success: false,
        //         message: "Failed to generate QR code",
        //         error: qrCodeError.message
        //     });
        // }
        await connection.query(
            `UPDATE appointments SET
                qr_token = ?,
                token_number = ?,
                expires_at = ?,
                status = 'confirmed'
            WHERE id = ?`,
            [qrToken, displayToken, expiresAt, appointmentId]
        );
        await connection.query(
            `INSERT INTO token_logs (appointment_id, qr_token, verification_result)
             VALUES (?, ?, 'valid')`,
            [appointmentId, qrToken]
        );
        await connection.commit();

        const [confirmedAppointment] = await connection.query(
            `SELECT a.*, u.email AS patient_email, 
                 u.fullname AS patient_name, u2.fullname AS doctor_name
             FROM appointments a
             JOIN users u ON a.patient_id = u.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u2 ON d.user_id = u2.id
             WHERE a.id = ?`,
            [appointmentId]
        );
        // Send the confirmation email.
        try{
           await sendAppointmentConfirmation(confirmedAppointment[0], qrImageUrl);
        } catch(mailError){
            console.error("Mail send error:", mailError);
             // Optionally, you might want to throw an error or handle this situation.  For example:
             return res.status(500).json({ success: false, message: "Appointment confirmed, but email sending failed.", qrImageUrl });
        }
       

        return res.json({
            success: true,
            message: "Appointment confirmed successfully",
            qrImageUrl
        });

    } catch (error) {
        await connection.rollback();
        console.error("Confirmation Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
};





// export const getAllDoctors = async (req, res) => {
//     try {
//         const [doctors] = await pool.query('SELECT * FROM doctors');
//         res.json({ success: true, doctors });
//     } catch (error) {
//         console.error('Error fetching doctors:', error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

export const getAllDoctors = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                d.id,
                u.fullname,
                u.contact,
                u.email,
                d.specialization,
                d.license_number,
                d.about
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.verification_status = 'approved'
            AND u.role = 'doctor'
        `);

        res.status(200).json({ 
            success: true, 
            doctors: rows 
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch doctors' 
        });
    }
};




export const getDoctorDetails = async (req, res) => {
    try {
        const [doctor] = await pool.query(`
            SELECT 
                d.*, 
                u.fullname,
                u.email,
                u.contact
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        `, [req.params.id]);

        if (!doctor.length) {
            return res.status(404).json({ 
                success: false, 
                message: "Doctor not found" 
            });
        }

        res.json({
            success: true,
            doctor: {
                id: doctor[0].id,
                fullname: doctor[0].fullname,
                specialization: doctor[0].specialization,
                contact: doctor[0].contact,
                licenseNumber: doctor[0].license_number
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

export const getAvailableDates = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const numericId = parseInt(doctorId, 10);
        
        if (isNaN(numericId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID format"
            });
        }
        
        const [availability] = await pool.query(`
            SELECT DISTINCT day_of_week 
            FROM doctor_availability 
            WHERE doctor_id = ? 
            AND is_available = 1
            ORDER BY FIELD(day_of_week,
                'Monday', 'Tuesday', 'Wednesday',
                'Thursday', 'Friday', 'Saturday', 'Sunday'
            )`, 
            [doctorId]
        );
        
        res.json({ 
            success: true, 
            days: availability.map(d => d.day_of_week) 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch available days' 
        });
    }
};

export const getAvailableTimeSlots = async (req, res) => {
    const doctorId = req.params.id;
    const dayOfWeek = req.query.day;
    try {
        const [slots] = await pool.query(`
            SELECT 
                DATE_FORMAT(start_time, '%H:%i') AS start_time,
                DATE_FORMAT(end_time, '%H:%i') AS end_time
            FROM doctor_availability
            WHERE doctor_id = ? AND day_of_week = ?
            ORDER BY start_time`,
            [doctorId, dayOfWeek]
        );
        
        res.json({ 
            success: true, 
            timeSlots: slots 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch time slots' 
        });
    }
};



export const rejectAppointmentHandler = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const appointmentId = req.params.id;

        await connection.beginTransaction();

        const [appointment] = await connection.query(
            "SELECT * FROM appointments WHERE id = ? FOR UPDATE",
            [appointmentId]
        );

        if (!appointment.length) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        if (appointment[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Cannot reject a non-pending appointment"
            });
        }

        await connection.query(
            "UPDATE appointments SET status = 'cancelled' WHERE id = ?",
            [appointmentId]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Appointment is cancelled successfully"
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error rejecting appointment:", error);
        return res.status(500).json({
            success: false,
            message: "Error rejecting appointment",
            error: error.message
        });
    } finally {
        connection.release();
    }
};





export const verifyAppointment = async (req, res) => {
    console.log('[VERIFY] verifyAppointment function has been hit!');
    const connection = await pool.getConnection();
    let decoded = null;
    let token = null;

    try {
        // Initial setup and token extraction
        const startTime = Date.now();
        ({ token } = req.query);
        console.log('[VERIFY] Received token:', token);

        // Validate token presence and format
        if (!token || !token.startsWith('eyJ')) {
            console.log('[VERIFY] Invalid token format:', token);
            return res.status(400).json({
                success: false,
                code: 'INVALID_FORMAT',
                message: "Invalid QR code format"
            });
        }

        // Clean and decode token
        token = decodeURIComponent(token || '').replace(/[^\x20-\x7E]/g, '');
        // Debug logging
        console.log('[VERIFY] Processing token:', {
            start: token.substring(0, 20),
            end: token.slice(-20),
            length: token.length,
            hexStart: Buffer.from(token.substring(0, 10)).toString('hex')
        });
        // Add hex comparison logging
        console.log('[VERIFY] Token Hex Start:', Buffer.from(token.substring(0, 20)).toString('hex'));

        // Verify JWT structure and signature
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ["HS256"],
                clockTolerance: 15,
                ignoreExpiration: false
            });
            console.log('[VERIFY] JWT Decoded Payload:', decoded);
        } catch (jwtError) {
            console.error('[VERIFY] JWT Verification Error:', jwtError.name, jwtError.message);
            let code = 'INVALID_TOKEN';
            if (jwtError.name === 'TokenExpiredError') code = 'EXPIRED';
            if (jwtError.message.includes('jwt malformed')) code = 'INVALID_FORMAT';
            return res.status(400).json({ success: false, code, message: jwtError.message });
        }

        // Validate decoded payload
        if (!decoded?.appointmentId || !decoded?.doctorId || !decoded?.patientId) {
            console.log('[VERIFY] Malformed payload:', decoded);
            return res.status(400).json({
                success: false,
                code: 'MALFORMED_PAYLOAD',
                message: "Invalid token contents"
            });
        }

        // Convert to numeric IDs with validation
        const numericIds = {
            appointmentId: Number(decoded.appointmentId),
            doctorId: Number(decoded.doctorId),
            patientId: Number(decoded.patientId)
        };

        if (Object.values(numericIds).some(isNaN)) {
            console.error('[VERIFY] Invalid ID format:', numericIds);
            return res.status(400).json({
                success: false,
                code: 'INVALID_IDS',
                message: "Invalid appointment identifiers"
            });
        }

        await connection.beginTransaction();

        // Get server time for validation
        const [serverTime] = await connection.query('SELECT UTC_TIMESTAMP() AS utc_now');
        console.log('[VERIFY] Server time (UTC):', serverTime[0].utc_now);

        // Database check with exact binary match
        const [appointment] = await connection.query(`
            SELECT
                *,
                expires_at > UTC_TIMESTAMP() AS is_valid,
                TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), expires_at) AS ttl
            FROM appointments
            WHERE id = ?
            AND qr_token COLLATE utf8_bin = ? /* Exact binary match */
            FOR UPDATE
        `, [numericIds.appointmentId, token]);
        console.log('[VERIFY] Appointment query result:', appointment);

        // Handle missing appointment or token mismatch
        if (!appointment.length) {
            const [dbEntry] = await connection.query(
                `SELECT
                    qr_token,
                    status,
                    is_used,
                    expires_at < UTC_TIMESTAMP() AS is_expired
                FROM appointments
                WHERE id = ?`,
                [numericIds.appointmentId]
            );
            console.log('[VERIFY] Appointment existence check:', dbEntry);

            if (!dbEntry.length) {
                return res.status(404).json({
                    success: false,
                    code: 'APPOINTMENT_NOT_FOUND',
                    message: "Appointment does not exist"
                });
            }

            const entry = dbEntry[0];
            const tokenComparison = {
                receivedLength: token.length,
                storedLength: entry.qr_token?.length,
                match: entry.qr_token === token
            };
            console.log('[VERIFY] Token mismatch analysis:', tokenComparison);

            let errorCode = 'VERIFICATION_FAILED';
            let message = 'Invalid QR code';

            if (entry.is_expired) errorCode = 'EXPIRED';
            if (entry.is_used) errorCode = 'ALREADY_USED';
            if (entry.status !== 'confirmed') errorCode = 'INVALID_STATUS';
            if (entry.qr_token !== token) errorCode = 'TOKEN_MISMATCH';

            return res.status(400).json({
                success: false,
                code: errorCode,
                message: errorCode === 'INVALID_STATUS'
                    ? `Appointment is ${entry.status}`
                    : message
            });
        }

        const appointmentData = appointment[0];

        if (!appointmentData.is_valid) {
            return res.status(400).json({ success: false, code: 'EXPIRED', message: 'QR code expired' });
        }

        if (appointmentData.is_used) {
            return res.status(400).json({ success: false, code: 'ALREADY_USED', message: 'QR code already used' });
        }

        if (appointmentData.status !== 'confirmed') {
            return res.status(400).json({ success: false, code: 'INVALID_STATUS', message: `Appointment is ${appointmentData.status}` });
        }

        // Update appointment status
        await connection.query(`
            UPDATE appointments
            SET
                is_used = 1,
                status = 'completed',
                verification_time = UTC_TIMESTAMP()
            WHERE id = ?
        `, [numericIds.appointmentId]);
        console.log(`[VERIFY] Updated appointment ${numericIds.appointmentId} to completed and is_used = 1`);

        // Log successful verification (if not already logged)
        const [existingLog] = await connection.query(
            `SELECT * FROM token_logs WHERE appointment_id = ? AND qr_token = ? AND verification_result = 'valid'`,
            [numericIds.appointmentId, token]
        );

        if (!existingLog.length) {
            await connection.query(`
                INSERT INTO token_logs (appointment_id, qr_token, verification_result, is_valid)
                VALUES (?, ?, 'valid', true)
            `, [numericIds.appointmentId, token]);
            console.log(`[VERIFY] Logged successful verification for appointment ${numericIds.appointmentId}`);
        } else {
            console.log(`[VERIFY] Successful verification already logged for appointment ${numericIds.appointmentId}`);
        }

        await connection.commit();

        const verificationTime = Date.now() - startTime;
        console.log(`[VERIFY] Appointment ${numericIds.appointmentId} verified successfully in ${verificationTime}ms`);
        return res.json({
            success: true,
            data: {
                appointmentId: numericIds.appointmentId,
                patientId: numericIds.patientId,
                doctorId: numericIds.doctorId
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('[VERIFY] Verification failure:', error);
        const code = error.code || 'SERVER_ERROR';
        const message = error.message || 'Verification failed due to a server error';
        return res.status(500).json({ success: false, code, message });

    } finally {
        connection.release();
    }
};

const getDoctorFilter = async (user, connection) => {
    if (user.role === 'doctor') {
        const [doctor] = await connection.query(
            'SELECT id FROM doctors WHERE user_id = ?', 
            [user.id]
        );
        
        if (!doctor.length) throw new Error('Doctor profile not found');
        return { clause: 'AND a.doctor_id = ?', value: doctor[0].id };
    }
    return { clause: '', value: null };
};

// Updated getPendingAppointments
export const getPendingAppointments = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const filter = await getDoctorFilter(req.user, connection);
        
        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.appointment_date AS date,
                a.appointment_time AS time,
                a.reason,
                u.fullname AS patientName,
                d.user_id AS doctor_user_id
            FROM appointments a
            JOIN users u ON a.patient_id = u.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.status = 'pending'
            ${filter.clause}
        `, filter.value ? [filter.value] : []);

        await connection.commit();
        res.json({ success: true, appointments });
        
    } catch (error) {
        await connection.rollback();
        handleError(res, error, 'pending appointments');
    } finally {
        connection.release();
    }
};

// Updated getConfirmedAppointments 
export const getConfirmedAppointments = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const filter = await getDoctorFilter(req.user, connection);
        
        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.appointment_date AS date,
                a.appointment_time AS time,
                a.reason,
                u.fullname AS patientName,
                a.status,
                d.user_id AS doctor_user_id
            FROM appointments a
            JOIN users u ON a.patient_id = u.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.status = 'confirmed'
            ${filter.clause}
        `, filter.value ? [filter.value] : []);

        await connection.commit();
        res.json({ success: true, appointments });
        
    } catch (error) {
        await connection.rollback();
        handleError(res, error, 'confirmed appointments');
    } finally {
        connection.release();
    }
};

// Updated getCompletedAppointments
export const getCompletedAppointments = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const filter = await getDoctorFilter(req.user, connection);
        
        const [appointments] = await connection.query(`
            SELECT 
                a.id,
                a.appointment_date AS date,
                a.appointment_time AS time,
                a.reason,
                u.fullname AS patientName,
                a.status,
                d.user_id AS doctor_user_id
            FROM appointments a
            JOIN users u ON a.patient_id = u.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.status = 'completed'
            ${filter.clause}
        `, filter.value ? [filter.value] : []);

        await connection.commit();
        res.json({ success: true, appointments });
        
    } catch (error) {
        await connection.rollback();
        handleError(res, error, 'completed appointments');
    } finally {
        connection.release();
    }
};

// Error handler utility
const handleError = (res, error, context) => {
    console.error(`Error fetching ${context}:`, error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ 
        success: false, 
        message: `Failed to fetch ${context}: ${error.message}` 
    });
};






export const getAppointmentDetails = async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid appointment ID" 
        });
      }
  
      const [results] = await pool.query(
        `SELECT a.*,
          du.fullname AS doctor_name,  // Corrected to use du alias
          u.fullname AS patient_name,
          d.specialization
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users du ON d.user_id = du.id  // Doctor's user details
         JOIN users u ON a.patient_id = u.id // Patient's user details
         WHERE a.id = ?`,
        [appointmentId]
      );
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found"
        });
      }
  
      const appointment = {
        ...results[0],
        date: moment(results[0].date).format("YYYY-MM-DD"),
        time: results[0].time.slice(0, 5) // HH:mm format
      };
  
      res.json({ success: true, appointment });
  
    } catch (error) {
      console.error("Appointment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch appointment details"
      });
    }
  };

  export const getPatientAppointments = async (req, res) => {
    try {
        // Get patient ID directly from users table
        const userId = req.user.id;

        const [appointments] = await pool.query(`
            SELECT 
                a.id,
                a.appointment_date AS date,
                a.appointment_time AS time,
                a.reason,
                a.status,
                a.notes,
                u.fullname AS doctor_name,
                d.specialization
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = ?  -- Direct user ID match
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `, [userId]);

        const formattedAppointments = appointments.map(appointment => ({
            ...appointment,
            date: moment(appointment.date).format("YYYY-MM-DD"),
            time: appointment.time.slice(0, 5)
        }));

        res.json({ 
            success: true, 
            appointments: formattedAppointments 
        });

    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch appointments" 
        });
    }
};