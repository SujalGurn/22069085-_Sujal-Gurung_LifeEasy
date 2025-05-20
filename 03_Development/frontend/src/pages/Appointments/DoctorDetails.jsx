import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TimeSlots from './TimeSlots';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


const DoctorDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id: doctorId } = useParams();
    const [doctor, setDoctor] = useState(location.state?.doctorData || null);
    const [availableDays, setAvailableDays] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(!location.state?.doctorData);
    const [selectedDay, setSelectedDay] = useState(null);
    // const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null); // Add this line
    const [timeSlot, setTimeSlot] = useState(null);
    
    
    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });

    const fetchData = async () => {
        try {
            setError(null);
            setLoading(true);

            // Fetch doctor details if not in state
            if (!doctor) {
                const doctorResponse = await axios.get(`/api/doctors/${doctorId}`, getAuthConfig());
                if (!doctorResponse.data?.doctor) {
                    throw new Error('Doctor not found');
                }
                setDoctor(doctorResponse.data.doctor);
            }

            // Fetch availability
            const availabilityResponse = await axios.get(
                `/api/doctors/${doctorId}/availability/days`,
                getAuthConfig()
            );

            const days = availabilityResponse.data.days ||
                availabilityResponse.data.availability?.map(a => a.day_of_week) || [];
            setAvailableDays(days);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch doctor details");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (doctorId) fetchData();
    }, [doctorId]);

    const filterPassedTime = (time) => {
        const currentDate = new Date();
        const selectedDate = new Date(date);

        return currentDate.getTime() < selectedDate.getTime();
    };

    const isWeekday = (date) => {
        const day = date.toLocaleDateString(undefined, { weekday: 'long' });
        return availableDays.includes(day);
    };

    const handleTimeSlotSelection = (slot) => {
        setTimeSlot(slot);
        // setSelectedTimeSlot(timeSlot);
        console.log("Time slot selected:", slot);
    };

    const handleDaySelect = (day) => {
        setSelectedDay(day);
    };

    const handleAppointmentSubmit = () => {
        // if (selectedDay && selectedTimeSlot) {
            
        // } else {
        //     alert("Please select a day and time slot.");
        // }
    if (!selectedDate || !timeSlot) {
        alert("Please select a date and time slot first!");
        return;
    }

        navigate('/appointment-details', {
            state: {
                doctorId: doctorId,
                // date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), // Replace with actual date logic
                date: selectedDate,
                timeSlot: timeSlot
            }
        });
    };

    if (loading) return <div className="loading">Loading doctor details...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!doctor) return <div className="error">Doctor not found</div>;

    return (
        <div className="doctor-details-container">
            <div className="doctor-info">
                <h1>Dr. {doctor.fullname}</h1>
                <p className="specialization">Specialization: {doctor.specialization}</p>
                <p className="contact">Contact: {doctor.contact}</p>
            </div>

            <div className="availability-section">
                <h2>Available Days</h2>
                <div className="day-buttons">
                    {availableDays.length === 0 ? (
                        <p>No availability configured</p>
                    ) : availableDays.map((day, index) => (
                        <button
                            key={index}
                            className={`day-button ${day === selectedDay ? 'active' : ''}`}
                            onClick={() => handleDaySelect(day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {selectedDay && (
                    <div className="time-slots-section">
                          <TimeSlots
            doctorId={doctorId}
            dayOfWeek={selectedDay}
            onTimeSelect={handleTimeSlotSelection}
        />
                        {timeSlot && (
    <button className="submit-appointment-btn" onClick={handleAppointmentSubmit}>
        Submit Appointment
    </button>
)}
                    </div>
                )}
            </div>
            <div className="date-selection">
            <label>Select Date:</label>
            <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                filterDate={isWeekday}
                filterTime={filterPassedTime}
                dateFormat="yyyy-MM-dd"
            />
        </div>

            {timeSlot && (
                <button className="submit-appointment-btn" onClick={handleAppointmentSubmit}>
                    Submit Appointment
                </button>
            )}
        </div>
    );
};

export default DoctorDetails;