import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from '../UserContext';

const VerificationPending = () => {
  const { isDoctor } = useContext(UserContext);
  const location = useLocation();

  // Check if coming from registration
  const fromRegistration = location.state?.fromRegistration;

  if (!isDoctor && !fromRegistration) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="verification-container">
      <h2>Verification Pending</h2>
      <p>
        Thank you for registering! Your application is under review.
        We'll notify you via email once verified.
      </p>
    </div>
  );
};

export default VerificationPending;