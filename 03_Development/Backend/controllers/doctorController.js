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
                d.profile_picture,
                d.opd_schedule,
                d.consultation_fee
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        `, [doctorId]);

        if (!doctorData.length) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const [qualifications, experience] = await Promise.all([
            connection.query(`SELECT * FROM qualifications WHERE doctor_id = ?`, [doctorId]),
            connection.query(`SELECT * FROM experience WHERE doctor_id = ?`, [doctorId])
        ]);


              const doctorProfile = {
            id: doctorData[0].id,
            fullname: doctorData[0].fullname,
            contact: doctorData[0].contact,
            email: doctorData[0].email,
            specialization: doctorData[0].specialization,
            licenseNumber: doctorData[0].license_number,
            about: doctorData[0].about,
            profilePicture: doctorData[0].profile_picture, // example - Notice 'profilePicture' (camelCase)
            opdSchedule: doctorData[0].opd_schedule,
            consultationFee: doctorData[0].consultation_fee,
            qualifications: qualifications[0] || [],
            experience: experience[0] || []
        };

        
        res.status(200).json({
            success: true,
            doctor: { // This 'doctor' property now directly holds the transformed doctorProfile
                ...doctorProfile,
                profile_picture: doctorData[0].profile_picture, // <--- PROBLEM HERE!
                qualifications: qualifications[0] || [],
                experience: experience[0] || []
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
    console.log('Inside updateDoctorProfile controller');
    console.log('req.params.id (doctorProfileId):', req.params.id); // This is the doctor's profile ID
    console.log('req.user (authenticated user from token):', req.user); // Contains user.id and user.role
    console.log('req.body:', req.body); // Text fields
    console.log('req.file:', req.file); // Uploaded file info (if any)

    const doctorProfileId = parseInt(req.params.id, 10); // Ensure it's a number
    const authenticatedUserId = req.user.id; // User ID from the authenticated token

    const { fullname, specialization, contact, about } = req.body;
    let profilePicturePath = req.file ? `/uploads/profile_pictures/${req.file.filename}` : null;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get the user_id associated with this doctorProfileId
        const [doctorLink] = await connection.query('SELECT user_id FROM doctors WHERE id = ?', [doctorProfileId]);
        if (doctorLink.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }
        const associatedUserId = doctorLink[0].user_id;

        // **Authorization Check (redundant if `isSameDoctor` middleware is used, but good for robustness)**
        // This check is primarily handled by `isSameDoctor` middleware.
        // If `isSameDoctor` isn't applied to this route, this check is vital.
        if (authenticatedUserId !== associatedUserId && req.user.role !== 'admin') {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Access denied: You can only edit your own profile.' });
        }

        // 2. Update the `users` table for fullname and contact
        const userUpdateQuery = `
            UPDATE users
            SET fullname = COALESCE(?, fullname),
                contact = COALESCE(?, contact)
            WHERE id = ?
        `;
        await connection.query(userUpdateQuery, [fullname, contact, associatedUserId]);
        console.log(`Updated user ${associatedUserId} fullname and contact.`);

        // 3. Update the `doctors` table for specialization, about, profile_picture, consultation_fee
        const doctorUpdateFields = [];
        const doctorUpdateParams = [];

        if (specialization !== undefined) {
            doctorUpdateFields.push('specialization = ?');
            doctorUpdateParams.push(specialization);
        }
        if (about !== undefined) {
            doctorUpdateFields.push('about = ?');
            doctorUpdateParams.push(about);
        }
        if (req.body.consultation_fee !== undefined) {
            doctorUpdateFields.push('consultation_fee = ?');
            doctorUpdateParams.push(req.body.consultation_fee);
        }

        // Handle profile picture updates
        if (profilePicturePath) {
            // New file uploaded
            doctorUpdateFields.push('profile_picture = ?');
            doctorUpdateParams.push(profilePicturePath);
        } else if (req.body.profile_picture === '/default-avatar.png') {
            // Explicitly set to default (e.g., after clearing)
            doctorUpdateFields.push('profile_picture = ?');
            doctorUpdateParams.push('/default-avatar.png');
        }
        // If profilePicturePath is null and req.body.profile_picture is not '/default-avatar.png',
        // it means no new file was uploaded and the frontend sent back the existing path.
        // In this case, we don't need to update profile_picture, COALESCE handles it.

        if (doctorUpdateFields.length > 0) {
            const doctorUpdateQuery = `
                UPDATE doctors
                SET ${doctorUpdateFields.join(', ')}
                WHERE id = ?
            `;
            await connection.query(doctorUpdateQuery, [...doctorUpdateParams, doctorProfileId]);
            console.log(`Updated doctor profile ${doctorProfileId}.`);
        } else {
            console.log('No specific doctor fields to update.');
        }

        await connection.commit();

        // Fetch the combined updated profile (user and doctor table data)
        const [updatedDoctorRows] = await connection.query(`
            SELECT 
                d.id,
                u.fullname,
                u.contact,
                u.email,
                d.specialization,
                d.license_number,
                d.about,
                d.profile_picture,
                d.opd_schedule,
                d.consultation_fee
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        `, [doctorProfileId]);

        if (updatedDoctorRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Updated doctor profile not found after update.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            doctor: {
                id: updatedDoctorRows[0].id,
                fullname: updatedDoctorRows[0].fullname,
                contact: updatedDoctorRows[0].contact,
                email: updatedDoctorRows[0].email,
                specialization: updatedDoctorRows[0].specialization,
                licenseNumber: updatedDoctorRows[0].license_number,
                about: updatedDoctorRows[0].about,
                profile_picture: updatedDoctorRows[0].profile_picture,
                opdSchedule: updatedDoctorRows[0].opd_schedule,
                consultationFee: updatedDoctorRows[0].consultation_fee
            }
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error in updateDoctorProfile:', err);
        // More specific error messages for frontend
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'A duplicate entry was found for a unique field (e.g., contact).' });
        }
        return res.status(500).json({ success: false, message: 'Server error updating profile. Please check logs.' });
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

