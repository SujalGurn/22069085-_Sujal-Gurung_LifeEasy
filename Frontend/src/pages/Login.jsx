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
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>
        <button type="submit" className="login-btn">
          Login
        </button>
      </form>
      
      <p style={{ textAlign: "center" }}>
        Don't have an account?{" "}
        <Link
          to="/signUp"
          className="toggle-link"
          style={{ color: "#007BFF", textDecoration: "underline" }}
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Login;
