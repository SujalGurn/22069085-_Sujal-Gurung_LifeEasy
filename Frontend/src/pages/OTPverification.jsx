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
      console.log("OptVerify location:", location); // Log the entire location object
      console.log("OptVerify location.state:", location.state); // Log location.state
      console.log("OptVerify email:", email); // Log the extracted email
      if (!email) {
          console.log("Email is missing, redirecting to Signup");
          navigate("/Signup");
      }
  }, [email, navigate, location]);;

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    // Validate OTP length
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
      navigate("/Login"); // Redirect after verification
    } catch (error) {
      setMessage(error.response?.data?.error || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="optcontainer">
      <h2>🔐 OTP Verification</h2>
      {email ? <p>We have sent an OTP to: <strong>{email}</strong></p> : null}

      <form onSubmit={handleVerifyOtp} className="optform">
        <label>Enter OTP:</label>
        <input
          type="text"
          placeholder="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};



export default OTPverification;
