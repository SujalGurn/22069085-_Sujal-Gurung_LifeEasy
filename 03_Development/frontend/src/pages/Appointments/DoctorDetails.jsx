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
    const [selectedDate, setSelectedDate] = useState(null);
    const [timeSlot, setTimeSlot] = useState(null);
    const [imageError, setImageError] = useState(null);

    const backendUrl = 'http://localhost:3002';
    const defaultAvatar = 'https://via.placeholder.com/100'; // Public fallback

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

            if (!doctor) {
                const doctorResponse = await axios.get(`/api/doctors/${doctorId}`, getAuthConfig());
                if (!doctorResponse.data?.doctor) {
                    throw new Error('Doctor not found');
                }
                console.log('Doctor data:', doctorResponse.data.doctor);
                console.log('profile_picture from API:', doctorResponse.data.doctor?.profile_picture || 'Not provided');
                
                const doctorData = doctorResponse.data.doctor;
                doctorData.profilePicture = doctorData.profile_picture
                    ? `${backendUrl}${doctorData.profile_picture}?t=${Date.now()}`
                    : defaultAvatar;
                
                console.log('Profile picture URL:', doctorData.profilePicture);
                setDoctor(doctorData);
            }

            const availabilityResponse = await axios.get(
                `/api/doctors/${doctorId}/availability/days`,
                getAuthConfig()
            );
            const days = availabilityResponse.data.days || [];
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

    const isWeekday = (date) => {
        const day = date.toLocaleDateString(undefined, { weekday: 'long' });
        return availableDays.includes(day);
    };

    const handleTimeSlotSelection = (slot) => {
        setTimeSlot(slot);
        console.log("Time slot selected:", slot);
    };

    const handleDaySelect = (day) => {
        setSelectedDay(day);
    };

    const handleImageError = () => {
        console.error('Failed to load profile picture:', doctor?.profilePicture);
        setImageError('Unable to load profile picture. Using default avatar.');
        setDoctor(prev => ({
            ...prev,
            profilePicture: defaultAvatar
        }));
    };

    const handleAppointmentSubmit = async () => {
        if (!selectedDate || !timeSlot) {
            alert("Please select a date and time slot first!");
            return;
        }

        let feeToPass = doctor?.consultationFee;
        console.log('Doctor object before navigation:', doctor);

        if (!feeToPass) {
            try {
                const response = await axios.get(`/api/doctors/${doctorId}`, getAuthConfig());
                feeToPass = response.data.doctor.consultationFee || 250.00;
                console.log('Fetched fallback consultation fee:', feeToPass);
            } catch (err) {
                console.error('Error fetching consultation fee:', err);
                feeToPass = 250.00;
            }
        }

        navigate('/appointment-details', {
            state: {
                doctorId: doctorId,
                date: selectedDate,
                timeSlot: timeSlot,
                consultationFee: feeToPass
            }
        });
    };

    if (loading) return <div className="loading">Loading doctor details...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!doctor) return <div className="error">Doctor not found</div>;

    return (
        <div className="doctor-details-container">
            <div className="doctor-info">
                <div className="doctor-header">
                    <img
                        src={doctor.profilePicture}
                        alt={doctor.fullname}
                        className="doctor-avatar"
                        onError={handleImageError}
                    />
                    {imageError && <p className="error-text">{imageError}</p>}
                    <div>
                        <h1>Dr. {doctor.fullname}</h1>
                        <p className="specialization">Specialization: {doctor.specialization}</p>
                        <p className="contact">Contact: {doctor.contact}</p>
                        <p className="fee">Consultation Fee: NPR {doctor.consultationFee || 'N/A'}</p>
                    </div>
                </div>
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
                    </div>
                )}
            </div>
            <div className="date-selection">
                <label>Select Date:</label>
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    filterDate={isWeekday}
                    dateFormat="yyyy-MM-dd"
                />
            </div>

            {timeSlot && (
                <button className="submit-appointment-btn" onClick={handleAppointmentSubmit}>
                    Proceed to Appointment Details
                </button>
            )}
        </div>
    );
};

export default DoctorDetails;