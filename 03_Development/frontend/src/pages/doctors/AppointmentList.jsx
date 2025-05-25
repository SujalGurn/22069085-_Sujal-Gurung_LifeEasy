import React, { useEffect, useState } from 'react';
import axios from 'axios';

const STATUS_COLORS = {
  pending: 'pending',
  confirmed: 'confirmed',
  completed: 'completed',
};

const AppointmentCard = ({ appointment, showActions, onAction }) => (
  <div className="appointment-card">
    <div className="appointment-details">
      <h3 className="appointment-doctor">Patient: {appointment.patientName}</h3>
      <div className="appointment-meta">
        <span className="appointment-info">Date: {new Date(appointment.date).toLocaleDateString()}</span>
        <span className="appointment-info">Time: {appointment.time}</span>
        <span className={`appointment-status-badge ${appointment.status?.toLowerCase() || 'unknown'}`}>
          {appointment.status}
        </span>
      </div>
      <p className="appointment-info">Reason: {appointment.reason}</p>
    </div>
    {showActions && (
      <div className="actions flex gap-4 mt-4">
        <button className="confirm-btn" onClick={() => onAction(appointment.id, 'confirm')}>
          Confirm
        </button>
        <button className="reject-btn" onClick={() => onAction(appointment.id, 'reject')}>
          Reject
        </button>
      </div>
    )}
  </div>
);

const Section = ({ title, data, showActions, onAction }) => (
  <div className="appointments-section my-12 w-full">
    <h2 className="appointments-title text-center">{title}</h2>
    {data.length === 0 ? (
      <p className="appointments-empty text-center text-gray-600">No {title.toLowerCase()} found</p>
    ) : (
      <div className="appointments-grid">
        {data.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            showActions={showActions}
            onAction={onAction}
          />
        ))}
      </div>
    )}
  </div>
);

const AppointmentList = () => {
  const [appointments, setAppointments] = useState({
    pending: [],
    confirmed: [],
    completed: [],
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
        axios.get('/api/appointments/completed', { headers }),
      ]);

      setAppointments({
        pending: pendingRes.data.appointments || [],
        confirmed: confirmedRes.data.appointments || [],
        completed: completedRes.data.appointments || [],
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

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${id}/${action}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      await fetchAppointments();
      alert(`Appointment ${action}ed successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      alert(`Failed to ${action} appointment: ${error.response?.data?.message || error.message}`);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) return <div className="appointments-loading">Loading appointments...</div>;
  if (error) return <div className="appointments-error text-red-600">{error}</div>;

  return (
    <div className="appointments-container">
      <Section
        title="Pending Appointments"
        data={appointments.pending}
        showActions={true}
        onAction={handleAction}
      />
      <Section
        title="Confirmed Appointments"
        data={appointments.confirmed}
        showActions={false}
      />
      <Section
        title="Completed Appointments"
        data={appointments.completed}
        showActions={false}
      />
    </div>
  );
};

export default AppointmentList;
