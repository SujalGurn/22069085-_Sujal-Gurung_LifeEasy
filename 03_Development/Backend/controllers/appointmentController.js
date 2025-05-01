import { pool } from "../config/db.js";
import crypto from "crypto";
import moment from "moment";
import { confirmAppointmentService } from "../services/appointmentService.js";
import { sendAppointmentConfirmation } from "../services/notificationService.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const createAppointment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { doctor_id, date, time, reason, notes } = req.body;
        const patient_id = req.user.id;

        if (!moment(date, 'YYYY-MM-DD').isValid()) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format (YYYY-MM-DD required)",
                receivedDate: date
            });
        }

        if (!moment(time, 'HH:mm:ss').isValid()) {
            return res.status(400).json({
                success: false,
                message: "Invalid time format (HH:mm:ss required)",
                errors: [`Received time: ${time}`]
            });
        }

        if (!doctor_id || !patient_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                errors: ['Missing required fields']
            });
        }
        if (!moment(time, 'HH:mm:ss', true).isValid()) {
            return res.status(400).json({
              success: false,
              message: "Time must be in HH:mm:ss format",
              receivedTime: time,
              example: "14:30:00"
            });
          }

        await connection.beginTransaction();

        const [doctor] = await connection.query('SELECT id FROM doctors WHERE id = ?', [doctor_id]);
        if (!doctor.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const [dayResult] = await connection.query(`SELECT DAYNAME(STR_TO_DATE(?, '%Y-%m-%d')) as day_of_week`, [date]);
        const dayOfWeek = dayResult[0]?.day_of_week;

        if (!dayOfWeek) {
            return res.status(400).json({
                success: false,
                message: "Could not determine day of week from date",
                receivedDate: date
            });
        }


        const appointmentMoment = moment.tz(
            `${date} ${time}`,
            'YYYY-MM-DD HH:mm:ss',
            'Asia/Kathmandu'
          );
          
          if (!appointmentMoment.isValid()) {
            return res.status(400).json({
              success: false,
              message: "Invalid date-time combination",
              debug: {
                input: `${date} ${time}`,
                isoString: appointmentMoment.toISOString(),
                validationErrors: appointmentMoment.parsingFlags()
              }
            });
          }

        // Time Zone Debugging
        console.log("Availability check:", { doctor_id, dayOfWeek, time });

        const [availability] = await connection.query(`
        SELECT id
        FROM doctor_availability
        WHERE doctor_id = ?
        AND day_of_week = ?
        AND ? BETWEEN start_time AND end_time
        AND is_available = 1
        LIMIT 1
        `, [doctor_id, dayOfWeek, time]);

        if (availability.length === 0) {
            const [dayExists] = await connection.query(`
                SELECT 1
                FROM doctor_availability
                WHERE doctor_id = ?
                AND day_of_week = ?
            `, [doctor_id, dayOfWeek]);
    
            if (dayExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Doctor is not available on this day."
                });
            }
        }

        await connection.query(`UPDATE doctor_availability SET is_available = 1 WHERE id = ?`, [availability[0].id]);
        const tempExpiration = moment().add(2, 'hours').format('YYYY-MM-DD HH:mm:ss');

        // Capture the insert result
const [result] = await connection.query(
    `INSERT INTO appointments (
        patient_id, 
        doctor_id, 
        appointment_date, 
        appointment_time, 
        reason, 
        notes, 
        status,
        expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [patient_id, doctor_id, date, time, reason, notes, 'pending', tempExpiration]
);

        const tempToken = `TEMP-${moment().format('YYMMDDHHmmss')}`;

        await connection.commit();

        return res.status(201).json({ success: true, appointmentId: result.insertId, token: tempToken });

    } catch (error) {
        await connection.rollback();
        console.error("Appointment Error:", { error: error.message, requestBody: req.body, stack: error.stack });
        return res.status(500).json({ success: false, message: "Internal server error", errorCode: "APPOINTMENT_CREATION_FAILED" });
    } finally {
        connection.release();
    }
};

export const confirmAppointmentHandler = async (req, res) => {
    const maxRetries = 3;
    let retries = 0;
    while (retries < maxRetries) {
        const connection = await pool.getConnection();
        try {
            const appointmentId = req.params.id;

            
            await connection.beginTransaction();

            const [appointment] = await connection.query(
                "SELECT * FROM appointments WHERE id = ? FOR UPDATE",
                [req.params.id]
            );

   
            const { displayToken, qrImageUrl } = await confirmAppointmentService(appointmentId, connection);

            if (!appointment.length) {
                return res.status(404).json({ success: false, message: "Appointment not found" });
            }

            if (appointment[0].status === 'canceled') {
                return res.status(400).json({ success: false, message: "Cannot confirm canceled appointment" });
            }

            if (appointment[0].status === 'confirmed') {
                return res.status(400).json({ success: false, message: "Appointment already confirmed" });
            }

            // const token = await confirmAppointmentService(appointmentId, connection);

            await connection.query(
                "INSERT INTO token_logs (appointment_id, token_number) VALUES (?, ?)",
                [appointmentId, displayToken]
            );


            const [confirmedAppointment] = await connection.query(
                `SELECT a.*, 
                u.email AS patient_email,
                u.fullname AS patient_name,
                u2.fullname AS doctor_name
                FROM appointments a
                JOIN users u ON a.patient_id = u.id
                JOIN doctors d ON a.doctor_id = d.id
                JOIN users u2 ON d.user_id = u2.id
                WHERE a.id = ?`,
                [appointmentId]
            );
            console.log("Confirmed appointment details:", confirmedAppointment);

            // Send email with QR code
            await sendAppointmentConfirmation(confirmedAppointment[0], qrImageUrl);
            await connection.commit();
            const [updatedAppointment] = await connection.query(
                `SELECT qr_token, status 
                 FROM appointments 
                 WHERE id = ?`,
                [appointmentId]
            );
            
            console.log('Final Confirmation Verification:', {
                qrToken: updatedAppointment[0].qr_token,
                status: updatedAppointment[0].status,
                length: updatedAppointment[0].qr_token?.length
            });

            try {
                // await sendAppointmentConfirmation(confirmedAppointment[0]);
            } catch (notifError) {
                console.error("Notification failed:", notifError);
            }

            // await sendAppointmentConfirmation(confirmedAppointment[0]);

            return res.json({ 
                success: true, 
                message: "Appointment confirmed successfully", 
                token: displayToken,
                qrImageUrl
            });
        } catch (error) {
            await connection.rollback();
            if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retries < maxRetries) {
                retries++;
                console.warn(`Retrying (${retries}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.error("Confirmation error:", error);
                return res.status(500).json({ 
                    success: false, 
                    message: "Failed to confirm appointment",
                    error: error.message 
                });
            }
        } finally {
            connection.release();
        }
    }
    return res.status(500).json({ success: false, message: "Max retries exceeded", error: "Max retries exceeded" });
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




const errorMessages = {
    TokenExpiredError: 'QR code has expired',
    JsonWebTokenError: 'Invalid QR code',
    NotBeforeError: 'QR code not yet valid'
};
export const verifyAppointment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verify with UTC timestamps
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            clockTimestamp: Math.floor(Date.now() / 1000)
        });

        // Debug logs
        console.log('JWT Expiry:', new Date(decoded.exp * 1000).toISOString());

        const [appointment] = await connection.query(`
            SELECT 
                expires_at,
                UNIX_TIMESTAMP(expires_at) AS expires_utc,
                UNIX_TIMESTAMP(UTC_TIMESTAMP()) AS current_utc
            FROM appointments
            WHERE id = ? 
            AND qr_token = ?
            AND status = 'confirmed'
            AND is_used = 0
            AND expires_at > UTC_TIMESTAMP()
            FOR UPDATE
        `, [decoded.appointmentId, token]);

        console.log('DB Expiry:', appointment[0]?.expires_at)

        if (!appointment.length) {
            await connection.rollback();
            return res.status(401).json({
                success: false,
                code: 'NO_RECORD',
                message: "Invalid or expired appointment"
            });
        }

        // 3. Direct UTC Epoch Comparison
        const { expires_utc, current_utc } = appointment[0];
        if (expires_utc <= current_utc) {
            await connection.rollback();
            return res.status(401).json({
                success: false,
                code: 'EXPIRED',
                message: "QR code expired"
            });
        }

        // 4. Mark as used
        await connection.query(`
            UPDATE appointments 
            SET is_used = 1, 
                status = 'completed'
            WHERE id = ?
        `, [decoded.appointmentId]);

        await connection.commit();

        return res.json({
            success: true,
            code: 'VERIFIED',
            appointmentId: decoded.appointmentId
        });

    } catch (error) {
        await connection.rollback();
        return res.status(401).json({
            success: false,
            code: 'VERIFICATION_FAILED',
            message: error.message
        });
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