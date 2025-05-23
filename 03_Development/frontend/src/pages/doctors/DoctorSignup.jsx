import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import UserModel from "../../model/userModel";
import sideimg from "../../assets/doctor.jpg";
import "../../style/Docsignup.css";

const DoctorSignup = () => {
  const [formValues, setFormValues] = useState({
    ...new UserModel({}),
    licenseNumber: "",
    specialization: "",
    certification: null,
    idProof: null,
  });

  const [filePreviews, setFilePreviews] = useState({
    certification: null,
    idProof: null,
  });

  const [fileStatus, setFileStatus] = useState({
    certification: "",
    idProof: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [filePreviews]);

  const validateForm = () => {
    const errors = {};
    if (!formValues.fullname) {
      errors.fullname = "Full name is required";
    } else if (!/^[A-Za-z\s]{3,30}$/.test(formValues.fullname)) {
      errors.fullname = "Full name should be 3-30 characters and contain only letters and spaces";
    }
    if (!formValues.username) {
      errors.username = "Username is required";
    } else if (!/^[A-Za-z0-9]{3,15}$/.test(formValues.username)) {
      errors.username = "Username should be 3-15 characters and contain only letters and numbers";
    }
    if (!formValues.dateofbirth) {
      errors.dateofbirth = "Date of birth is required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formValues.dateofbirth)) {
      errors.dateofbirth = "Date of birth must be in YYYY-MM-DD format";
    }
    if (!formValues.contact) {
      errors.contact = "Contact number is required";
    } else if (!/^\d{10}$/.test(formValues.contact)) {
      errors.contact = "Contact number should be 10 digits";
    }
    if (!formValues.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formValues.password) {
      errors.password = "Password is required";
    } else if (formValues.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }
    if (!formValues.licenseNumber) {
      errors.licenseNumber = "License number is required";
    }
    if (!formValues.specialization) {
      errors.specialization = "Specialization is required";
    }
    if (!formValues.certification) {
      errors.certification = "Certification file is required";
    } else if (!['application/pdf', 'image/jpeg', 'image/png'].includes(formValues.certification.type)) {
      errors.certification = "Invalid file type (PDF, JPG, PNG only)";
    } else if (formValues.certification.size > MAX_FILE_SIZE) {
      errors.certification = "File too large (max 5MB)";
    }
    if (!formValues.idProof) {
      errors.idProof = "ID proof is required";
    } else if (!['application/pdf', 'image/jpeg', 'image/png'].includes(formValues.idProof.type)) {
      errors.idProof = "Invalid file type (PDF, JPG, PNG only)";
    } else if (formValues.idProof.size > MAX_FILE_SIZE) {
      errors.idProof = "File too large (max 5MB)";
    }
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (!file) {
      setFormValues((prev) => ({ ...prev, [name]: null }));
      setFilePreviews((prev) => ({ ...prev, [name]: null }));
      setFileStatus((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    const errors = {};
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      errors[name] = "Invalid file type (PDF, JPG, PNG only)";
    } else if (file.size > MAX_FILE_SIZE) {
      errors[name] = "File too large (max 5MB)";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      setFileStatus((prev) => ({ ...prev, [name]: "" }));
      setFilePreviews((prev) => ({ ...prev, [name]: null }));
      return;
    }

    const preview = URL.createObjectURL(file);
    setFormValues((prev) => ({ ...prev, [name]: file }));
    setFilePreviews((prev) => ({ ...prev, [name]: preview }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    setFileStatus((prev) => ({ ...prev, [name]: "File selected successfully" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(formValues).forEach(([key, value]) => {
        if (key !== 'certification' && key !== 'idProof') {
          formData.append(key, value);
        }
      });
      formData.append('certification', formValues.certification);
      formData.append('idProof', formValues.idProof);

      console.log("Submitting FormData:", [...formData.entries()]);
      const response = await axios.post(
        "http://localhost:3002/api/auth/register-doctor",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("Response:", response.data);
      if (response.data.success) {
        toast.success("Doctor registration submitted for verification!");
        navigate("/verifyPending", { replace: true, state: { fromRegistration: true } });
      } else {
        console.log("Registration failed, navigating to /");
        navigate('/');
      }
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.message ||
        "Registration failed. Please check your inputs."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="left-container">
        <img
          src={sideimg}
          alt="Doctor Side Image"
          onError={(e) => {
            console.error("Failed to load side image");
            e.target.src = "https://via.placeholder.com/300";
          }}
        />
      </div>

      <div className="right-container">
        <div className="header">
          <div className="text">
            <h1 className="headSign">Doctor Registration</h1>
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
              <label>Username</label>
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
              {fileStatus.certification && (
                <span className="success-message">{fileStatus.certification}</span>
              )}
              {filePreviews.certification && (
                <div className="file-preview">
                  {formValues.certification.type === 'application/pdf' ? (
                    <div className="pdf-preview">
                      <p>PDF selected: {formValues.certification.name}</p>
                      <a
                        href={filePreviews.certification}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="preview-link"
                      >
                        Open PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={filePreviews.certification}
                      alt="Certification preview"
                      className="preview-image"
                      style={{ maxWidth: '250px', maxHeight: '200px' }}
                      onError={() => console.error("Failed to load certification preview")}
                    />
                  )}
                </div>
              )}
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
              {fileStatus.idProof && (
                <span className="success-message">{fileStatus.idProof}</span>
              )}
              {filePreviews.idProof && (
                <div className="file-preview">
                  {formValues.idProof.type === 'application/pdf' ? (
                    <div className="pdf-preview">
                      <p>PDF selected: {formValues.idProof.name}</p>
                      <a
                        href={filePreviews.idProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="preview-link"
                      >
                        Open PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={filePreviews.idProof}
                      alt="ID Proof preview"
                      className="preview-image"
                      style={{ maxWidth: '250px', maxHeight: '200px' }}
                      onError={() => console.error("Failed to load ID proof preview")}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="submint-contain">
            <button
              type="submit"
              className="button-l"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Register as Doctor"}
            </button>
          </div>
        </form>
        <div className="smalltext">
          <p style={{ textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/login" className="toggle-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorSignup;