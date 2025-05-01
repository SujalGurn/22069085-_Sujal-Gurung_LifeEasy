import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const OTPverification = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    console.log("OtpVerify location:", location);
    console.log("OtpVerify location.state:", location.state);
    console.log("OtpVerify email:", email);
    if (!email) {
      console.log("Email is missing, redirecting to Signup");
      navigate("/Signup");
    }
  }, [email, navigate, location]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6 || isNaN(otp)) {
      return setMessage("OTP must be a 6-digit number.");
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3002/api/auth/verify-otp", {
        email,
        otp,
      });
      setMessage(response.data.message);
      navigate("/Login");
    } catch (error) {
      setMessage(error.response?.data?.error || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-card">
        <h2 className="otp-verification-title">🔐 OTP Verification</h2>
        {email ? (
          <p className="otp-verification-email">
            We have sent an OTP to: <strong>{email}</strong>
          </p>
        ) : null}

        <form onSubmit={handleVerifyOtp} className="otp-verification-form">
          <div className="form-item">
            <label className="form-label">Enter OTP</label>
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="otp-verification-actions">
            <button
              type="submit"
              className="otp-verification-submit-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>

        {message && (
          <p
            className={`otp-verification-message ${
              message.includes("failed") ? "error" : "success"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default OTPverification;