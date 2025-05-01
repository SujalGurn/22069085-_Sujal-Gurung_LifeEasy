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
    console.log('--- CRON JOB TRIGGERED AT:', new Date().toISOString());
    console.log('Current Server Time:', new Date());
    const connection = await pool.getConnection();
    try {
      const [dueSalaries] = await connection.query(`
            SELECT * 
            FROM auto_salary 
            WHERE auto_generate = 1
      `);
    //   WHERE next_payment_date <= CURDATE()

      console.log(`[CRON] Found ${dueSalaries.length} due salaries`);
      for (const config of dueSalaries) {
        console.log(`Processing doctor ${config.doctor_id}`);
        console.log('Deductions:', config.standard_deductions);
        // Fix: Use config.standard_deductions directly (no JSON.parse)
        const deductions = config.standard_deductions || {};
        
        const { totalDeductions, deductionDetails } = calculateDeductions(
          config.base_salary,
          deductions // Already parsed by MySQL driver
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
// File: controllers/salaryController.js
export const approveSalary = async (req, res) => {
    const connection = await pool.getConnection();
    const { paymentId } = req.params;

    try {
        const { adjustments } = req.body;

        // Validate request format
        if (!Array.isArray(adjustments)) {
            throw new Error("Invalid adjustments format. Expected array of adjustment objects");
        }

        await connection.beginTransaction();

        // 1. Lock and fetch payment record
        const [payment] = await connection.query(
            `SELECT 
                id, 
                doctor_id,
                gross_amount,
                total_deductions,
                deduction_details,
                status
             FROM salary_payments 
             WHERE id = ? FOR UPDATE`,
            [paymentId]
        );

        if (!payment.length) {
            throw new Error(`Salary payment ${paymentId} not found`);
        }

        // 2. Process deduction details
        let deductionDetails = payment[0].deduction_details;
        
        // Handle JSON string format
        if (typeof deductionDetails === 'string') {
            try {
                deductionDetails = JSON.parse(deductionDetails);
            } catch (error) {
                throw new Error("Malformed deduction_details JSON");
            }
        }

        // Convert legacy object format to array
        if (!Array.isArray(deductionDetails)) {
            deductionDetails = Object.entries(deductionDetails).map(
                ([name, config]) => ({
                    name: name.trim(),
                    type: config.type?.toLowerCase() || 'fixed',
                    value: Number(config.value) || 0,
                    calculated: Number(config.calculated) || 0
                })
            );
        }

        // Validate deduction structure
        const isValidDeductions = deductionDetails.every(d => 
            typeof d.name === 'string' &&
            ['fixed', 'percentage'].includes(d.type) &&
            typeof d.value === 'number' &&
            typeof d.calculated === 'number'
        );

        if (!isValidDeductions) {
            throw new Error("Invalid deduction structure in database");
        }

        let newTotalDeductions = Number(payment[0].total_deductions);
        const appliedAdjustments = [];

        // 3. Process adjustments
        for (const { name, adjustment } of adjustments) {
            // Validate adjustment
            if (typeof adjustment !== 'number' || isNaN(adjustment)) {
                throw new Error(`Invalid adjustment value for "${name}"`);
            }

            // Find deduction (case-insensitive)
            const deduction = deductionDetails.find(d => 
                d.name.toLowerCase() === name.trim().toLowerCase()
            );

            if (!deduction) {
                const availableNames = deductionDetails.map(d => d.name);
                throw new Error(
                    `Deduction "${name}" not found. Available: ${availableNames.join(', ')}`
                );
            }

            // Calculate new value
            const newCalculated = Number(
                (deduction.calculated + adjustment).toFixed(2)
            );

            // Validate percentage bounds
            if (deduction.type === 'percentage' && (newCalculated < 0 || newCalculated > 100)) {
                throw new Error(
                    `Percentage deduction "${deduction.name}" invalid: ${newCalculated}%`
                );
            }

            // Update values
            deduction.calculated = newCalculated;
            newTotalDeductions = Number(
                (newTotalDeductions + adjustment).toFixed(2)
            );

            appliedAdjustments.push({
                name: deduction.name,
                previous: deduction.calculated - adjustment,
                new: deduction.calculated,
                type: deduction.type
            });
        }

        // 4. Validate net salary
        const grossAmount = Number(payment[0].gross_amount);
        const netSalary = Number(
            (grossAmount - newTotalDeductions).toFixed(2)
        );

        if (netSalary < 0) {
            throw new Error(
                `Invalid net salary: ₹${netSalary} (Gross: ₹${grossAmount}, Deductions: ₹${newTotalDeductions})`
            );
        }

        // 5. Update payment record
        await connection.query(
            `UPDATE salary_payments SET
                total_deductions = ?,
                deduction_details = ?,
                status = 'approved'
             WHERE id = ?`,
            [newTotalDeductions, JSON.stringify(deductionDetails), paymentId]
        );

        // 6. Update doctor's income (without updated_at)
        await connection.query(
            `UPDATE doctors SET
                total_income = total_income + ?
             WHERE id = ?`,
            [netSalary, payment[0].doctor_id]
        );

        

        await connection.commit();

        res.json({
            success: true,
            message: 'Salary approved successfully',
            data: {
                paymentId,
                grossAmount,
                totalDeductions: newTotalDeductions,
                netSalary,
                adjustments: appliedAdjustments
            }
        });

    } catch (error) {
        await connection.rollback();
        
        // Log detailed error information
        console.error('Salary Approval Error:', {
            paymentId,
            error: error.message,
            stack: error.stack,
            adjustments: req.body.adjustments
        });

        // Determine HTTP status code
        const statusCode = error.message.includes('not found') ? 404 : 400;
        
        res.status(statusCode).json({
            success: false,
            message: error.message.includes('percentage') 
                ? 'Deduction percentages must be between 0-100' 
                : error.message,
            errorDetails: process.env.NODE_ENV === 'development'
                ? { stack: error.stack }
                : undefined
        });
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




// salaryController.js
export const assignInitialSalary = async (req, res) => {
    const { 
      doctorId, 
      baseSalary,
      payment_frequency, // Now matches frontend
      standardDeductions,
      nextPaymentDate 
    } = req.body;
  
    try {
      const [doctor] = await pool.query(
        `SELECT id FROM doctors WHERE id = ? AND verification_status = 'approved'`,
        [doctorId]
      );
  
      if (!doctor.length) {
        return res.status(400).json({
          success: false,
          message: "Doctor not approved for salary configuration"
        });
      }
  
      await pool.query(`
        INSERT INTO auto_salary 
        (doctor_id, base_salary, payment_frequency, standard_deductions, next_payment_date)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          base_salary = VALUES(base_salary),
          payment_frequency = VALUES(payment_frequency),
          standard_deductions = VALUES(standard_deductions),
          next_payment_date = VALUES(next_payment_date)
      `, [
        doctorId, 
        baseSalary, 
        payment_frequency,
        JSON.stringify(standardDeductions),
        nextPaymentDate
      ]);
  
      res.status(201).json({ success: true });
      
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({
        success: false,
        message: error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' 
          ? "Invalid payment frequency value (must be 'monthly' or 'bi-weekly')"
          : 'Database operation failed'
      });
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
                u.fullname AS doctor_name
            FROM salary_payments sp
            JOIN doctors d ON sp.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE sp.status = 'pending'
        `);
        
        // Convert JSON string to object if needed
        const formattedPending = pending.map(p => ({
            ...p,
            deduction_details: typeof p.deduction_details === 'string' 
                ? JSON.parse(p.deduction_details) 
                : p.deduction_details
        }));
        
        res.json({ success: true, data: formattedPending });
    } catch (error) {
        console.error('Error fetching pending salaries:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending salaries', error });
    }
};