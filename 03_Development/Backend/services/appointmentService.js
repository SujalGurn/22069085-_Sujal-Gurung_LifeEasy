import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { schedule } from 'node-cron';
import QRCode from 'qrcode';
import moment from 'moment-timezone';
import dotenv from 'dotenv';

dotenv.config();
moment.tz.setDefault('Asia/Kathmandu');

const TOKEN_PREFIX = 'TKN';
const MAX_TOKEN_LENGTH = 512;
const TOKEN_EXPIRATION_BUFFER = { hours: 24 };
const APPOINTMENT_EXPIRATION_BUFFER = { hours: 1 };

const generateTokenNumber = async (doctorId, date, connection) => {
    const dateMoment = moment(date, 'YYYY-MM-DD', true);
    if (!dateMoment.isValid()) throw new Error(`Invalid date format: ${date}`);

    const dateStr = dateMoment.format('YYYYMMDD');
    const pattern = `${TOKEN_PREFIX}-${String(doctorId).padStart(3, '0')}-${dateStr}-%`;

    const [existing] = await connection.query(
        'SELECT MAX(token_number) AS last_token FROM appointments WHERE doctor_id = ? AND token_number LIKE ? FOR UPDATE',
        [doctorId, pattern]
    );

    const sequence = existing[0].last_token ? parseInt(existing[0].last_token.split('-').pop(), 10) + 1 : 1;
    return `${TOKEN_PREFIX}-${String(doctorId).padStart(3, '0')}-${dateStr}-${String(sequence).padStart(4, '0')}`;
};

const validateAppointmentIds = (appointment) => {
    const numericIds = {
        appointmentId: Number(appointment.id),
        doctorId: Number(appointment.doctor_id),
        patientId: Number(appointment.patient_id)
    };
    if (Object.values(numericIds).some(isNaN)) throw new Error('Invalid appointment IDs');
    return numericIds;
};

const calculateExpiration = (appointmentDateTime) => {
    const now = moment().tz('Asia/Kathmandu');
    const expirationFromNow = now.clone().add(24, 'hours');
    const appointmentExpiration = moment(appointmentDateTime).add(1, 'hour');
    return moment.max(expirationFromNow, appointmentExpiration).utc();
};

const generateSecureToken = (appointment) => {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');

    const rawDate = String(appointment.appointment_date);
    const rawTime = String(appointment.appointment_time);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || !/^\d{2}:\d{2}:\d{2}$/.test(rawTime)) {
        throw new Error(`Invalid date (${rawDate}) or time (${rawTime}) format`);
    }

    const appointmentDateTime = moment.tz(`${rawDate}T${rawTime}`, 'YYYY-MM-DDTHH:mm:ss', 'Asia/Kathmandu');
    if (!appointmentDateTime.isValid()) throw new Error(`Invalid datetime: ${rawDate} ${rawTime}`);

    const expiresAt = calculateExpiration(appointmentDateTime);
    return {
        qrToken: jwt.sign({ ...validateAppointmentIds(appointment), exp: expiresAt.unix() }, process.env.JWT_SECRET, { algorithm: 'HS256' }),
        expiresAt: expiresAt.format('YYYY-MM-DD HH:mm:ss')
    };
};

export const confirmAppointmentService = async (appointment, connection) => {
    try {
        if (!process.env.JWT_SECRET || !process.env.FRONTEND_URL) throw new Error("Missing .env variables");

        const [displayToken, { qrToken, expiresAt }] = await Promise.all([
            generateTokenNumber(appointment.doctor_id, appointment.appointment_date, connection),
            generateSecureToken(appointment)
        ]);

        if (qrToken.length > MAX_TOKEN_LENGTH) throw new Error(`Token exceeds ${MAX_TOKEN_LENGTH} characters`);

        const verificationUrl = new URL('/verify-appointment', process.env.FRONTEND_URL);
        verificationUrl.searchParams.set('token', encodeURIComponent(qrToken));
        const qrImageUrl = await QRCode.toDataURL(verificationUrl.toString(), { errorCorrectionLevel: 'H', margin: 2, scale: 8 });

        await connection.query('UPDATE appointments SET qr_token = ?, token_number = ?, expires_at = ? WHERE id = ?', [qrToken, displayToken, expiresAt, appointment.id]);
        await connection.query('INSERT INTO token_logs (appointment_id, qr_token, verification_result) VALUES (?, ?, ?)', [appointment.id, qrToken, 'valid']);

        return { qrToken, displayToken, expiresAt, qrImageUrl };
    } catch (error) {
        console.error("Confirmation Service Error:", error);
        throw error;
    }
};

const cleanupExpiredTokens = async () => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(
            'UPDATE appointments SET status = ? WHERE expires_at < UTC_TIMESTAMP() AND status = ? AND is_used = ?',
            ['expired', 'confirmed', 0]
        );
        if (result.affectedRows > 0) console.log(`Marked ${result.affectedRows} expired appointments`);
    } catch (error) {
        console.error('Cleanup Error:', error);
    } finally {
        connection.release();
    }
};

schedule('0 0 * * *', cleanupExpiredTokens);

export default { generateTokenNumber, confirmAppointmentService };