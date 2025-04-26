import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import '../../style/appointmentDetail.css';
const AppointmentDetails = () => {
    const location = useLocation();
    const { doctorId, date, timeSlot } = location.state || {};
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        reason: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { state } = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
    
        try {
            // Validate required data first
            if (!doctorId || !date || !timeSlot?.start_time) {
                throw new Error('Missing appointment details');
            }
            if (!state?.timeSlot) {
                return <div className="error">No time slot selected</div>;
              }
    
              const formattedDate = moment(date).format('YYYY-MM-DD');
            // Format time properly
            const startTime = timeSlot.start_time;
            // const formattedTime = `${timeSlot.start_time}:00`; // Add seconds
            const formattedTime = `${startTime}:00`;

            if (!startTime) {
                setError('Invalid time slot');
                return;
              }
              console.log(timeSlot?.start_time); 

            const payload = {
                doctor_id: doctorId,
                // date: moment(date).format('YYYY-MM-DD'),
                date: formattedDate,
                time: formattedTime,
                reason: formData.reason,
                notes: formData.notes
            };

            console.log('Submitting payload:', payload);
    
            const response = await axios.post('/api/appointments', payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data.success) {
                navigate('/appointment-confirmation', {
                    state: {
                        token: response.data.token,
                        date: moment(date).format('LL'),
                        timeSlot: timeSlot,
                        time: startTime // Use original time for display
                    }
                });
            }
    
            // const { doctorId, date, timeSlot } = state; 
        } catch (error) {
            setError(error.response?.data?.message || 'Booking failed. Please try again.');
            console.error('Appointment Error:', {
                error: error.message,
                doctorId,
                date,
                timeSlot
            });
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <div className="appointment-details-container">
            <h2>Appointment Details</h2>
            {error && <div className="error-banner">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <label>Date:</label>
                    <p>{date?.toLocaleDateString() || 'N/A'}</p>
                </div>

                <div className="form-section">
                    <label>Time Slot:</label>
                    <p>{timeSlot?.star_time} - {timeSlot?.end_time}</p>
                </div>

                <div className="form-group">
                    <label>Reason for Visit:</label>
                    <input
                        type="text"
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        maxLength="100"
                    />
                </div>

                <div className="form-group">
                    <label>Additional Notes:</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        maxLength="500"
                        rows="4"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    className="submit-button"
                    
                >
                    
                    {submitting ? 'Processing...' : 'Confirm Appointment'}
                </button>
            </form>
        </div>
    );
};

export default AppointmentDetails;