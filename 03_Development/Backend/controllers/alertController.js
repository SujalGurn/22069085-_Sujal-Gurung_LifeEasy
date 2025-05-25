import { pool } from "../config/db.js";

export const getDoctorAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const [doctor] = await pool.query(
      `SELECT id FROM doctors WHERE user_id = ?`,
      [userId]
    );
    if (!doctor.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Mock alerts (replace with real data if an alerts table exists)
    const alerts = [
      { message: "Low stock of Painkillers" },
      { message: "Annual conference next week" },
      { message: "2 pending prescriptions" }
    ];

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Error fetching doctor alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alerts' 
    });
  }
};