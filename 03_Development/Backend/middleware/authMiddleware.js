import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Backend - Received Token:', token); 
  if (!token) {
    return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Backend - Decoded Token:', decoded);
    // Database check
    const query = 'SELECT id, role FROM users WHERE id = ?';
    const [user] = await pool.query(query, [decoded.id]);
    console.log('Backend - User from DB:', user);
    if (!user[0]) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
      return res.status(403).json({
          success: false,
          code: 'ADMIN_ACCESS_REQUIRED',
          message: "Admin privileges required",
          userRole: req.user.role
      });
  }
  next();
};

export const isDoctor = (req, res, next) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ 
      success: false, 
      message: "Doctor privileges required" 
    });
  }
  next();
};
// export const isAdmin = (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ success: false, message: "Admin access required" });
//   }
//   next();
// };

export const isSameDoctor = (req, res, next) => {
  const requestedDoctorId = parseInt(req.params.id);
  
  // Allow GET requests (viewing) by anyone
  if (req.method === 'GET') return next();

  // Restrict write operations (PUT/POST/DELETE) to the doctor's own profile
  if (req.user.id !== requestedDoctorId) {
    return res.status(403).json({
      success: false,
      message: "Access denied: You can only modify your own profile",
    });
  }
  
  next();
};

export const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: `Required roles: ${roles.join(', ')}` 
    });
  }
  next();
};



export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authorization token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to the request
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};


