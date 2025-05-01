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

    // Form validation logic
    const validateForm = () => {
        const errors = {};
        const regex = {
            fullname: /^[A-Za-z0-9_]{3,15}$/,
            username: /^[A-Za-z0-9_]{3,15}$/,
            dateofbirth: /^\d{4}-\d{2}-\d{2}$/,
            contact: /^\d{10}$/,
            email: /\S+@\S+\.\S+/,
        };

        if (!formValues.fullname || !regex.fullname.test(formValues.fullname)) {
            errors.fullname = "Please enter a valid Full name.";
        }
        if (!formValues.username || !regex.username.test(formValues.username)) {
            errors.username = "Username should be 3-15 characters and can include letters, numbers, and underscores.";
        }
        if (!formValues.dateofbirth || !regex.dateofbirth.test(formValues.dateofbirth)) {
            errors.dateofbirth = "Date of birth must be in YYYY-MM-DD format.";
        }
        if (!formValues.contact || !regex.contact.test(formValues.contact)) {
            errors.contact = "Contact number should be 10 digits.";
        }
        if (!formValues.email || !regex.email.test(formValues.email)) {
            errors.email = "Please enter a valid email address.";
        }
        if (!formValues.password) {
            errors.password = "Password is required.";
        }

        return errors;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const response = await axios.post("http://localhost:3002/api/auth/register-user", formValues);
            if (response.data.success) {
                toast.success(response.data.message || "Registration successful!");
                setFormValues(new UserModel({})); // Reset form values

                try {
                    const otpResponse = await axios.post("http://localhost:3002/api/auth/generate-otp", { email: formValues.email });
                    if (otpResponse.data.success) {
                        toast.success(otpResponse.data.message || "OTP sent successfully");
                        navigate("/Verification", { state: { email: formValues.email } });
                    } else {
                        toast.error(otpResponse.data.message || "Failed to send OTP");
                    }
                } catch (otpError) {
                    toast.error(otpError.response?.data?.error?.message || "Failed to send OTP");
                }

            } else {
                toast.error(response.data.message || "Registration failed!");
            }
        } catch (error) {
            toast.error(error.response?.data?.error?.message || "Something went wrong. Please try again later.");
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    return (
        <div className="flex min-h-screen bg-gray-20">
            {/* Left Side Container */}
            <div className="hidden lg:block w-1/2 flex items-center justify-center">
                <img src={sideimg} alt="Side Image" className="w-11/12 object-cover" />
            </div>

            {/* Right Side Container */}
            <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-8 space-y-6 bg-white shadow-lg rounded-lg">
                <h1 className="text-3xl font-semibold text-black-600">Create an account</h1>
                <p className="text-sm text-gray-600">Already have an Account? <Link to="/login" className="text-[#14467c] underline">Log In</Link></p>
                <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="fullname"
                            value={formValues.fullname}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors.fullname && <span className="text-red-500 text-xs">{formErrors.fullname}</span>}
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formValues.username}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors.username && <span className="text-red-500 text-xs">{formErrors.username}</span>}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input
                            type="date"
                            name="dateofbirth"
                            value={formValues.dateofbirth}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors.dateofbirth && <span className="text-red-500 text-xs">{formErrors.dateofbirth}</span>}
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Contact No</label>
                        <input
                            type="tel"
                            name="contact"
                            value={formValues.contact}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors.contact && <span className="text-red-500 text-xs">{formErrors.contact}</span>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formValues.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors.email && <span className="text-red-500 text-xs">{formErrors.email}</span>}
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formValues.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formErrors.password && <span className="text-red-500 text-xs">{formErrors.password}</span>}
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button type="submit" className="w-full py-3 px-6 bg-[#14467C] text-white rounded-md hover:bg-[#749fcc] focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Create an Account
                        </button>
                    </div>
                </form>
                <p className="text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-blue-500 underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
