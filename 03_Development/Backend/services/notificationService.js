import nodemailer from 'nodemailer';
import { pool } from '../config/db.js';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
dotenv.config();

const emailTransporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const generateAppointmentPDF = async (appointment, qrImageUrl) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const buffers = [];
            const base64Data = qrImageUrl.replace(/^data:image\/\w+;base64,/, '');
            const qrBuffer = Buffer.from(base64Data, 'base64');

            doc.fontSize(20).text('Appointment Confirmation', { align: 'center' }).moveDown();
            doc.fontSize(12)
                .text(`Patient Name: ${appointment.patient_name}`)
                .text(`Doctor: Dr. ${appointment.doctor_name}`)
                .text(`Date: ${moment(appointment.appointment_date).format('DD MMM YYYY')}`)
                .text(`Time: ${moment(appointment.appointment_time, 'HH:mm:ss').format('hh:mm A')}`)
                .moveDown();
            doc.fontSize(12).text('Scan this QR code at the clinic:');
            doc.image(qrBuffer, { fit: [150, 150], align: 'center' }).moveDown();
            doc.fontSize(10).text('QR Code expires 24 hours after appointment time', { color: '#ff0000' });
            doc.end();

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
        } catch (error) {
            reject(error);
        }
    });
};

export const sendAppointmentConfirmation = async (appointment, qrImageUrl) => {
    try {
        if (!appointment?.doctor_id || !appointment?.patient_id || !appointment.patient_email) {
            throw new Error('Invalid appointment data for email');
        }

        const pdfBuffer = await generateAppointmentPDF(appointment, qrImageUrl);

        await emailTransporter.sendMail({
            from: `MedApp <${process.env.EMAIL_USER}>`,
            to: appointment.patient_email,
            subject: 'Appointment Confirmation',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2563eb;">Appointment Confirmed</h2>
                    <p>Your appointment details are attached in the PDF document.</p>
                    <p>Please bring the attached PDF with you to your appointment.</p>
                </div>
            `,
            attachments: [{ filename: 'appointment-confirmation.pdf', content: pdfBuffer, contentType: 'application/pdf' }]
        });
    } catch (error) {
        console.error('Email Error:', error);
        throw new Error(`Email failed: ${error.message}`);
    }
};


export const sendPaymentReceipt = async (appointment) => {
    try {
        if (!appointment?.patient_email) throw new Error('Invalid email for receipt');

        const doc = new PDFDocument();
        const buffers = [];
        doc.fontSize(20).text('Payment Receipt', { align: 'center' }).moveDown();
        doc.fontSize(12)
            .text(`Patient Name: ${appointment.patient_name}`)
            .text(`Doctor: Dr. ${appointment.doctor_name}`)
            .text(`Date: ${moment(appointment.appointment_date).format('DD MMM YYYY')}`)
            .text(`Time: ${moment(appointment.appointment_time, 'HH:mm:ss').format('hh:mm A')}`)
            .text(`Amount Paid: NPR ${appointment.consultation_fee || 250.00}`)
            .moveDown();
        doc.end();

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            emailTransporter.sendMail({
                from: `MedApp <${process.env.EMAIL_USER}>`,
                to: appointment.patient_email,
                subject: 'Payment Receipt',
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h2 style="color: #2563eb;">Thank You for Your Payment!</h2>
                        <p>Your payment receipt is attached.</p>
                    </div>
                `,
                attachments: [{ filename: 'payment-receipt.pdf', content: Buffer.concat(buffers), contentType: 'application/pdf' }]
            }).catch((err) => {
                console.error('Email send error:', err);
                throw err;
            });
        });

        await new Promise((resolve) => doc.on('end', resolve));
    } catch (error) {
        console.error('Receipt Error:', error);
        throw error;
    }
};