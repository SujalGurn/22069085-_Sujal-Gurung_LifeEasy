import React, { useState } from 'react';
import axios from 'axios';
import '../../style/manageAvailable.css';

const AddAvailability = () => {
    const [days, setDays] = useState([
        { day_of_week: 'Monday', start_time: '', end_time: '' },
        { day_of_week: 'Tuesday', start_time: '', end_time: '' },
        { day_of_week: 'Wednesday', start_time: '', end_time: '' },
        { day_of_week: 'Thursday', start_time: '', end_time: '' },
        { day_of_week: 'Friday', start_time: '', end_time: '' },
        { day_of_week: 'Saturday', start_time: '', end_time: '' },
        { day_of_week: 'Sunday', start_time: '', end_time: '' },
    ]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateTime = (start, end) => {
        if (!start || !end) return false;
        const startDate = new Date(`1970-01-01T${start}`);
        const endDate = new Date(`1970-01-01T${end}`);
        return startDate < endDate;
    };

    const handleDayChange = (day) => {
        const existingDay = days.find(d => d.day_of_week === day);
        if (existingDay.start_time || existingDay.end_time) return;

        setSelectedDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day) 
                : [...prev, day]
        );
    };

    const handleTimeChange = (day, field, value) => {
        setDays(days.map(d => 
            d.day_of_week === day ? { ...d, [field]: value } : d
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const availabilityData = days
                .filter(day => selectedDays.includes(day.day_of_week))
                .map(day => ({
                    day_of_week: day.day_of_week,
                    start_time: day.start_time,
                    end_time: day.end_time
                }));

            const invalidSlots = availabilityData.filter(
                slot => !validateTime(slot.start_time, slot.end_time)
            );

            if (invalidSlots.length > 0) {
                throw new Error('End time must be after start time');
            }

            const response = await axios.post(
                'http://localhost:3002/api/doctors/availability',
                { days: availabilityData },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Availability updated successfully!');
                setSelectedDays([]);
                setDays(days.map(d => ({ ...d, start_time: '', end_time: '' })));
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="availability-container">
            <div className="availability-card">
                <h2 className="availability-title">Manage Availability</h2>
                {error && <div className="availability-error">{error}</div>}
                {success && <div className="availability-success">{success}</div>}

                <form onSubmit={handleSubmit} className="availability-form">
                    <div className="day-selection">
                        <h3 className="day-selection-heading">Select Days</h3>
                        <div className="day-checkboxes">
                            {days.map(day => (
                                <label 
                                    key={day.day_of_week}
                                    className={`day-checkbox ${
                                        day.start_time || day.end_time ? 'disabled' : ''
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(day.day_of_week)}
                                        onChange={() => handleDayChange(day.day_of_week)}
                                        disabled={!!day.start_time || !!day.end_time}
                                    />
                                    <span className="day-label">{day.day_of_week}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="time-inputs">
                        {selectedDays.length > 0 && (
                            <h3 className="time-inputs-heading">Set Time Slots</h3>
                        )}
                        <div className="time-groups">
                            {selectedDays.map(day => {
                                const dayData = days.find(d => d.day_of_week === day);
                                return (
                                    <div key={day} className="time-group">
                                        <h4 className="time-group-day">{day}</h4>
                                        <div className="time-fields">
                                            <div className="form-item">
                                                <label className="form-label">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={dayData.start_time}
                                                    onChange={(e) => handleTimeChange(day, 'start_time', e.target.value)}
                                                    className="form-input"
                                                    required
                                                />
                                            </div>
                                            <div className="form-item">
                                                <label className="form-label">End Time</label>
                                                <input
                                                    type="time"
                                                    value={dayData.end_time}
                                                    onChange={(e) => handleTimeChange(day, 'end_time', e.target.value)}
                                                    className="form-input"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="availability-actions">
                        <button 
                            type="submit" 
                            className="availability-submit-button"
                            disabled={selectedDays.length === 0}
                        >
                            Save Availability
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAvailability;