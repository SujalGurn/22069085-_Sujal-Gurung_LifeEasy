import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // Initial loading state true
    const [loaded, setLoaded] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isDoctor, setIsDoctor] = useState(false);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchUserDetails();
        } else {
            setLoading(false); // No token, set loading to false
            setLoaded(true); // No token, set loaded to true
        }
    }, []);

    const fetchUserDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token || token.split('.').length !== 3) {
                handleAuthError("Invalid token format");
                return;
              }
            if (!token) {
                console.log("No token found");
                setLoading(false);
                setLoaded(true);
                return;
            }

            console.log("Fetching user details with token:", token); // Log the token

            const response = await axios.get("http://localhost:3002/api/auth/get-userDetails", {
                headers: {
                    Authorization: `Bearer ${token}`

                },
            });

            // console.log("API response:", JSON.stringify(response.data, null, 2)); // Log the full response
            console.log("API response: ", response.data);
            if (response.data.success) {
                const user = response.data.user;
                setUserData(user);
                setIsDoctor(response.data.user.role === "doctor");
                setIsAdmin(response.data.user.role === "admin");
                localStorage.setItem("userRole", user.role);
            } else {
                setError(response.data.message || "Failed to fetch user details");
                console.log(response.data.message || "Failed to fetch user details");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred");
            console.error("Error fetching user details:", err);
            console.log(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    };
 

    const handleAuthError = (message) => {
        const errorMsg = message || "Authentication failed";
        setError(errorMsg);
        console.error("Auth Error:", errorMsg);
        localStorage.removeItem("token");
        setUserData(null);
        setIsAdmin(false);
        setIsDoctor(false);
    };

    const logout = () => {
        localStorage.clear();
        setUserData(null);
        setIsAdmin(false);
        setIsDoctor(false);
    };

    return (
        <UserContext.Provider
            value={{
                userData,
                isAdmin,
                isDoctor,
                fetchUserDetails,
                logout,
                error,
                handleAuthError,
                loading,
                loaded,
                token 
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;