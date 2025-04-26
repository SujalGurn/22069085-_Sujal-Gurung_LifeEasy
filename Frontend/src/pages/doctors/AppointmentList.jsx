// AppointmentList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AppointmentList = () => {
    const [appointments, setAppointments] = useState({
        pending: [],
        confirmed: [],
        completed: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please login.');
                setLoading(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };
            
            const [pendingRes, confirmedRes, completedRes] = await Promise.all([
                axios.get('/api/appointments/pending', { headers }),
                axios.get('/api/appointments/confirmed', { headers }),
                axios.get('/api/appointments/completed', { headers })
            ]);

            setAppointments({
                pending: pendingRes.data.appointments || [],
                confirmed: confirmedRes.data.appointments || [],
                completed: completedRes.data.appointments || []
            });
            setError(null);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setError(error.response?.data?.message || 'Failed to fetch appointments');
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleAction = async (appointmentId, action) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please login.');
                return;
            }

            await axios.put(`/api/appointments/${appointmentId}/${action}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Refresh the list after action
            await fetchAppointments();
            alert(`Appointment ${action}ed successfully!`);

        } catch (error) {
            console.error(`Error ${action}ing appointment:`, error);
            alert(`Failed to ${action} appointment: ${error.response?.data?.message || error.message}`);
        }
    };

    if (loading) return <div className="loading">Loading appointments...</div>;
    if (error) return <div className="error">{error}</div>;

    const AppointmentCard = ({ appointment, showActions = true }) => (
        <div key={appointment.id} className="appointment-card">
            <div className="card-header">
                <h3>Patient: {appointment.patientName}</h3>
                <div className="meta">
                    <span>Date: {new Date(appointment.date).toLocaleDateString()}</span>
                    <span>Time: {appointment.time}</span>
                    {appointment.status && <span>Status: {appointment.status}</span>}
                </div>
            </div>
            <p>Reason: {appointment.reason}</p>
            {showActions && (
                <div className="actions">
                    <button 
                        className="confirm-btn"
                        onClick={() => handleAction(appointment.id, 'confirm')}
                    >
                        Confirm
                    </button>
                    <button 
                        className="reject-btn"
                        onClick={() => handleAction(appointment.id, 'reject')}
                    >
                        Reject
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="appointment-list">
            <div className="pending-appointments">
                <h2>Pending Appointments</h2>
                {appointments.pending.length === 0 ? (
                    <p>No pending appointments found</p>
                ) : (
                    <div className="appointments-container">
                        {appointments.pending.map(appointment => (
                            <AppointmentCard 
                                key={appointment.id} 
                                appointment={appointment} 
                                showActions={true}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="confirmed-appointments">
                <h2>Confirmed Appointments</h2>
                {appointments.confirmed.length === 0 ? (
                    <p>No confirmed appointments found</p>
                ) : (
                    <div className="appointments-container">
                        {appointments.confirmed.map(appointment => (
                            <AppointmentCard 
                                key={appointment.id} 
                                appointment={appointment} 
                                showActions={false}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="completed-appointments">
                <h2>Completed Appointments</h2>
                {appointments.completed.length === 0 ? (
                    <p>No Completed appointments found</p>
                ) : (
                    <div className="appointments-container">
                        {appointments.completed.map(appointment => (
                            <AppointmentCard 
                                key={appointment.id} 
                                appointment={appointment} 
                                showActions={false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentList;