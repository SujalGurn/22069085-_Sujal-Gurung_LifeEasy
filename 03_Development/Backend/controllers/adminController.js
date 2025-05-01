
import nodemailer from 'nodemailer';
import { pool } from '../config/db.js';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const getPendingVerifications = async (req, res) => {
    try {
        const [doctors] = await pool.query(`
             SELECT 
                d.id AS doctor_id,
                u.fullname,
                u.email,
                d.license_number AS licenseNumber,
                d.specialization,
                d.certification_path AS certification,
                d.id_proof_path AS idProof,
                d.verification_status AS status
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.verification_status = 'pending'
        `);

        console.log("Doctors from database:", doctors);

        if (!doctors.length) {
            console.log("No pending verifications found.");
            return res.status(404).json({
                success: false,
                message: "No pending verifications found"
            });
        }
        res.set('Cache-Control', 'no-store');

        res.json({
            success: true,
            doctors: doctors.map(doc => ({
                ...doc,
                // certification_path: `<span class="math-inline">\{process\.env\.BASE\_URL\}/</span>{doc.certification_path.replace(/\\/g, "/")}`, // Normalize paths
                // id_proof_path: `<span class="math-inline">\{process\.env\.BASE\_URL\}/</span>{doc.id_proof_path.replace(/\\/g, "/")}`      // Normalize paths
                // Remove BASE_URL concatenation and use proper path formatting
                certification_path: new URL(doc.certification_path, process.env.BASE_URL).href,
                id_proof_path: new URL(doc.id_proof_path, process.env.BASE_URL).href
                // id_proof_path: `${process.env.BASE_URL}/${doc.id_proof_path}`
            }))
        });

    } catch (error) {
        console.error("Get pending error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch verifications",
            error: error.message
        });
    }
};
export const rejectDoctor = async (req, res) => {
    // const { doctorId } = req.params;
    const { notes } = req.body;

    if (!notes || notes.trim() === "") {
        return res.status(400).json({ 
            success: false, 
            message: "Rejection notes are required" 
        });
    }

    try {
        const doctorId = parseInt(req.params.doctorId);
        await pool.query('START TRANSACTION');

        const [updateResult] = await pool.query(`
           UPDATE doctors 
   SET verification_status = 'rejected'
   WHERE id = ?
        `, [doctorId]);

        if (updateResult.affectedRows === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ 
                success: false, 
                message: "Doctor not found" 
            });
        }

        const [[doctor]] = await pool.query(`
            SELECT u.email 
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        `, [doctorId]);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: doctor.email,
            subject: 'Doctor Registration Update',
            html: `
                <h2>Registration Status: Rejected</h2>
                <p>Your doctor registration has been reviewed.</p>
                <p><strong>Reason:</strong> ${notes}</p>
                <p>Please correct the issues and resubmit your application.</p>
            `
        });

        await pool.query('COMMIT');
        res.json({ success: true, message: "Doctor rejected successfully" });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Rejection error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Rejection failed",
            error: error.message 
        });
    }
};

export const approveDoctor = async (req, res) => {
    // const { doctorId } = req.params;

    try {
        const doctorId = parseInt(req.params.doctorId); 
        await pool.query('START TRANSACTION');
        if (isNaN(doctorId)) {
            return res.status(400).json({ 
              success: false, 
              message: "Invalid doctor ID" 
            });
          }

        const [updateResult] = await pool.query(`
            UPDATE doctors 
            SET verification_status = 'approved',
                verification_date = NOW()
            WHERE id = ?
        `, [doctorId]);

        if (updateResult.affectedRows === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ 
                success: false, 
                message: "Doctor not found" 
            });
        }

        const [[doctor]] = await pool.query(`
            SELECT u.email, u.fullname 
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = ?
        `, [doctorId]);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: doctor.email,
            subject: 'Doctor Account Approved',
            html: `
                <h2>Congratulations ${doctor.fullname}!</h2>
                <p>Your doctor account has been approved.</p>
                <p>You can now login to the system using your credentials.</p>
                <p><a href="${process.env.FRONTEND_URL}/login">Click here to login</a></p>
            `
        });

        await pool.query('COMMIT');
        res.json({ success: true, message: "Doctor approved successfully" });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Approval error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Approval failed",
            error: error.message 
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, email, role, created_at FROM users'
        );
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};




export const getPatients = async (req, res) => {
  try {
    const [patients] = await pool.query(
      "SELECT id, fullname, username, dateofbirth, contact, email, created_at FROM users WHERE role = 'user'"
    );
    res.json({ success: true, patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ success: false, message: "Failed to fetch patients" });
  }
};
export const updatePatient = async (req, res) => {
    const { id } = req.params;
    const { fullname, contact, email } = req.body;
  
    try {
      // Check if email exists for other users
      const [existing] = await pool.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Email already in use by another user" 
        });
      }
  
      // Update only allowed fields
      const [result] = await pool.query(
        `UPDATE users 
         SET fullname = ?, contact = ?, email = ?
         WHERE id = ?`,
        [fullname, contact, email, id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Patient not found" 
        });
      }
  
      res.json({ 
        success: true, 
        message: "Patient updated successfully" 
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Database update failed",
        error: error.message 
      });
    }
  };

export const getApprovedDoctors = async (req, res) => {
    try {
      const [doctors] = await pool.query(`
        SELECT d.*, u.fullname, u.email 
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE verification_status = 'approved'
      `);
  
      res.status(200).json({
        success: true,
        doctors: doctors.map(doctor => ({
          id: doctor.id,
          fullname: doctor.fullname,
          email: doctor.email,
          license_number: doctor.license_number,
          specialization: doctor.specialization,
          certification_path: doctor.certification_path,
          id_proof_path: doctor.id_proof_path,
          verification_date: doctor.verification_date
        }))
      });
    } catch (error) {
      console.error("Error fetching approved doctors:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch approved doctors"
      });
    }
  };


  export const getSingleDoctor = async (req, res) => {
    try {
      const { id } = req.params;
      const [doctor] = await pool.query(`
        SELECT d.*, u.fullname, u.email 
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
      `, [id]);
  
      if (doctor.length === 0) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
      }
  
      res.status(200).json({
        success: true,
        doctor: {
          id: doctor[0].id,
          fullname: doctor[0].fullname,
          email: doctor[0].email,
          license_number: doctor[0].license_number,
          specialization: doctor[0].specialization
        }
      });
    } catch (error) {
      console.error("Error fetching doctor:", error);
      res.status(500).json({ success: false, message: "Failed to fetch doctor" });
    }
  };
  
  export const updateDoctor = async (req, res) => {
    const { id } = req.params;
    const { fullname, email, specialization, license_number } = req.body;
  
    try {
      await pool.query('START TRANSACTION');
  
      // Update users table
      await pool.query(
        'UPDATE users SET fullname = ?, email = ? WHERE id = (SELECT user_id FROM doctors WHERE id = ?)',
        [fullname, email, id]
      );
  
      // Update doctors table
      await pool.query(
        'UPDATE doctors SET specialization = ?, license_number = ? WHERE id = ?',
        [specialization, license_number, id]
      );
  
      await pool.query('COMMIT');
  
      res.status(200).json({
        success: true,
        message: "Doctor updated successfully"
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error("Error updating doctor:", error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          message: "Email or license number already exists" 
        });
      }
      
      res.status(500).json({ success: false, message: "Failed to update doctor" });
    }
  };