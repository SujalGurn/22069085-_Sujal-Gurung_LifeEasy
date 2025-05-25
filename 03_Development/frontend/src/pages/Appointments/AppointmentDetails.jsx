import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import moment from 'moment';
import '../../style/AppointmentDetails.css';

const AppointmentDetails = () => {
    const location = useLocation();
    const { doctorId, date, timeSlot, consultationFee } = location.state || {};
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        reason: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('🔍 State received in AppointmentDetails:', {
            doctorId,
            date: date?.toISOString(),
            timeSlot,
            consultationFee
        });
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            if (!doctorId || !date || !timeSlot?.start_time) {
                throw new Error('Missing appointment details');
            }
            if (!location.state?.timeSlot) {
                setError('No time slot selected');
                return;
            }

            const formattedDate = moment(date).format('YYYY-MM-DD');
            const startTime = timeSlot.start_time;
            const formattedTime = `${startTime}:00`;

            if (!startTime) {
                setError('Invalid time slot');
                return;
            }
            console.log('⏰ Time slot:', timeSlot?.start_time);

            const payload = {
                doctor_id: doctorId,
                date: formattedDate,
                time: formattedTime,
                reason: formData.reason,
                notes: formData.notes
            };

            console.log('📤 Submitting payload:', payload);

            const response = await axios.post('/api/appointments', payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const { paymentData, paymentUrl } = response.data;

                if (!paymentData || !paymentUrl) {
                    throw new Error('Payment initiation failed: Missing payment data or URL');
                }

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = paymentUrl;

                Object.keys(paymentData).forEach((key) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = paymentData[key];
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Booking failed. Please try again.');
            console.error('⚠️ Appointment Error:', {
                error: error.message,
                doctorId,
                date,
                timeSlot,
                consultationFee
            });
            setTimeout(() => {
                navigate('/doctors');
            }, 3000);
        } finally {
            setSubmitting(false);
        }
    };

    // Format consultationFee to display as a number with 2 decimal places
    const displayConsultationFee = consultationFee != null ? Number(consultationFee).toFixed(2) : 'N/A';

    return (
       <div className="appointment-Container">
 <div className="appointment-details-container">
            <h2>Appointment Details</h2>
            {error && <div className="error-banner">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <label>Date:</label>
                    <p>{date ? new Date(date).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div className="form-section">
                    <label>Time Slot:</label>
                    <p>{timeSlot?.start_time && timeSlot?.end_time ? `${timeSlot.start_time} - ${timeSlot.end_time}` : 'N/A'}</p>
                </div>

                <div className="form-section">
                    <label>Consultation Fee:</label>
                    <p>NPR {displayConsultationFee}</p>
                </div>

                <div className="form-group">
                    <label>Reason for Visit:</label>
                    <input
                        type="text"
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        maxLength="100"
                        placeholder="e.g., Routine check-up"
                    />
                </div>

                <div className="form-group">
                    <label>Additional Notes:</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        maxLength="500"
                        rows="4"
                        placeholder="Any additional information"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    className="submit-button"
                >
                    {submitting ? 'Processing...' : 'Confirm and Pay'}
                </button>
            </form>
        </div>

       </div>
       
    );
};

export default AppointmentDetails;