import React, { useContext } from "react";
import { UserContext } from "../UserContext";

function UserHomeScreen() {

    const { userData, error, loading } = useContext(UserContext);
    console.log("UserHomeScreen userData:", userData);
    console.log("UserHomeScreen loading:", loading);
    console.log("UserHomeScreen error:", error);

  
    return (
      userData?(
        <div>
          
            <h2 style={{ textAlign: "center" }}>Welcome to User Home Screen</h2>
            <div style={{ textAlign: "center" }}>
                <h2>
                    Name: {userData.username} <br /> Email: {userData.email}
                </h2>
            </div>
        </div>
      ): (
        <p>looding....</p>
      )
        
    );
}

export default UserHomeScreen;