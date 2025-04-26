
import bcrypt from 'bcryptjs';
import {pool} from '../config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// const JWT_SECRET="qwerasdfqwerasdfdfsdfqfuiofghwefdfsbq"



export const registerUser=async(user, role = 'user')=>{
    console.log(user);

    try{

        const[existingUser]=await pool.query(`SELECT * FROM users WHERE email=?`,[user.email]);
        if(existingUser.length>0){
            return {success:false,message:"User already exists!"};
        }

        const hashedPassword = await bcrypt.hash(user.password,10);
        const query=`INSERT INTO users 
      (fullname, username, dateofbirth, contact, email, password, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [user.fullname,user.username,user.dateofbirth,user.contact,user.email,hashedPassword,role];


       
        const [result] = await pool.query(query, values);
        console.log("registerUser result:", result);
        // await pool.query(query,values);
        return {success:true,message:"Registration successful!", userId: result.insertId};
    }catch(error){
        return {success:false,message:"Registration failed!. Please try again", error:error};
    }

}


export const registerDoctorInService = async (doctorData, connection = pool) => {
    console.log("registerDoctorInService doctorData:", doctorData);

    try {
        const query = `INSERT INTO doctors (user_id, license_number, specialization, certification_path, id_proof_path)
                       VALUES (?, ?, ?, ?, ?)`;
        const values = [
            doctorData.userId,
            doctorData.licenseNumber,
            doctorData.specialization,
            doctorData.certification_path,
            doctorData.id_proof_path,
        ];

        const [result] = await connection.query(query, values);
        console.log("registerDoctorInService result:", result);

        return { success: true, message: "Doctor registration submitted for verification!", status: 'pending' };
    } catch (error) {
        console.error("Doctor registration error:", error);
        return { success: false, message: "Doctor registration failed!", error: error.message };
    }
};

export const loginUser=async(email,password)=>{

    try{

        const [rows]=await pool.query(`SELECT * FROM users WHERE email=?`,[email]);
    if(rows.length===0){
        return {success:false,message:"User not found!"};
    }
    const user=rows[0];

    const passwordMatch=await bcrypt.compare(password,user.password);
    if(!passwordMatch){
        return {success:false,message:"Invalid password!"};
    }

 // Doctor verification check
 if (user.role === 'doctor') {
    const [doctor] = await pool.query(
        `SELECT verification_status 
         FROM doctors 
         WHERE user_id = ?`,
        [user.id]
    );

    if (!doctor.length) {
        return { 
            success: false, 
            message: "Doctor registration not found" 
        };
    }

    if (doctor[0].verification_status !== 'approved') {
        return { 
            success: false, 
            message: "Account pending admin approval" 
        };
    }
}


    const token=jwt.sign({id:user.id, role: user.role , email: user.email},
        process.env.JWT_SECRET,
        {expiresIn:'1h'}
    );
    console.log("generated token",token);
    console.log("JWT_SECRET from login route:", process.env.JWT_SECRET);

    return{
        success:true,
        message:"Login successful!",
        token:token,
        role:user.role,
        userId:user.id
    }
    } catch(error){

        return {success:false,message:"Login failed!. Please try again", error:error};
    }
    

}


export const getUserFromToken = async (token) => {
    try {
        const trimedToken = token.trim();
        const decodedToken = jwt.verify(trimedToken, process.env.JWT_SECRET);

        const [rows] = await pool.query(
            `SELECT id, username, contact, email, role FROM users WHERE id=?`,
            [decodedToken.id]
        );

        if (rows.length === 0) {
            return { success: false, message: "User not found!" };
        } else {
            return { success: true, user: rows[0] }; // Include user data here
        }
    } catch (error) {
        return { success: false, message: "Invalid token!" };
    }
};



export const getPendingVerifications = async (req, res) => {
    try {
        const [doctors] = await pool.query(`
             SELECT d.*, u.email, u.fullname 
            FROM doctors d 
            JOIN users u ON d.user_id = u.id 
            WHERE verification_status = 'pending'
        `);

        console.log("Doctors from database:", doctors); // Add this line

        if (!doctors.length) {
            console.log("No pending verifications found."); // Add this line
            return res.status(404).json({ 
                success: false, 
                message: "No pending verifications found" 
            });
        }

        res.json({ 
            success: true, 
            doctors: doctors.map(doc => ({
                ...doc,
                certification_path: `<span class="math-inline">\{process\.env\.BASE\_URL\}/</span>{doc.certification_path}`,
                id_proof_path: `<span class="math-inline">\{process\.env\.BASE\_URL\}/</span>{doc.id_proof_path}`
            }))
        });

    } catch (error) {
        console.error("Get pending error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch verifications",
            error: error.message 
        });
    }
};