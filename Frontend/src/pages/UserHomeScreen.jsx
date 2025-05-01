import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../style/myAppointmentsLis.css';
import Footer from '@/components/Footer';

const AppointmentsList = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication required');
    
                const response = await axios.get('/api/appointments/patient', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
    
                setAppointments(response.data.appointments);
                setLoading(false);
                
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };
    
        fetchAppointments();
    }, []);

    if (loading) {
        return (
            <div className="appointments-container">
                <div className="appointments-loading">
                    <div className="appointments-spinner"></div>
                    <p className="appointments-loading-text">Loading your appointments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="appointments-container">
                <div className="appointments-error">
                    <p className="appointments-error-text">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="appointments-container">
          
            <h1 className="appointments-title">My Appointments</h1>
            
           
            {appointments.length === 0 ? (
                <div className="appointments-empty">
                    <p className="appointments-empty-text">No appointments found</p>
                </div>
            ) : (
                <div className="appointments-grid">
                    {appointments.map(appointment => (
                        <div key={appointment.id} className="appointment-card">
                            <div className="appointment-details">
                                <h2 className="appointment-doctor">Dr. {appointment.doctor_name}</h2>
                                <p className="appointment-info">Specialization: {appointment.specialization}</p>
                                <p className="appointment-info">Date: {appointment.date}</p>
                                <p className="appointment-info">Time: {appointment.time}</p>
                            </div>
                            <div className="appointment-meta">
                                <p className="appointment-info">Reason: {appointment.reason}</p>
                                <p className="appointment-info">Notes: {appointment.notes || 'None'}</p>
                                <p className="appointment-status">
                                    Status: 
                                    <span className={`appointment-status-badge ${appointment.status}`}>
                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Footer />
        </div>
    );
};

export default AppointmentsList;