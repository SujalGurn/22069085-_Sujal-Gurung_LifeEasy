import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Confirmation = () => {
  const location = useLocation();
  const { appointmentId, date, time } = location.state || {};

  useEffect(() => {
    // if (!appointmentId) {
    //   // Handle invalid access
    //   window.location.href = '/';
    // }
  }, []);

  return (
    <div className="confirmation-page">
      <h2>Appointment Request Submitted!</h2>
      <div className="confirmation-details">
        <p>Appointment ID: {appointmentId}</p>
        <p>Date: {date}</p>
        <p>Time: {time}</p>
        <p>Status: Pending Approval</p>
      </div>
      <div className="next-steps">
        <ol>
          <li>Your request will be reviewed by the doctor</li>
          <li>You'll receive confirmation via email once approved</li>
          <li>Check your appointments dashboard for updates</li>
        </ol>
      </div>
      <button onClick={() => window.location.href='/dashboard'}>
        Go to Dashboard
      </button>
    </div>
  );
};

export default Confirmation;