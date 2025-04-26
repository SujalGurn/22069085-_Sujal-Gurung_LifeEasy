// File: controllers/salaryController.js
import { pool } from '../config/db.js';
import cron from 'node-cron';
import moment from 'moment';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


// Helper: Calculate deductions
const calculateDeductions = (baseSalary, deductionsConfig) => {
    let total = 0;
    const details = [];
    
    for (const [name, config] of Object.entries(deductionsConfig)) {
        let amount = config.value;
        
        if (config.type === 'percentage') {
            amount = baseSalary * (config.value / 100);
        }
        
        total += amount;
        details.push({ name, ...config, calculated: amount });
    }
    
    return { totalDeductions: total, deductionDetails: details };
};

// 1. Salary Configuration
export const configureSalary = async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { doctorId, baseSalary, frequency, deductions } = req.body;
      
      // Verify doctor exists and is approved
      const [doctor] = await connection.query(`
        SELECT d.id 
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ? 
        AND d.verification_status = 'approved'
        AND u.doctor_status = 'approved'
      `, [doctorId]);
  
      if (!doctor.length) {
        return res.status(400).json({
          success: false,
          message: "Doctor not found or not approved"
        });
      }
  
      await connection.beginTransaction();
      
      const nextPayment = moment().add(1, 'month').startOf('month').format('YYYY-MM-DD');
      
      await connection.query(`
        INSERT INTO auto_salary 
        (doctor_id, base_salary, payment_frequency, standard_deductions, next_payment_date)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          base_salary = VALUES(base_salary),
          payment_frequency = VALUES(payment_frequency),
          standard_deductions = VALUES(standard_deductions),
          next_payment_date = VALUES(next_payment_date)
      `, [doctorId, baseSalary, frequency, JSON.stringify(deductions), nextPayment]);
  
      await connection.commit();
      res.status(201).json({ success: true });
      
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ 
        success: false, 
        message: 'Salary configuration failed' 
      });
    } finally {
      connection.release();
    }
  };

// 2. Auto Salary Generation
const generateSalaries = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [dueSalaries] = await connection.query(`
            SELECT a.* 
            FROM auto_salary a
            WHERE a.auto_generate = TRUE 
            AND a.next_payment_date <= CURDATE()
        `);

        for (const config of dueSalaries) {
            const deductions = JSON.parse(config.standard_deductions || '{}');
            const { totalDeductions, deductionDetails } = calculateDeductions(
                config.base_salary,
                deductions
            );

            await connection.query(`
                INSERT INTO salary_payments 
                (doctor_id, gross_amount, total_deductions, deduction_details, 
                 payment_date, auto_generated)
                VALUES (?, ?, ?, ?, ?, TRUE)
            `, [
                config.doctor_id,
                config.base_salary,
                totalDeductions,
                JSON.stringify(deductionDetails),
                config.next_payment_date
            ]);

            // Update next payment date
            const interval = config.payment_frequency === 'monthly' ? 'months' : 'weeks';
            const nextDate = moment(config.next_payment_date)
                .add(1, interval)
                .format('YYYY-MM-DD');

            await connection.query(`
                UPDATE auto_salary 
                SET next_payment_date = ?
                WHERE doctor_id = ?
            `, [nextDate, config.doctor_id]);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Auto salary generation failed:', error);
    } finally {
        connection.release();
    }
};

// Schedule daily at 2:00 AM
cron.schedule('* * * * *', generateSalaries);

// 3. Salary Approval
export const approveSalary = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { paymentId } = req.params;
        const { adjustments } = req.body;

        await connection.beginTransaction();
        
        // Get existing payment
        const [payment] = await connection.query(`
            SELECT * FROM salary_payments 
            WHERE id = ? 
            FOR UPDATE
        `, [paymentId]);

        // Apply adjustments
        let newDeductions = payment.total_deductions;
        let details = JSON.parse(payment.deduction_details);
        
        adjustments.forEach(({ name, adjustment }) => {
            const index = details.findIndex(d => d.name === name);
            if (index > -1) {
                details[index].calculated += adjustment;
                newDeductions += adjustment;
            }
        });

        await connection.query(`
            UPDATE salary_payments
            SET
                total_deductions = ?,
                deduction_details = ?,
                status = 'approved'
            WHERE id = ?
        `, [newDeductions, JSON.stringify(details), paymentId]);

        await connection.query(`
            UPDATE doctors
            SET total_income = total_income + ?
            WHERE id = ?
        `, [payment.gross_amount - newDeductions, payment.doctor_id]);

        // Fetch doctor's email
        const [doctorInfo] = await connection.query(`
            SELECT u.email, u.fullname
            FROM users u
            JOIN doctors d ON u.id = d.user_id
            JOIN salary_payments sp ON d.id = sp.doctor_id
            WHERE sp.id = ?
        `, [paymentId]);

        if (doctorInfo[0]?.email) {
            const { email, fullname } = doctorInfo[0];
            const paymentDate = moment(payment.payment_date).format('YYYY-MM-DD');
            const deductionDetails = JSON.parse(payment.deduction_details);

            let receiptText = `
                Salary Receipt for ${fullname}

                Payment Date: ${paymentDate}
                Gross Amount: ₹${payment.gross_amount.toFixed(2)}
                ----------------------
                Deductions:
            `;

            deductionDetails.forEach(deduction => {
                receiptText += `${deduction.name}: ₹${deduction.calculated.toFixed(2)} (${deduction.type === 'percentage' ? deduction.value + '%' : 'Fixed'})
            `;
            });

            receiptText += `
                ----------------------
                Total Deductions: ₹${newDeductions.toFixed(2)}
                Net Salary: ₹${payment.gross_amount - newDeductions.toFixed(2)}
            `;

            const mailOptions = {
                from: 'your_email@example.com',
                to: email,
                subject: `Salary Receipt for ${moment().format('MMMM YYYY')}`,
                text: receiptText
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending receipt:', error);
                } else {
                    console.log('Receipt sent:', info.response);
                }
            });
        }

        await connection.commit();
        res.json({ success: true, message: 'Salary approved and receipt sent!' });

    } catch (error) {
        await connection.rollback();
        console.error('Salary approval failed:', error);
        res.status(500).json({ success: false, message: 'Salary approval failed' });
    } finally {
        connection.release();
    }
};

// 4. Deduction Management
export const getDeductionTypes = async (req, res) => {
    try {
        const [types] = await pool.query(`
            SELECT * FROM deduction_types 
            WHERE is_active = 1
        `);
        
        res.json({ 
            success: true, 
            data: types 
        });
        
    } catch (error) {
        console.error('Deduction types error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch deduction types',
            error: error.message
        });
    }
};




export const assignInitialSalary = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { doctorId, baseSalary, frequency, deductions } = req.body;

        await connection.beginTransaction();

        const nextPayment = moment().add(1, frequency === 'monthly' ? 'month' : 'weeks').startOf(frequency === 'monthly' ? 'month' : 'week').format('YYYY-MM-DD');

        await connection.query(`
            INSERT INTO auto_salary (doctor_id, base_salary, payment_frequency, standard_deductions, next_payment_date)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                base_salary = VALUES(base_salary),
                payment_frequency = VALUES(payment_frequency),
                standard_deductions = VALUES(standard_deductions),
                next_payment_date = VALUES(next_payment_date)
        `, [doctorId, baseSalary, frequency, JSON.stringify(deductions), nextPayment]);

        await connection.commit();
        res.status(201).json({ success: true, message: 'Initial salary assigned successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error('Error assigning initial salary:', error);
        res.status(500).json({ success: false, message: 'Failed to assign initial salary' });
    } finally {
        connection.release();
    }
};

export const getPendingSalaries = async (req, res) => {
    try {
        const [pending] = await pool.query(`
            SELECT
                sp.id,
                sp.gross_amount,
                sp.total_deductions,
                sp.net_amount,
                sp.payment_date,
                sp.deduction_details,
                u.fullname AS doctor_name -- Changed d.fullname to u.fullname and joined with users table
            FROM salary_payments sp
            JOIN doctors d ON sp.doctor_id = d.id
            JOIN users u ON d.user_id = u.id -- Join with the users table to get the fullname
            WHERE sp.status = 'pending'
        `);
        res.json({ success: true, data: pending });
    } catch (error) {
        console.error('Error fetching pending salaries:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending salaries', error });
    }
};