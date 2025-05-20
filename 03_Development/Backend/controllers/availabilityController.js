import { pool } from '../config/db.js';
import moment from 'moment';

export const addAvailability = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [doctor] = await connection.query(
            "SELECT id FROM doctors WHERE user_id = ?",
            [req.user.id]
        );

        if (!doctor.length) {
            return res.status(403).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const doctorId = doctor[0].id;
        const { days } = req.body;

        if (!days || !Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ success: false, message: "Days array is required and must not be empty" });
        }

        for (const day of days) {
            const { day_of_week, start_time, end_time } = day;

            // Validation check
            if (!day_of_week || !start_time || !end_time) {
                return res.status(400).json({ 
                    success: false, 
                    message: "All fields are required for each day" 
                });
            }

            // Format start_time and end_time using moment
            let formattedStartTime, formattedEndTime;
            try {
                formattedStartTime = moment(start_time, "HH:mm").format("HH:mm:ss");
                formattedEndTime = moment(end_time, "HH:mm").format("HH:mm:ss");
            } catch (e) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid time format" 
                });
            }

            // Check for existing availability for this day and time
            const [existing] = await connection.query(
                `SELECT id FROM doctor_availability 
                 WHERE doctor_id = ? AND day_of_week = ? AND start_time = ? AND end_time = ?`,
                [doctorId, day_of_week, formattedStartTime, formattedEndTime]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `${day_of_week} at ${formattedStartTime} already exists in your schedule`
                });
            }

            // Insert new availability into the database
            await connection.query(
                `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)`,
                [doctorId, day_of_week, formattedStartTime, formattedEndTime]
            );
        }

        res.status(201).json({
            success: true,
            message: "Availability added successfully"
        });

    } catch (error) {
        console.error("Add availability error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add availability",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

export const updateAvailability = async (req, res) => {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const { day_of_week, start_time, end_time } = req.body;

    try {
        await connection.query(
            `UPDATE doctor_availability SET day_of_week = ?, start_time = ?, end_time = ? WHERE id = ?`,
            [day_of_week, start_time, end_time, id]
        );

        res.json({ success: true, message: 'Availability updated successfully' });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ success: false, message: 'Failed to update availability' });
    } finally {
        connection.release();
    }
};

export const getDoctorAvailability = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [doctor] = await connection.query(
            "SELECT id FROM doctors WHERE user_id = ?",
            [req.user.id]
        );

        if (!doctor.length) {
            return res.status(403).json({ success: false, message: "Doctor profile not found" });
        }

        const [availability] = await connection.query(
            `SELECT id, day_of_week, 
            DATE_FORMAT(start_time, '%H:%i') AS start_time,
            DATE_FORMAT(end_time, '%H:%i') AS end_time
            FROM doctor_availability
            WHERE doctor_id = ?`,
            [doctor[0].id]
        );

        res.json({ success: true, availability });

    } catch (error) {
        console.error("Fetch availability error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch availability",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

export const deleteAvailability = async (req, res) => {
    const { availabilityId } = req.params.id;

    try {
        const [result] = await pool.query(
            `DELETE FROM doctor_availability
             WHERE id = ?`,
            [availabilityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: `Availability with ID ${availabilityId} not found` });
        }

        res.json({
            success: true,
            message: "Availability deleted successfully"
        });
    } catch (error) {
        console.error("Delete availability error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete availability",
            error: error.message
        });
    }
};

export const addQualification = async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const doctorId = req.params.id;
      const { qualification, institution, year } = req.body;
  
      await connection.beginTransaction();
  
      const [result] = await connection.query(
        `INSERT INTO qualifications 
         (doctor_id, qualification, institution, year)
         VALUES (?, ?, ?, ?)`,
        [doctorId, qualification, institution, year]
      );
  
      await connection.commit();
      res.status(201).json({ 
        success: true, 
        qualification: { id: result.insertId, ...req.body }
      });
  
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Failed to add qualification' });
    } finally {
      connection.release();
    }
  };
  
  export const addExperience = async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const doctorId = req.params.id;
      const { position, institute, duration } = req.body;
  
      await connection.beginTransaction();
  
      const [result] = await connection.query(
        `INSERT INTO experience 
         (doctor_id, position, institute, duration)
         VALUES (?, ?, ?, ?)`,
        [doctorId, position, institute, duration]
      );
  
      await connection.commit();
      res.status(201).json({ 
        success: true, 
        experience: { id: result.insertId, ...req.body }
      });
  
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ success: false, message: 'Failed to add experience' });
    } finally {
      connection.release();
    }
  };
