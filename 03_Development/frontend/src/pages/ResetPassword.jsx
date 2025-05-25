import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../style/login.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const validateForm = () => {
        if (!password) return "Password is required";
        if (password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain a number";
        if (password !== confirmPassword) return "Passwords do not match";
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formError = validateForm();
        if (formError) {
            setError(formError);
            return;
        }

        console.log('Sending password:', password, 'Token:', token);
        setLoading(true);
        try {
            const response = await axios.post(`http://localhost:3002/api/auth/reset-password/${token}`, { password });
            if (response.data.success) {
                toast.success(response.data.message || 'Password reset successfully!');
                navigate('/login');
            } else {
                toast.error(response.data.message || 'Failed to reset password');
            }
        } catch (err) {
            console.error('Reset error:', err.response?.data);
            toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h1 className="main-logo">LifeEasy</h1>
                <h2 className="login-heading">Reset Password</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="New password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={error ? 'error' : ''}
                            disabled={loading}
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={error ? 'error' : ''}
                            disabled={loading}
                        />
                        {error && <div className="error-message">{error}</div>}
                    </div>
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Password'}
                    </button>
                </form>
                <div className="auth-links">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;