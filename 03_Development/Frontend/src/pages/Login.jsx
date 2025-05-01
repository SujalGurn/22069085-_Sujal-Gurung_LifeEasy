import axios from "axios";
import React, { useContext, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../UserContext";
import "../style/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { setUserData } = useContext(UserContext);
  const navigate=useNavigate();
  const {fetchUserDetails, userData}=useContext(UserContext);
  

  // Validation function for email and password
  const validateForm = () => {
    const errors = {};
    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    return errors;
  };

 // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(email, password);


  // Validate form fields
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try{

      //make API request to login
      const response = await axios.post("http://localhost:3002/api/auth/login", {email,password});

      if(response.data.success){
        toast.success(response.data.message || "Login successful!");
        const { token, role } = response.data;
        localStorage.setItem("token", response.data.token);
        // const token = response.data.token;
        console.log(token);
        localStorage.setItem("token", token);
        localStorage.setItem("userRole", response.data.role);
        await fetchUserDetails();
        const userRole = response.data.role;
        // localStorage.setItem("keepLoggedIn", JSON.stringify(true));
        if (userRole === "admin") {
          navigate("/adminDashboard");
      } else if (userRole === "doctor") {
          navigate("/doctorDashboard");
      } else {
          navigate("/homeScreen");
      }
        

      }else{
        toast.error(response.data.message || "Login failed");
      }

    }catch(error){
      console.error("Error during login:", error );
      toast.error(error.response?.data?.message || "Something went wrong. Please try again later.");
    }


  };

 
  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h1 className="main-logo">LifeEasy</h1>
        <h2 className="login-heading">Sign in</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email or mobile phone number"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "error" : ""}
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <button type="submit" className="login-button">
            Log In
          </button>
        </form>

        <div className="terms-text">
          By continuing, you agree to the <Link to="/terms">Terms of use</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </div>

        <div className="auth-links">
          <Link to="/forgot-password">Forget your password</Link>
          <span className="divider">|</span>
          <Link to="/signUp">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;