// In your models/User.js
import { pool } from '../config/db.js';

class UserModel {
    constructor(user){
        this.fullname=user.fullname;
        this.username=user.username;
        this.dateofbirth=user.dateofbirth;
        this.contact=user.contact;
        this.email=user.email;
        this.password=user.password;
    }
}

export const getUserById = async (userId) => {
    try {
        const [rows] = await pool.query('SELECT fullname, email FROM users WHERE id = ?', [userId]);
        if (rows.length > 0) {
            return { success: true, data: rows[0] };
        } else {
            return { success: false, message: 'User not found' };
        }
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return { success: false, message: 'Failed to fetch user', error: error.message };
    }
};

export default UserModel;