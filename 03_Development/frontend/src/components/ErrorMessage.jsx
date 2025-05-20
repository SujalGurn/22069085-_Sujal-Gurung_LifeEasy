import React from "react";

const ErrorMessage = ({ message }) => {
    return (
      <div style={{ color: "red", marginTop: "8px", fontSize: "14px" }}>
        {message}
      </div>
    );
  };
  
  export default ErrorMessage;
  