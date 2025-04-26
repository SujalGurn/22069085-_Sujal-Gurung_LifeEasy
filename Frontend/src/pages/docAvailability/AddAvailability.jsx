import React, { useState } from 'react';
import axios from 'axios';
import '../../style/availableDoc.css';

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
                .map(day => ( {
                    day_of_week: day.day_of_week,
                    start_time: day.start_time,
                    end_time: day.end_time
                }));

            // Validate time slots
            const invalidSlots = availabilityData.filter(
                slot => !validateTime(slot.start_time, slot.end_time)
            );

            if (invalidSlots.length > 0) {
                throw new Error('End time must be after start time');
            }

            const response = await axios.post(
                'http://localhost:3002/api/doctors/availability', // Correct URL
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
            <h2>Manage Availability</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="day-selection">
                    {days.map(day => (
                        <label 
                            key={day.day_of_week}
                            className={`day-checkbox ${ (day.start_time || day.end_time) ? 'disabled' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedDays.includes(day.day_of_week)}
                                onChange={() => handleDayChange(day.day_of_week)}
                                disabled={!!day.start_time || !!day.end_time}
                            />
                            {day.day_of_week}
                        </label>
                    ))}
                </div>

                <div className="time-inputs">
                    {selectedDays.map(day => {
                        const dayData = days.find(d => d.day_of_week === day);
                        return (
                            <div key={day} className="time-group">
                                <h4>{day}</h4>
                                <div className="time-fields">
                                    <input
                                        type="time"
                                        value={dayData.start_time}
                                        onChange={(e) => handleTimeChange(day, 'start_time', e.target.value)}
                                        required
                                    />
                                    <span>to</span>
                                    <input
                                        type="time"
                                        value={dayData.end_time}
                                        onChange={(e) => handleTimeChange(day, 'end_time', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={selectedDays.length === 0}
                >
                    Save Availability
                </button>
            </form>
        </div>
    );
};

export default AddAvailability;
