// src/components/AppointmentDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../style/appointmentDetail.css';

const BookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [appointmentData, setAppointmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const response = await axios.get(`/api/appointments/${id}`);

                if (response.data.success) {
                    setAppointmentData(response.data.appointment);
                } else {
                    setError('Appointment not found');
                }
            } catch (err) {
                setError('Failed to fetch appointment details');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [id]);

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <div className="appointment-detail-container">
            <div className="detail-card">
                <h2>Appointment Details</h2>
                <div className="detail-section">
                    <label>Appointment ID:</label>
                    <p className="detail-value">{appointmentData._id}</p>
                </div>
                
                <div className="detail-section">
                    <label>Patient Name:</label>
                    <p className="detail-value">{appointmentData.patientName}</p>
                </div>

                <div className="detail-section">
                    <label>Doctor's Name:</label>
                    <p className="detail-value">{appointmentData.doctorName}</p>
                </div>

                <div className="detail-section">
                    <label>Appointment Date:</label>
                    <p className="detail-value">
                        {new Date(appointmentData.date).toLocaleDateString()}
                    </p>
                </div>

                <div className="detail-section">
                    <label>Time Slot:</label>
                    <p className="detail-value">{appointmentData.timeSlot}</p>
                </div>

                <button 
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    Back to Scanner
                </button>
            </div>
        </div>
    );
};

export default BookingDetail;