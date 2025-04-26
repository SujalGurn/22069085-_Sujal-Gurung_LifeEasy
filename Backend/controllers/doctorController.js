// In your doctorController.js
import { getMedicalHistoryByPatientId, createMedicalHistory, updateMedicalHistory as updateMHModel } from '../models/MedicalHistory.js';
import { getPatientByUserId } from '../models/Patient.js'; // If you need to fetch patient details here
import { pool } from "../config/db.js";
import moment from "moment";

export const getPatientMedicalHistoryForDoctor = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await getMedicalHistoryByPatientId(patientId);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ success: false, message: 'Medical history not found for this patient' });
        }
    } catch (error) {
        console.error('Error fetching medical history for doctor:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const addMedicalHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const recordedByUserId = req.user.id;
        const newRecordData = { ...req.body, patient_id: patientId, recorded_by_user_id: recordedByUserId };

        if (req.file) {
            newRecordData.report_name = req.file.originalname;
            newRecordData.report_path = req.file.path; // Store the path to the saved file
        }

        const result = await createMedicalHistory(newRecordData);
        if (result.success) {
            return res.status(201).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error adding medical history:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateMedicalHistory = async (req, res) => {
    try {
        const { recordId } = req.params;
        const updatedData = { ...req.body };

        if (req.file) {
            updatedData.report_name = req.file.originalname;
            updatedData.report_path = req.file.path; // Store the path to the new file
        }

        const result = await updateMHModel(recordId, updatedData); // Use the renamed imported function
        return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        console.error('Error updating medical history:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
export const getDoctorIdByUserId = async (req, res) => {
    try {
      const [doctor] = await pool.query(
        `SELECT id FROM doctors WHERE user_id = ?`,
        [req.params.userId]
      );
      
      if (!doctor.length) return res.status(404).json({ error: "Doctor not found" });
      
      res.json({ doctorId: doctor[0].id });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };

  
  export const getDoctorProfile = async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const doctorId = parseInt(req.params.id, 10);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }
  
      const [doctorData] = await connection.query(`
        SELECT 
          d.id,
          u.fullname,
          u.contact,
          u.email,
          d.specialization,
          d.license_number,
          d.about,
          d.profile_picture
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ? 
        AND d.verification_status = 'approved'
      `, [doctorId]);
  
      if (!doctorData.length) {
        return res.status(404).json({ message: "Doctor not found" });
      }
  
      const [qualifications, experience] = await Promise.all([
        connection.query(`SELECT * FROM qualifications WHERE doctor_id = ?`, [doctorId]),
        connection.query(`SELECT * FROM experience WHERE doctor_id = ?`, [doctorId])
      ]);
  
      res.status(200).json({
        success: true,
        doctor: {
          ...doctorData[0],
          qualifications: qualifications[0],
          experience: experience[0]
        }
      });
  
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Server error" });
    } finally {
      connection.release();
    }
  };
  
  export const updateDoctorProfile = async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const doctorId = req.params.id;
      const { about } = req.body;
  
      await connection.query(`
        UPDATE doctors SET
          about = ?
        WHERE id = ?
      `, [about, doctorId]);
  
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Update failed' });
    } finally {
      connection.release();
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
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add qualification' 
        });
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
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add experience' 
        });
    } finally {
        connection.release();
    }
};


// doctorController.js
export const deleteQualification = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [result] = await connection.query(
      `DELETE FROM qualifications 
       WHERE id = ? AND doctor_id = ?`,
      [req.params.qualId, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Qualification not found" 
      });
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ 
      success: false,
      message: "Failed to delete qualification" 
    });
  } finally {
    connection.release();
  }
};

export const deleteExperience = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [result] = await connection.query(
      `DELETE FROM experience 
       WHERE id = ? AND doctor_id = ?`,
      [req.params.expId, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Experience not found" 
      });
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ 
      success: false,
      message: "Failed to delete experience" 
    });
  } finally {
    connection.release();
  }
};

