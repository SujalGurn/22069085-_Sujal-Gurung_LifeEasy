import { pool } from "../config/db.js";

export const getAdminStats = async (req, res) => {
  try {
    const [appointments] = await pool.query(
      `SELECT COUNT(*) AS total FROM appointments`
    );
    const [patients] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'user'`
    );
    const [doctors] = await pool.query(
      `SELECT COUNT(*) AS total FROM doctors`
    );
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

export const getAppointmentTrends = async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT
        DATE_FORMAT(appointment_date, '%Y-%m') AS month,
        COUNT(*) AS appointments
      FROM appointments
      WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    const allMonths = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toISOString().slice(0, 7);
    });

    const filledData = allMonths.map(month => {
      const found = results.find(r => r.month === month);
      return found || { month, appointments: 0 };
    });

    res.status(200).json({
      success: true,
      trend: filledData
    });
  } catch (error) {
    console.error('Appointment trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment trends'
    });
  }
};

export const getDoctorStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format - must be numeric' });
    }

    const [doctor] = await pool.query(
      `SELECT id, total_income FROM doctors WHERE user_id = ?`,
      [parseInt(userId)]
    );
    if (!doctor.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorId = doctor[0].id;
    const totalIncome = doctor[0].total_income || 0;

    const [patients] = await pool.query(
      `SELECT COUNT(DISTINCT patient_id) AS total
       FROM appointments
       WHERE doctor_id = ?`,
      [doctorId]
    );
    const [upcoming] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM appointments
       WHERE doctor_id = ? AND appointment_date >= NOW() AND status = 'pending'`,
      [doctorId]
    );
    const [completed] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM appointments
       WHERE doctor_id = ? AND status = 'completed'
       AND appointment_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`,
      [doctorId]
    );

    res.json({
      success: true,
      stats: {
        totalPatients: patients[0].total || 0,
        upcomingAppointments: upcoming[0].total || 0,
        monthlyEarnings: totalIncome, // Use total_income from doctors table
        completedAppointments: completed[0].total || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch doctor statistics: ${error.message}` 
    });
  }
};

export const getDoctorEarningsTrend = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format - must be numeric' });
    }

    const [doctor] = await pool.query(
      `SELECT id FROM doctors WHERE user_id = ?`,
      [parseInt(userId)]
    );
    if (!doctor.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorId = doctor[0].id;

    const [results] = await pool.query(`
      SELECT
        DATE_FORMAT(p.created_at, '%Y-%m') AS month,
        SUM(p.amount) AS earnings
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE a.doctor_id = ? AND p.status = 'completed'
      AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `, [doctorId]);

    const allMonths = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toISOString().slice(0, 7);
    });

    const filledData = allMonths.map(month => {
      const found = results.find(r => r.month === month);
      return found ? { month, earnings: parseFloat(found.earnings) } : { month, earnings: 0 };
    });

    res.status(200).json({
      success: true,
      trend: filledData
    });
  } catch (error) {
    console.error('Doctor earnings trend error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch earnings trends: ${error.message}`
    });
  }
};


export const getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format - must be numeric' });
    }

    const [doctor] = await pool.query(
      `SELECT id FROM doctors WHERE user_id = ?`,
      [parseInt(userId)]
    );
    if (!doctor.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorId = doctor[0].id;

const [appointments] = await pool.query(
  `SELECT 
    a.id, 
    u.fullname AS patient, 
    DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS date,
    TIME_FORMAT(a.appointment_time, '%h:%i %p') AS time, 
    a.reason AS \`condition\`
   FROM appointments a
   JOIN users u ON a.patient_id = u.id
   WHERE a.doctor_id = ? AND a.status = 'pending'
   ORDER BY a.appointment_date, a.appointment_time
   LIMIT 5`,
  [doctorId]
);

    res.json({
      success: true,
      appointments: appointments || []
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch appointments: ${error.message}`
    });
  }
};

export const getDoctorAlerts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format - must be numeric' });
    }

    const [doctor] = await pool.query(
      `SELECT id FROM doctors WHERE user_id = ?`,
      [parseInt(userId)]
    );
    if (!doctor.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorId = doctor[0].id;

    // Example alerts (customize based on your needs)
    const alerts = [
      { id: 1, message: "Low stock of Painkillers", type: "warning" },
      { id: 2, message: "Annual conference next week", type: "info" },
      { id: 3, message: "2 pending prescriptions", type: "warning" }
    ];

    // Optionally, fetch dynamic alerts from the database (e.g., pending prescriptions)
    const [pendingPrescriptions] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM medicalHistory
       WHERE recorded_by_user_id = ? AND medication IS NOT NULL AND medication != ''
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId]
    );

    if (pendingPrescriptions[0].total > 0) {
      alerts.push({
        id: alerts.length + 1,
        message: `${pendingPrescriptions[0].total} pending prescriptions`,
        type: "warning"
      });
    }

    res.json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching doctor alerts:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch alerts: ${error.message}`
    });
  }
};

