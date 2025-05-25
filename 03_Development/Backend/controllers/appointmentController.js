import { pool } from "../config/db.js";
import crypto from "crypto";
import moment from "moment";
import { confirmAppointmentService } from "../services/appointmentService.js";
import { sendAppointmentConfirmation } from "../services/notificationService.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { sendPaymentReceipt } from '../services/notificationService.js'; // Backend path
import axios from 'axios'; 

dotenv.config();


moment.tz.setDefault('Asia/Kathmandu');


const esewaConfig = {
    verifyUrl: 'https://rc-epay.esewa.com.np/api/epay/transaction/status',
    productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST'
};




export const getPaymentByTransaction = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const transactionUuid = req.params.transactionId;
        const [payment] = await connection.query(
            'SELECT * FROM payments WHERE transaction_uuid = ?',
            [transactionUuid]
        );

        if (!payment.length) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.json({ success: true, payment: payment[0] });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment' });
    } finally {
        connection.release();
    }
};

export const createAppointment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { doctor_id, date, time, reason, notes } = req.body;
        const patient_id = req.user.id;

        if (!moment(date, 'YYYY-MM-DD', true).isValid() || !moment(time, 'HH:mm:ss', true).isValid()) {
            return res.status(400).json({ success: false, message: 'Invalid date or time format' });
        }

        await connection.beginTransaction();

        const [doctor] = await connection.query('SELECT id, consultation_fee FROM doctors WHERE id = ?', [doctor_id]);
        if (!doctor.length) return res.status(404).json({ success: false, message: 'Doctor not found' });

        const appointmentDate = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Kathmandu');
        const [availability] = await connection.query(
            'SELECT id FROM doctor_availability WHERE doctor_id = ? AND day_of_week = ? AND ? BETWEEN start_time AND end_time AND is_available = 1',
            [doctor_id, appointmentDate.format('dddd'), time]
        );
        if (!availability.length) return res.status(400).json({ success: false, message: 'Doctor not available' });

        const tempExpiration = moment().tz('Asia/Kathmandu').add(2, 'hours').utc().format('YYYY-MM-DD HH:mm:ss');
        const tempQrToken = `pending-${uuidv4()}`;
        const [result] = await connection.query(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, notes, status, expires_at, qr_token, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [patient_id, doctor_id, date, time, reason, notes || '', 'pending', tempExpiration, tempQrToken, 'unpaid']
        );
        const appointmentId = result.insertId;
        const amount = doctor[0].consultation_fee;
        const transactionUuid = `APPT-${appointmentId}-${Date.now()}`;

        await connection.query(
            'INSERT INTO payments (appointment_id, patient_id, transaction_uuid, amount, status) VALUES (?, ?, ?, ?, ?)',
            [appointmentId, patient_id, transactionUuid, amount, 'pending']
        );

        if (!process.env.ESEWA_SECRET_KEY) throw new Error('ESEWA_SECRET_KEY is not defined');
        const paymentData = {
            amount: amount.toString(),
            tax_amount: '0',
            total_amount: amount.toString(),
            transaction_uuid: transactionUuid,
            product_code: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
            product_service_charge: '0',
            product_delivery_charge: '0',
            success_url: `${process.env.FRONTEND_URL}/payment-success`,
            failure_url: `${process.env.FRONTEND_URL}/payment-failure`,
            callback_url: `${process.env.BACKEND_URL}/api/appointments/esewa-callback`,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
        };

        console.log('Payment request data:', paymentData);
        const dataToSign = `total_amount=${paymentData.total_amount},transaction_uuid=${paymentData.transaction_uuid},product_code=${paymentData.product_code}`;
        paymentData.signature = crypto.createHmac('sha256', process.env.ESEWA_SECRET_KEY).update(dataToSign).digest('base64');

        await connection.commit();
        res.json({ success: true, appointmentId, paymentData, paymentUrl: process.env.ESEWA_PAYMENT_URL });
    } catch (error) {
        await connection.rollback();
        console.error("Appointment Error:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

export const esewaCallback = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        console.log(' Received eSewa callback:', JSON.stringify(req.body, null, 2));

        if (!req.body.data) {
            throw new Error('Missing data parameter in callback');
        }

        const decodedData = JSON.parse(Buffer.from(req.body.data, 'base64').toString());
        console.log(' Decoded eSewa data:', decodedData);

        const { transaction_uuid, status, total_amount, transaction_code: ref_id } = decodedData;

        if (status !== 'COMPLETE') {
            throw new Error(`Invalid payment status: ${status}`);
        }

        // Verify payment with eSewa
        const verifyUrl = `${esewaConfig.verifyUrl}?product_code=${esewaConfig.productCode}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
        console.log(' Verification URL:', verifyUrl);
        
        let verificationResponse;
        try {
            verificationResponse = await axios.get(verifyUrl);
            console.log(' eSewa verification response:', verificationResponse.data);
        } catch (verifyError) {
            console.error(' eSewa verification failed:', verifyError.message, verifyError.response?.data);
            throw new Error(`Verification failed: ${verifyError.message}`);
        }

        if (verificationResponse.data.status !== 'COMPLETE' || verificationResponse.data.ref_id !== ref_id) {
            throw new Error(`Payment verification failed: ${JSON.stringify(verificationResponse.data)}`);
        }

        await connection.beginTransaction();
        console.log(' Transaction started');

        const [payment] = await connection.query(
            `SELECT * FROM payments 
            WHERE transaction_uuid = ? 
            AND status = 'pending' 
            FOR UPDATE`,
            [transaction_uuid]
        );
        console.log(' Payment record:', payment);

        if (!payment.length) {
            throw new Error('Payment not found or already processed');
        }

        const paymentAmount = parseFloat(payment[0].amount).toFixed(2);
        const receivedAmount = parseFloat(total_amount).toFixed(2);
        console.log(` Amount check: Expected ${paymentAmount}, Received ${receivedAmount}`);
        if (paymentAmount !== receivedAmount) {
            throw new Error(`Amount mismatch: Expected ${paymentAmount}, Received ${receivedAmount}`);
        }

        const [paymentUpdate] = await connection.query(
            `UPDATE payments SET 
                status = 'completed', 
                ref_id = ?,
                updated_at = UTC_TIMESTAMP(),
                verified_at = UTC_TIMESTAMP()
            WHERE transaction_uuid = ?`,
            [ref_id, transaction_uuid]
        );
        console.log(`Payment update affected rows: ${paymentUpdate.affectedRows}`);

        if (paymentUpdate.affectedRows === 0) {
            throw new Error('Failed to update payment record');
        }

        const [appointmentUpdate] = await connection.query(
            `UPDATE appointments SET 
                payment_status = 'paid',
                payment_verified = 1,
                updated_at = UTC_TIMESTAMP()
            WHERE id = ?`,
            [payment[0].appointment_id]
        );
        console.log(`Appointment update affected rows: ${appointmentUpdate.affectedRows}`);

        if (appointmentUpdate.affectedRows === 0) {
            throw new Error(`Failed to update appointment ${payment[0].appointment_id}`);
        }

        const [updatedPayment] = await connection.query(
            'SELECT * FROM payments WHERE transaction_uuid = ?',
            [transaction_uuid]
        );
        const [updatedAppointment] = await connection.query(
            'SELECT * FROM appointments WHERE id = ?',
            [payment[0].appointment_id]
        );

        console.log('Post-update verification:');
        console.log('Payment:', updatedPayment[0]);
        console.log('Appointment:', updatedAppointment[0]);

        if (
            updatedPayment[0]?.status !== 'completed' ||
            updatedAppointment[0]?.payment_status !== 'paid' ||
            updatedAppointment[0]?.payment_verified !== 1 ||
            updatedAppointment[0]?.status !== 'pending'
        ) {
            throw new Error('Database updates not applied correctly');
        }

        await connection.commit();
        console.log('Transaction committed');

        try {
            await sendPaymentReceipt(updatedAppointment[0]);
            console.log('Receipt email sent');
        } catch (emailError) {
            console.error(' Email sending failed:', emailError.message);
        }

        const redirectUrl = `${process.env.FRONTEND_URL}/payment-success?appointmentId=${payment[0].appointment_id}&t=${Date.now()}`;
        console.log(' Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    } catch (error) {
        await connection.rollback();
        console.error(' Callback failed:', error.message, error.stack);
        const errorParam = encodeURIComponent(error.message.substring(0, 100));
        res.redirect(`${process.env.FRONTEND_URL}/payment-failure?error=${errorParam}`);
    } finally {
        connection.release();
        console.log(' Connection released');
    }
};


export const sendPaymentReceiptEndpoint = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const appointmentId = req.params.id;
        const [appointment] = await connection.query(
            'SELECT a.*, u.email AS patient_email, u.fullname AS patient_name, d.user_id, u2.fullname AS doctor_name FROM appointments a JOIN users u ON a.patient_id = u.id JOIN doctors d ON a.doctor_id = d.id JOIN users u2 ON d.user_id = u2.id WHERE a.id = ?',
            [appointmentId]
        );

        if (!appointment.length) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        await sendPaymentReceipt(appointment[0]);
        res.json({ success: true, message: 'Payment receipt sent successfully' });
    } catch (error) {
        console.error('Error sending payment receipt:', error);
        res.status(500).json({ success: false, message: 'Failed to send payment receipt' });
    } finally {
        connection.release();
    }
};


export const confirmAppointmentHandler = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const appointmentId = Number(req.params.id);
        if (isNaN(appointmentId)) return res.status(400).json({ success: false, message: 'Invalid appointment ID' });

        await connection.beginTransaction();
        const [appointment] = await connection.query('SELECT * FROM appointments WHERE id = ? FOR UPDATE', [appointmentId]);

        if (!appointment.length) return res.status(404).json({ success: false, message: 'Appointment not found' });
        if (appointment[0].status === 'cancelled') return res.status(400).json({ success: false, message: 'Cannot confirm cancelled appointment' });
        if (appointment[0].status === 'confirmed') return res.status(400).json({ success: false, message: 'Appointment already confirmed' });

        const { qrToken, displayToken, expiresAt, qrImageUrl } = await confirmAppointmentService(appointment[0], connection);

        await connection.query(
            'UPDATE appointments SET qr_token = ?, token_number = ?, expires_at = ?, status = ? WHERE id = ?',
            [qrToken, displayToken, expiresAt, 'confirmed', appointmentId]
        );
        await connection.query(
            'INSERT INTO token_logs (appointment_id, qr_token, verification_result) VALUES (?, ?, ?)',
            [appointmentId, qrToken, 'valid']
        );

        await connection.commit();
        const [confirmedAppointment] = await connection.query(
            'SELECT a.*, u.email AS patient_email, u.fullname AS patient_name, u2.fullname AS doctor_name FROM appointments a JOIN users u ON a.patient_id = u.id JOIN doctors d ON a.doctor_id = d.id JOIN users u2 ON d.user_id = u2.id WHERE a.id = ?',
            [appointmentId]
        );
        await sendAppointmentConfirmation(confirmedAppointment[0], qrImageUrl);

        res.json({ success: true, message: 'Appointment confirmed successfully', qrImageUrl });
    } catch (error) {
        await connection.rollback();
        console.error("Confirmation Error:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};


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
                d.about,
                COALESCE(d.profile_picture, NULL) AS profile_picture,
                d.consultation_fee
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.verification_status = 'approved'
            AND u.role = 'doctor'
        `);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        console.log('Fetched doctors:', rows);
        res.status(200).json({ success: true, doctors: rows });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
    }
};

export const getDoctorDetails = async (req, res) => {
    try {
        const [doctor] = await pool.query(`
            SELECT 
                d.id,
                u.fullname,
                u.email,
                u.contact,
                d.specialization,
                d.license_number,
                d.about,
                d.profile_picture,
                d.opd_schedule,
                d.consultation_fee
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = ? AND d.verification_status = 'approved'
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
                licenseNumber: doctor[0].license_number,
                about: doctor[0].about,
                profilePicture: doctor[0].profile_picture,
                opdSchedule: doctor[0].opd_schedule,
                consultationFee: doctor[0].consultation_fee
            }
        });
        console.log('Doctor data:', doctorResponse.data.doctor);
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
        const [appointment] = await connection.query('SELECT * FROM appointments WHERE id = ? FOR UPDATE', [appointmentId]);

        if (!appointment.length) return res.status(404).json({ success: false, message: 'Appointment not found' });
        if (appointment[0].status !== 'pending' && appointment[0].status !== 'confirmed') {
            return res.status(400).json({ success: false, message: 'Cannot reject a non-pending or non-confirmed appointment' });
        }

        if (appointment[0].payment_status === 'paid') {
            const [payment] = await connection.query('SELECT transaction_uuid, amount FROM payments WHERE appointment_id = ?', [appointmentId]);
            if (payment.length) {
                // Placeholder for eSewa refund API
                console.log(`Initiating refund for transaction ${payment[0].transaction_uuid}, amount: ${payment[0].amount}`);
                // Add eSewa refund logic here (requires integration)
            }
        }

        await connection.query('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', appointmentId]);
        await connection.commit();

        res.json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error("Rejection Error:", error);
        res.status(500).json({ success: false, message: 'Error rejecting appointment' });
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
    const connection = await pool.getConnection(); // Get a connection from the pool
    try {
        const appointmentId = req.params.id;
        const userId = req.user.id; // This assumes req.user is set by authMiddleware

        // Fetch appointment details along with patient and doctor names
        const [rows] = await connection.query(
            `SELECT a.*,
                    u.email AS patient_email,
                    u.fullname AS patient_name,
                    d.consultation_fee,
                    du.fullname AS doctor_name,
                    du.id as doctor_user_id -- Added to check if the requesting user is the doctor
             FROM appointments a
             JOIN users u ON a.patient_id = u.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users du ON d.user_id = du.id
             WHERE a.id = ?`,
            [appointmentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        let appointment = rows[0]; 

        // Authorization check: Only patient, doctor, or admin can view details
        if (appointment.patient_id !== userId && appointment.doctor_user_id !== userId && !req.user.role.includes('admin')) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to appointment details' });
        }

        // If payment status is unpaid, attempt to verify with eSewa
        if (appointment.payment_status === 'unpaid') {
            const [paymentRows] = await connection.query(
                `SELECT transaction_uuid, amount FROM payments WHERE appointment_id = ? AND status = 'pending'`,
                [appointmentId]
            );

            if (paymentRows.length > 0) {
                const payment = paymentRows[0];
                const total_amount = payment.amount;
                const transaction_uuid = payment.transaction_uuid;
                const product_code = process.env.ESEWA_PRODUCT_CODE; // 'EPAYTEST'

                // Construct message for signature as per eSewa documentation
                // Ensure the order of fields matches what eSewa expects for signature calculation
                const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
                const hash = crypto.createHmac('sha256', process.env.ESEWA_SECRET_KEY)
                                    .update(message)
                                    .digest('base64');

                // Correct eSewa status check URL
                // The doc you provided is: https://developer.esewa.com.np/pages/Token#statuscheck
                // which uses: https://uat.esewa.com.np/api/epay/transaction/status/
                // For live it would be https://epay.esewa.com.np/api/epay/transaction/status/
                // Let's use the UAT (test) URL directly.
      const verifyUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&transaction_uuid=${transaction_uuid}&total_amount=${total_amount}&signature=${encodeURIComponent(hash)}`;
                console.log(`[getAppointmentDetails] Attempting eSewa status verification for appointment ${appointmentId}. URL: ${verifyUrl}`);

                try {
                    const verificationResponse = await axios.get(verifyUrl, { timeout: 5000 }); // Add a timeout
                    const responseData = verificationResponse.data;
                    console.log(`[getAppointmentDetails] eSewa status check response for ${transaction_uuid}:`, responseData);

                    // Check if eSewa confirmed the payment and the transaction UUID matches
                    if (responseData && responseData.status === 'COMPLETE' && responseData.transaction_uuid === transaction_uuid) {
                        console.log(`[getAppointmentDetails] Payment ${transaction_uuid} confirmed by eSewa.`);

                        // Begin a transaction to update both tables atomically
                        await connection.beginTransaction();
                        try {
                            // Update payments table
                            await connection.query(
                                `UPDATE payments SET status = 'completed', ref_id = ?, verified_at = NOW(), verification_data = ? WHERE transaction_uuid = ?`,
                                [responseData.transaction_code || null, JSON.stringify(responseData), transaction_uuid]
                            );
                            console.log(`[getAppointmentDetails] Payment record for ${transaction_uuid} updated to completed.`);

                            // Update appointments table
                            await connection.query(
                                `UPDATE appointments SET payment_status = 'paid', payment_verified = 1, status = 'pending' WHERE id = ?`,
                                [appointmentId]
                            );
                            console.log(`[getAppointmentDetails] Appointment ${appointmentId} payment status updated to paid and confirmed.`);

                            await connection.commit(); // Commit the transaction

                            // Update the appointment object to reflect the new status before sending it in the response
                            appointment.payment_status = 'paid';
                            appointment.payment_verified = 1;
                            appointment.status = 'pending';
                            appointment.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' '); // Reflect update time

                        } catch (dbError) {
                            await connection.rollback(); // Rollback on error
                            console.error(`[getAppointmentDetails] Database transaction failed during status check update for ${transaction_uuid}:`, dbError);
                            // Do not return an error to the user if the payment was confirmed by eSewa,
                            // as the payment itself is done. Just log the internal DB issue.
                        }
                    } else {
                        console.log(`[getAppointmentDetails] eSewa status check: Payment not yet complete or mismatch for ${transaction_uuid}. Response:`, responseData);
                    }
                } catch (verifyError) {
                    console.error(`[getAppointmentDetails] Error during eSewa status verification for ${transaction_uuid}:`, verifyError.response?.data || verifyError.message);
                    // This error indicates an issue communicating with eSewa's status API.
                    // Frontend will retry, so no immediate action here.
                }
            } else {
                console.log(`[getAppointmentDetails] No pending payment record found for appointment ${appointmentId}.`);
            }
        }
        // --- END NEW PAYMENT VERIFICATION LOGIC ---

        res.status(200).json({ success: true, appointment });

    } catch (error) {
        console.error('[getAppointmentDetails] Server error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointment details due to server error.' });
    } finally {
        connection.release(); // Always release the connection
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



export const getDoctorPendingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const [doctor] = await pool.query(
      `SELECT id FROM doctors WHERE user_id = ?`,
      [userId]
    );
    if (!doctor.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorId = doctor[0].id;

    const [appointments] = await pool.query(`
      SELECT
        a.id,
        u.fullname AS patient,
        DATE_FORMAT(a.appointment_date, '%h:%i %p') AS time,
        a.reason AS condition
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = ? AND a.status = 'confirmed' AND a.appointment_date >= NOW()
      ORDER BY a.appointment_date ASC
      LIMIT 5
    `, [doctorId]);

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointments' 
    });
  }
};