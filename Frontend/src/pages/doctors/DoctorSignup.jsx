import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import UserModel from "../../model/userModel";
import sideimg from "../../assets/profile.png";

const DoctorSignup = () => {
    const [formValues, setFormValues] = useState({
        ...new UserModel({}),
        licenseNumber: "",
        specialization: "",
        certification: null,
        idProof: null
    });
    
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};
       
        if (!formValues.fullname) {
            errors.fullname = "Full name is required";
        } else if (!/^[A-Za-z0-9_]{3,15}$/.test(formValues.fullname)) {
            errors.fullname = "Please enter your Full name;"; // Adjust error message if necessary
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

        // Doctor-specific validation
        if (!formValues.licenseNumber) errors.licenseNumber = "License number is required";
        if (!formValues.specialization) errors.specialization = "Specialization is required";
        if (!formValues.certification) errors.certification = "Certification file is required";
        if (!formValues.idProof) errors.idProof = "ID proof is required";

        return errors;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prevValues => ({
            ...prevValues,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const formData = new FormData();
            // Append user data
            Object.entries(formValues).forEach(([key, value]) => {
                if (key !== 'certification' && key !== 'idProof') {
                    formData.append(key, value);
                }
            });

            console.log("FormData before sending:", formData);
            // Append files
            formData.append('certification', formValues.certification);
            formData.append('id_proof', formValues.idProof);

            const response = await axios.post(
                "http://localhost:3002/api/auth/register-doctor",
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            console.log("Full response data: ", response.data); 
            if (response.data.success) {
                toast.success("Doctor registration submitted for verification!");
                // navigate("/verificationPending", { 
                //     state: { 
                //         status: "pending",
                //         email: formValues.email 
                //     }
                // });
                // await fetchUserDetails();
                // console.log("Navigating to /verifyPending");
              
                navigate("/verifyPending", { replace: true, state: { fromRegistration: true } });
            } else {
                console.log("User is not a doctor, navigating to /");
                navigate('/');
               
            }
        } catch (error) {
            console.error("Registration error:", error.response?.data || error.message);
            toast.error(
              error.response?.data?.message || 
              "Registration failed. Please check your inputs."
            );
          }
    };

    const handleFileChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.files[0]
        });
    };

    return (
        <div className='container'>
            <div className="left-container">
                <img src={sideimg} alt="Side Image" />
            </div>

            <div className="right-container">
                <div className="header">
                    <div className="text">
                        <h1 className='headSign'>Doctor Registration</h1>
                    </div>
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
                            {formErrors.fullname && <span className="error-message">{formErrors.fullname}</span>}
                        </div>

                        <div className="input">
                            <label>User Name</label>
                            <input
                                type="text"
                                name="username"
                                value={formValues.username}
                                onChange={handleInputChange}
                            />
                            {formErrors.username && <span className="error-message">{formErrors.username}</span>}
                        </div>

                        <div className="input">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dateofbirth"
                                value={formValues.dateofbirth}
                                onChange={handleInputChange}
                            />
                            {formErrors.dateofbirth && <span className="error-message">{formErrors.dateofbirth}</span>}
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
                            {formErrors.contact && <span className="error-message">{formErrors.contact}</span>}
                        </div>

                        <div className="input">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formValues.email}
                                onChange={handleInputChange}
                            />
                            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                        </div>

                        <div className="input">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formValues.password}
                                onChange={handleInputChange}
                            />
                            {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                        </div>
                    </div>

                    <div className="input">
                        <label>Medical License Number</label>
                        <input
                            type="text"
                            name="licenseNumber"
                            value={formValues.licenseNumber}
                            onChange={handleInputChange}
                        />
                        {formErrors.licenseNumber && <span className="error-message">{formErrors.licenseNumber}</span>}
                    </div>

                    <div className="input">
                        <label>Specialization</label>
                        <input
                            type="text"
                            name="specialization"
                            value={formValues.specialization}
                            onChange={handleInputChange}
                        />
                        {formErrors.specialization && <span className="error-message">{formErrors.specialization}</span>}
                    </div>

                    <div className="input">
                        <label>Medical Certification</label>
                        <input
                            type="file"
                            name="certification"
                            accept=".pdf,.jpg,.png"
                            onChange={handleFileChange}
                        />
                        {formErrors.certification && <span className="error-message">{formErrors.certification}</span>}
                    </div>

                    <div className="input">
                        <label>Government ID Proof</label>
                        <input
                            type="file"
                            name="idProof"
                            accept=".pdf,.jpg,.png"
                            onChange={handleFileChange}
                        />
                        {formErrors.idProof && <span className="error-message">{formErrors.idProof}</span>}
                    </div>

                    <div className="submint-contain">
                        <button type='submit' className='button-l'>Register as Doctor</button>
                    </div>
                </form>

                <div className="smalltext">
                    <p style={{ textAlign: "center" }}>
                        Already have an account? {" "}
                        <Link to="/login" className="toggle-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DoctorSignup;
