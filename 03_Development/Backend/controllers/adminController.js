import nodemailer from 'nodemailer';
import { pool } from '../config/db.js';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const baseURL = process.env.BASE_URL || 'http://localhost:5173/api';

export const getPendingVerifications = async (req, res) => {
  try {
    const [doctors] = await pool.query(`
      SELECT 
        d.id as doctor_id,
        u.fullname,
        u.email,
        d.license_number,
        d.specialization,
        d.certification_path,
        d.id_proof_path,
        d.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.verification_status = 'pending'
      ORDER BY d.created_at DESC
    `);

    if (!doctors.length) {
      return res.status(200).json({ 
        success: true, 
        doctors: [],
        message: "No pending verifications found"
      });
    }

    const processedDoctors = doctors.map(doc => ({
      ...doc,
      certification_path: `${baseURL}/uploads/kyc/${doc.certification_path.replace('kyc/', '')}`,
      id_proof_path: `${baseURL}/uploads/kyc/${doc.id_proof_path.replace('kyc/', '')}`
    }));

    res.json({ 
      success: true, 
      doctors: processedDoctors 
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

export const rejectDoctor = async (req, res) => {
  const { doctorId } = req.params;
  const { notes } = req.body;

  if (!notes || notes.trim() === "") {
    return res.status(400).json({ 
      success: false, 
      message: "Rejection notes are required" 
    });
  }

  if (!doctorId || isNaN(parseInt(doctorId))) { // Using native isNaN
    return res.status(400).json({ 
      success: false, 
      message: "Invalid doctor ID" 
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query(`
      UPDATE doctors 
      SET verification_status = 'rejected',
          verification_notes = ?,
          verification_date = NOW()
      WHERE id = ?
    `, [notes.trim(), doctorId]);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Doctor not found" 
      });
    }

    const [[doctor]] = await connection.query(`
      SELECT u.email 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [doctorId]);

    if (!doctor?.email) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Associated user not found" 
      });
    }

    try {
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
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    await connection.commit();
    res.json({ success: true, message: "Doctor rejected successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Rejection error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Rejection failed",
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const getRejectedDoctors = async (req, res) => {
  try {
    const [doctors] = await pool.query(`
      SELECT 
        d.id,
        d.license_number,
        d.specialization,
        d.certification_path,
        d.id_proof_path,
        d.verification_date,
        d.verification_notes,
        u.fullname,
        u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.verification_status = 'rejected'
    `);

    const processedDoctors = doctors.map(doc => ({
      id: doc.id,
      fullname: doc.fullname,
      email: doc.email,
      license_number: doc.license_number,
      specialization: doc.specialization,
      certification_path: `${baseURL}/uploads/kyc/${doc.certification_path.replace('kyc/', '')}`,
      id_proof_path: `${baseURL}/uploads/kyc/${doc.id_proof_path.replace('kyc/', '')}`,
      verification_date: doc.verification_date,
      verification_notes: doc.verification_notes
    }));

    res.status(200).json({
      success: true,
      doctors: processedDoctors
    });
  } catch (error) {
    console.error("Error fetching rejected doctors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rejected doctors"
    });
  }
};

export const deleteDoctor = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) { // Using native isNaN
    return res.status(400).json({ 
      success: false, 
      message: "Invalid doctor ID" 
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`
      DELETE FROM salary_payments 
      WHERE doctor_id = ?
    `, [id]);

    await connection.query(`
      DELETE FROM auto_salary 
      WHERE doctor_id = ?
    `, [id]);

    const [[doctor]] = await connection.query(`
      SELECT user_id 
      FROM doctors 
      WHERE id = ?
    `, [id]);

    if (!doctor) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Doctor not found" 
      });
    }

    const [deleteDoctorResult] = await connection.query(`
      DELETE FROM doctors 
      WHERE id = ?
    `, [id]);

    if (deleteDoctorResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Doctor not found" 
      });
    }

    const [deleteUserResult] = await connection.query(`
      DELETE FROM users 
      WHERE id = ?
    `, [doctor.user_id]);

    if (deleteUserResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Associated user not found" 
      });
    }

    await connection.commit();
    res.json({ success: true, message: "Doctor deleted successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Delete error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete doctor",
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

export const approveDoctor = async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  if (isNaN(doctorId)) { // Using native isNaN
    return res.status(400).json({ 
      success: false, 
      message: "Invalid doctor ID" 
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query(`
      UPDATE doctors 
      SET verification_status = 'approved',
          verification_date = NOW()
      WHERE id = ?
    `, [doctorId]);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Doctor not found" 
      });
    }

    const [[doctor]] = await connection.query(`
      SELECT u.email, u.fullname 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [doctorId]);

    if (!doctor) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Associated user not found" 
      });
    }

    try {
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
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    await connection.commit();
    res.json({ success: true, message: "Doctor approved successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Approval error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Approval failed",
      error: error.message 
    });
  } finally {
    connection.release();
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
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      'UPDATE users SET fullname = ?, email = ? WHERE id = (SELECT user_id FROM doctors WHERE id = ?)',
      [fullname, email, id]
    );

    await connection.query(
      'UPDATE doctors SET specialization = ?, license_number = ? WHERE id = ?',
      [specialization, license_number, id]
    );

    await connection.commit();
    res.status(200).json({
      success: true,
      message: "Doctor updated successfully"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating doctor:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: "Email or license number already exists" 
      });
    }
    
    res.status(500).json({ success: false, message: "Failed to update doctor" });
  } finally {
    connection.release();
  }
};