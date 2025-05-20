import nodemailer from 'nodemailer';
import { registerUser, loginUser, getUserFromToken, registerDoctorInService } from "../services/authService.js";
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { createPatient } from '../models/Patient.js'; // Import the createPatient model
import { v4 as uuidv4 } from 'uuid'; // For generating patient_code
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const register = async (req, res) => {
    console.log("Backend register request:", req.body);
    const { fullname, username, dateofbirth, contact, email, password } = req.body;
    if (!fullname || !username || !dateofbirth || !contact || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const userResponse = await registerUser({ fullname, username, dateofbirth, contact, email, password });
        if (userResponse.success && userResponse.userId) {
            // Automatically create a patient profile for the newly registered user
            const patientData = {
                user_id: userResponse.userId,
                patient_code: `PAT-${uuidv4().substring(0, 8).toUpperCase()}`,
                // You might want to add other default patient information here if available during registration
            };
            const patientResult = await createPatient(patientData);
            if (!patientResult.success) {
                console.error("Error creating patient profile after registration:", patientResult.message);
                // You might want to handle this error (e.g., maybe delete the user or inform the user)
            }
            
            return res.status(200).json(userResponse);
        } else {
            return res.status(400).json(userResponse);
        }
    } catch (error) {
        console.error("Backend register error", error);
        return res.status(500).json({ success: false, message: "Registration failed!", error: error.message });
    }
};

export const registerDoctor = async (req, res) => {
  try {
    const userData = req.body;
    const result = await registerUser(userData, 'doctor');

    if (!result.success) {
      return res.status(400).json(result);
    }

    const userId = result.userId;
    const certificationFile = req.files['certification'] ? req.files['certification'][0] : null;
    const idProofFile = req.files['idProof'] ? req.files['idProof'][0] : null; // Changed from 'id_proof' to 'idProof'

    if (!certificationFile || !idProofFile) {
      return res.status(400).json({ success: false, message: 'Certification and ID proof are required' });
    }

    const doctorData = {
      userId,
      licenseNumber: userData.licenseNumber,
      specialization: userData.specialization,
      certification_path: `kyc/${certificationFile.filename}`,
      id_proof_path: `kyc/${idProofFile.filename}`,
    };

    const doctorResult = await registerDoctorInService(doctorData);
    res.status(doctorResult.success ? 201 : 400).json(doctorResult);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};


export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const response = await loginUser(email, password);
        console.log("Login response:", response);
        if (response.success) {
            return res.status(200).json({
                success: true,
                token: response.token,
                // token: generatedJWT,
                role: response.role,
                userId: response.userId
            });
    } else {
            return res.status(400).json(response);
        }

        
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(500).json({ success: false, message: "Login failed!", error: error.message });
    }
};

export const getUserDetails = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "Authorization token is required" });
    }
    try {
        const response = await getUserFromToken(token);
        if (response.success) {
            return res.status(200).json({ success: true, user: response.user });
        } else {
            return res.status(401).json({ success: false, message: response.message });
        }
    } catch (error) {
        console.error("Failed to get user from token:", error);
        return res.status(500).json({ success: false, message: "Failed to get user from token!", error: error.message });
    }
};

export const generateOTP = async (req, res) => {
    console.log("generateOTP request:", req.body);
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required!" });
    }

    try {
        await pool.query("SELECT 1");
        console.log("Database connection successful.");

        // Check user exists or not
        const [userCheck] = await pool.query("SELECT email FROM users WHERE email = ?", [email]);
        if (userCheck.length === 0) {
            return res.status(404).json({ success: false, message: "User with this email not found." });
        }

        // Generate OTP and expiry time
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        console.log("Generated OTP:", otp, "Expires:", otpExpires);

        // Update OTP in the database
        const [result] = await pool.query(
            "UPDATE users SET otp = ?, otpExpires = ? WHERE email = ?",
            [otp, otpExpires, email]
        );
        console.log("OTP Update Result:", result);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Failed to update OTP!" });
        }

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP',
            text: `Your OTP is: ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email Sending Error:", error);
                return res.status(500).json({ success: false, message: "Failed to send OTP email.", error: error.message });
            }
            console.log("Email sent:", info.response);
            return res.status(200).json({ success: true, message: "OTP sent successfully!" });
        });
    } catch (error) {
        console.error("generateOTP Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are required!" });
    }

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        const user = rows[0];

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP!" });
        }

        if (Date.now() > new Date(user.otpExpires).getTime()) {
            return res.status(400).json({ success: false, message: "OTP expired!" });
        }

        await pool.query("UPDATE users SET otp = NULL, otpExpires = NULL WHERE email = ?", [email]);

        return res.status(200).json({ success: true, message: "OTP verified successfully!" });
    } catch (error) {
        console.error("OTP Verification Error:", error);
        return res.status(500).json({ success: false, message: "OTP verification failed!", error: error.message });
    }
};



