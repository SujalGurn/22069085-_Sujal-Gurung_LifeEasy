// notificationService.js
import nodemailer from 'nodemailer';
import { pool } from '../config/db.js';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
dotenv.config();

const emailTransporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// notificationService.js - Updated PDF generation
const generateAppointmentPDF = async (appointment, qrImageUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      // Convert data URL to buffer
      const base64Data = qrImageUrl.replace(/^data:image\/\w+;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');

      // PDF Content
      doc.fontSize(20).text('Appointment Confirmation', { align: 'center' });
      doc.moveDown();
      
      // Patient Information
      doc.fontSize(12)
        .text(`Patient Name: ${appointment.patient_name}`)
        .text(`Doctor: Dr. ${appointment.doctor_name}`)
        .text(`Date: ${moment(appointment.appointment_date).format('DD MMM YYYY')}`)
        .text(`Time: ${moment(appointment.appointment_time, 'HH:mm:ss').format('hh:mm A')}`) 
        .moveDown();

      // Add QR Code
      doc.fontSize(12).text('Scan this QR code at the clinic:');
      doc.image(qrBuffer, { 
        fit: [150, 150],
        align: 'center'
      });
      doc.moveDown();

      // Add expiration notice
      doc.fontSize(10)
        .text('QR Code expires 20 hour after appointment time', { color: '#ff0000' });

      doc.end();

      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    } catch (error) {
      reject(error);
    }
  });
};

export const sendAppointmentConfirmation = async (appointment, qrImageUrl) => {
  try {

    console.log("Appointment data before sending email:", appointment); // Add this line
    console.log("Email Transporter Configuration:", emailTransporter.options);
    // Validate inputs
    if (!appointment?.doctor_id || !appointment?.patient_id) {
      throw new Error("Invalid appointment data");
    }


    // Generate PDF
    const pdfBuffer = await generateAppointmentPDF(appointment, qrImageUrl);

    // Send email with PDF attachment
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
      attachments: [{
        filename: 'appointment-confirmation.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

  } catch (error) {
    console.error("Email notification error:", error);
    throw new Error(`Email notification failed: ${error.message}`);
  }
};

