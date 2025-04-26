import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import UserModel from "../model/userModel";
import sideimg from "../assets/sideimg.svg";

const Signup = () => {
    const [formValues, setFormValues] = useState(new UserModel({}));
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        console.log("validateForm called");
        const errors = {};

        if (!formValues.fullname) {
            errors.fullname = "Full name is required";
        } else if (!/^[A-Za-z0-9_]{3,15}$/.test(formValues.fullname)) {
            errors.fullname = "Please enter your Full name;";
        }

        if (!formValues.username) {
            errors.username = "Username is required";
        } else if (!/^[A-Za-z0-9_]{3,15}$/.test(formValues.username)) {
            errors.username =
                "Username should be 3-15 characters long and can only contain letters, numbers, and underscores.';";
        }

        if (!formValues.dateofbirth) {
            errors.dateofbirth = "Date of birth is required";
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formValues.dateofbirth)) {
            errors.dateofbirth = "Date of birth must be in YYYY-MM-DD format";
        }

        if (!formValues.contact) {
            errors.contact = 'Contact number is required';
        } else if (!/^\d{10}$/.test(formValues.contact)) {
            errors.contact = 'Contact number should be 10 digits';
        }

        if (!formValues.email) {
            errors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!formValues.password) {
            errors.password = 'Password is required';
        }

        console.log("validateForm errors:", errors);
        return errors;
    };

    const handleSubmit = async (e) => {
        console.log("handleSubmit called");
        e.preventDefault();
        const errors = validateForm();
        console.log("handleSubmit errors:", errors);

        if (Object.keys(errors).length !== 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const response = await axios.post("http://localhost:3002/api/auth/register-user", formValues);

            if (response.data.success) {
                toast.success(response.data.message || 'Registration successful!');
                setFormValues({ fullname: "", username: "", dateofbirth: "", contact: "", email: "", password: "" });

                try {
                    const otpResponse = await axios.post("http://localhost:3002/api/auth/generate-otp", { email: formValues.email });
                    if (otpResponse.data.success) {
                        toast.success(otpResponse.data.message || "OTP sent successfully");
                        console.log("Navigating to OptVerify with email:", formValues.email);
  navigate("/Verification", { state: { email: formValues.email } } , 100);
                    } else {
                        toast.error(otpResponse.data.message || "Failed to send OTP");
                    }
                } catch (otpError) {
                    console.error("OTP Error Details:", otpError);
                    toast.error(otpError.response?.data?.error?.message || otpError.response?.data?.message || "Failed to send OTP");
                }

            } else {
                toast.error(response.data.message || 'Registration failed!');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            toast.error(error.response?.data?.error?.message || error.response?.data?.message || "Something went wrong. Please try again later.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    return (
        <div className='container'>
            <div className="left-container">
                <img src={sideimg} alt="Side Image" />
            </div>

            <div className="right-container">
                <div className="header">
                    <div className="text">
                        <h1 className='headSign'>Create an account</h1>
                    </div>
                    <div className="smalltext"> Already have an Account? <span> Log In</span></div>
                    <div className="underline"></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="inputs">
                        <div className="input">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullname"
                                value={formValues.fullname}
                                onChange={handleInputChange}
                            />
                            {formErrors.fullname ? <span className="error-message">{formErrors.fullname}</span> : ''}
                        </div>

                        <div className="input">
                            <label>User Name</label>
                            <input
                                type="text"
                                name="username"
                                value={formValues.username}
                                onChange={handleInputChange}
                            />
                            {formErrors.username ? <span className="error-message">{formErrors.username}</span> : ''}
                        </div>

                        <div className="input">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dateofbirth"
                                value={formValues.dateofbirth}
                                onChange={handleInputChange}
                            />
                            {formErrors.dateofbirth ? <span className="error-message">{formErrors.dateofbirth}</span> : ''}
                        </div>

                        <div className="input">
                            <label>Contact No</label>
                            <input
                                type="tel"
                                name="contact"
                                placeholder="Enter your contact number"
                                value={formValues.contact}
                                onChange={handleInputChange}
                            />
                            {formErrors.contact ? <span className="error-message">{formErrors.contact}</span> : ''}
                        </div>

                        <div className="input">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formValues.email}
                                onChange={handleInputChange}
                            />
                            {formErrors.email ? <span className="error-message">{formErrors.email}</span> : ''}
                        </div>

                        <div className="input">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formValues.password}
                                onChange={handleInputChange}
                            />
                            {formErrors.password ? <span className="error-message">{formErrors.password}</span> : ''}
                        </div>
                    </div>

                    <div className="submint-contain">
                        <button type='submit' className='button-l'>Create an Account</button>
                    </div>
                </form>

                <div className="smalltext">
                    <p style={{ textAlign: "center" }}>
                        Already have an account? {" "}
                        <Link to="/login" className="toggle-link" style={{ color: "#007BFF", textDecoration: "underline" }}>
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;