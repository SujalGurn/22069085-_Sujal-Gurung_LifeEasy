import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import '../style/login.css'; // Reuse login styles for consistency

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = () => {
        if (!email) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address";
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const emailError = validateEmail();
        if (emailError) {
            setError(emailError);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3002/api/auth/forgot-password', { email });
            if (response.data.success) {
                toast.success(response.data.message || 'Password reset link sent to your email!');
            } else {
                toast.error(response.data.message || 'Failed to send reset link');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h1 className="main-logo">LifeEasy</h1>
                <h2 className="login-heading">Forgot Password</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={error ? 'error' : ''}
                            disabled={loading}
                        />
                        {error && <div className="error-message">{error}</div>}
                    </div>
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                <div className="auth-links">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;