// controllers/statsController.js
import { pool } from "../config/db.js";

export const getAdminStats = async (req, res) => {
  try {
    // Get total appointments
    const [appointments] = await pool.query(
      `SELECT COUNT(*) AS total FROM appointments`
    );
    
    // Get total patients (users with patient role)
    const [patients] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'patient'`
    );

    // Get total doctors
    const [doctors] = await pool.query(
      `SELECT COUNT(*) AS total FROM doctors`
    );

    // Get total availability slots
    const [availability] = await pool.query(
      `SELECT COUNT(*) AS total FROM doctor_availability`
    );

    res.json({
      success: true,
      stats: {
        totalAppointments: appointments[0].total,
        totalPatients: patients[0].total,
        totalDoctors: doctors[0].total,
        totalAvailability: availability[0].total
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics' 
    });
  }
};