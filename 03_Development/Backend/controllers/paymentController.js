import { pool } from '../config/db.js';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const esewaConfig = {
    secretKey: process.env.ESEWA_SECRET_KEY,
    productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
    verifyUrl: 'https://uat.esewa.com.np/api/epay/transaction/status/',
};

// Handle eSewa success callback (public route)
export const handlePaymentSuccess = async (req, res) => {
    const { transaction_uuid, ref_id } = req.query;

    if (!transaction_uuid || !ref_id) {
        return res.status(400).json({ success: false, message: 'Invalid callback parameters' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [payment] = await connection.query(
            'SELECT * FROM payments WHERE transaction_uuid = ? AND status = ?',
            [transaction_uuid, 'pending']
        );
        if (!payment.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Payment record not found or already processed' });
        }

        const verifyUrl = `${esewaConfig.verifyUrl}?product_code=${esewaConfig.productCode}&total_amount=${payment[0].amount}&transaction_uuid=${transaction_uuid}`;
        const response = await axios.get(verifyUrl);
        const { status, ref_id: esewaRefId } = response.data;

        if (status !== 'COMPLETE' || esewaRefId !== ref_id) {
            await connection.query(
                'UPDATE payments SET status = ?, updated_at = NOW() WHERE transaction_uuid = ?',
                ['failed', transaction_uuid]
            );
            await connection.query(
                'UPDATE appointments SET payment_status = ?, updated_at = NOW() WHERE id = ?',
                ['failed', payment[0].appointment_id]
            );
            await connection.commit();
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        await connection.query(
            'UPDATE payments SET status = ?, ref_id = ?, updated_at = NOW() WHERE transaction_uuid = ?',
            ['completed', ref_id, transaction_uuid]
        );
        await connection.query(
            'UPDATE appointments SET payment_status = ?, updated_at = NOW() WHERE id = ?',
            ['paid', payment[0].appointment_id]
        );

        // Trigger appointment confirmation after payment
        await confirmAppointmentHandler({ params: { id: payment[0].appointment_id } }, res);

        await connection.commit();
        res.redirect(`${process.env.FRONTEND_URL}/payment-success?transaction_uuid=${transaction_uuid}`);
    } catch (error) {
        await connection.rollback();
        console.error('Error handling payment success:', error);
        res.status(500).json({ success: false, message: 'Failed to process payment' });
    } finally {
        connection.release();
    }
};

// Handle eSewa failure callback (public route)
export const handlePaymentFailure = async (req, res) => {
    const { transaction_uuid } = req.query;

    if (!transaction_uuid) {
        return res.status(400).json({ success: false, message: 'Invalid callback parameters' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [payment] = await connection.query(
            'SELECT * FROM payments WHERE transaction_uuid = ? AND status = ?',
            [transaction_uuid, 'pending']
        );
        if (!payment.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Payment record not found or already processed' });
        }

        await connection.query(
            'UPDATE payments SET status = ?, updated_at = NOW() WHERE transaction_uuid = ?',
            ['failed', transaction_uuid]
        );
        await connection.query(
            'UPDATE appointments SET payment_status = ?, updated_at = NOW() WHERE id = ?',
            ['failed', payment[0].appointment_id]
        );

        await connection.commit();
        res.redirect(`${process.env.FRONTEND_URL}/payment-failure?transaction_uuid=${transaction_uuid}`);
    } catch (error) {
        await connection.rollback();
        console.error('Error handling payment failure:', error);
        res.status(500).json({ success: false, message: 'Failed to process payment failure' });
    } finally {
        connection.release();
    }
};