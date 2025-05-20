import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TimeSlots = ({ doctorId, dayOfWeek, onTimeSelect }) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                setError(null);
                setLoading(true);
                
                const response = await axios.get(
                    `/api/doctors/${doctorId}/availability/times`,
                    {
                        ...getAuthConfig(),
                        params: { day: dayOfWeek }
                    }
                );

                if (!response.data?.timeSlots) {
                    throw new Error('Invalid response format');
                }

                setSlots(response.data.timeSlots);
            } catch (error) {
                setError(error.response?.data?.message || "Failed to load time slots");
                console.error('Slot fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (doctorId && dayOfWeek) {
            fetchSlots();
        }
    }, [doctorId, dayOfWeek]);

    return (
        <div className="time-slots">
            <h3>Available Times for {dayOfWeek}</h3>
            {loading && <p>Loading available slots...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && !error && (
                slots.length > 0 ? (
                    slots.map((slot, index) => (
                        <button
                            key={`${slot.start_time}-${index}`}
                            onClick={() => onTimeSelect?.(slot)}
                            className="time-slot-button"
                        >
                            {slot.start_time} - {slot.end_time}
                        </button>
                    ))
                ) : (
                    <p>No available slots for this day</p>
                )
            )}
        </div>
    );
};

export default TimeSlots;