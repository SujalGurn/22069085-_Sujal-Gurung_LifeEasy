import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { FaPhoneAlt } from 'react-icons/fa';
import { UserContext } from '../../UserContext';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../style/doctorProfile.css';

const DoctorProfile = () => {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const { userData } = useContext(UserContext);
    const [doctorId, setDoctorId] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableDays, setAvailableDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);

    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        params: { t: Date.now() }
    });

    useEffect(() => {
        const resolveDoctorId = async () => {
            try {
                if (/^\d+$/.test(urlId)) {
                    setDoctorId(parseInt(urlId, 10));
                } else if (userData?.role === 'doctor') {
                    const { data } = await axios.get(
                        `/api/doctors/by-user/${userData.id}`,
                        getAuthConfig()
                    );
                    setDoctorId(data.doctorId);
                } else {
                    throw new Error('Invalid doctor identifier');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Doctor not found');
                setLoading(false);
            }
        };
        resolveDoctorId();
    }, [urlId, userData]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, daysRes] = await Promise.all([
                    axios.get(`/api/doctors/${doctorId}/profile`, getAuthConfig()),
                    axios.get(`/api/doctors/${doctorId}/availability/days`, getAuthConfig())
                ]);

                if (!profileRes.data?.doctor) {
                    throw new Error('Doctor profile not found');
                }

                const doctorData = profileRes.data.doctor;
                setDoctor({
                    id: doctorData.id,
                    fullname: doctorData.fullname || 'Unknown Doctor',
                    contact: doctorData.contact || 'Not available',
                    email: doctorData.email || '',
                    specialization: doctorData.specialization || 'General Practitioner',
                    license_number: doctorData.license_number || '',
                    about: doctorData.about || 'No bio available',
                    profile_picture: doctorData.profile_picture || '/default-avatar.png',
                    opd_schedule: doctorData.opd_schedule || 'Not specified',
                    qualifications: doctorData.qualifications || [],
                    experience: doctorData.experience || []
                });

                setAvailableDays(daysRes.data?.days || []);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) fetchData();
    }, [doctorId]);

    const handleDateChange = async (date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        setTimeSlots([]);
        
        try {
            const dayOfWeek = moment(date).format('dddd');
            const { data } = await axios.get(
                `/api/doctors/${doctorId}/availability/times`,
                {
                    ...getAuthConfig(),
                    params: { day: dayOfWeek }
                }
            );
            
            setTimeSlots(data.timeSlots || []);
        } catch (err) {
            setError('Failed to load available time slots');
        }
    };

    const isWeekday = (date) => {
        const day = moment(date).format('dddd');
        return availableDays.includes(day);
    };

    const handleBookAppointment = () => {
        if (!selectedDate || !selectedTime) {
          alert("Please select a date and time slot first!");
          return;
        }
      
        navigate('/appointment-details', {
          state: {
            doctorId,
            date: selectedDate,
            timeSlot: selectedTime
          }
        });
      };


    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
    if (!doctor) return <div className="text-center mt-10">Doctor not found</div>;
    return (
        <div className="doctor-profile-container">
            <div className="profile-grid">
                {/* Left Column */}
                <div>
                    <div className="doctor-header">
                        <img 
                            src={doctor.profile_picture} 
                            alt={doctor.fullname}
                            className="doctor-avatar"
                        />
                        <div className="doctor-info">
                            <h1 className="doctor-name">Dr. {doctor.fullname}</h1>
                            <p className="doctor-specialization">{doctor.specialization}</p>
                            <p className="doctor-contact">
                                <FaPhoneAlt /> {doctor.contact}
                            </p>
                        </div>
                    </div>

                    <div className="section-content">
                        <h2 className="section-title">About</h2>
                        <p>{doctor.about}</p>

                        {doctor.experience.length > 0 ? (
                            <>
                                <h2 className="section-title">Experience</h2>
                                <ul className="experience-list">
                                    {doctor.experience.map((exp, idx) => (
                                        <li key={idx} className="list-item">
                                            <p>{exp.position}</p>
                                            <p>{exp.institute} • {exp.duration}</p>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : null}

                        {doctor.qualifications.length > 0 ? (
                            <>
                                <h2 className="section-title">Qualifications</h2>
                                <ul className="qualifications-list">
                                    {doctor.qualifications.map((q, idx) => (
                                        <li key={idx} className="list-item">
                                            {q.qualification} ({q.year}) - {q.institution}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Right Column */}
                <div className="booking-sidebar">
                    <div className="booking-header">
                    <h2 className="booking-title">Book Appointment</h2>

                    </div>
                    <p className="opd-schedule">
                        <strong>OPD Hours:</strong> {doctor.opd_schedule}
                    </p>

                    <div className="date-picker-container">
                        <label className="date-picker-label">Select Date</label>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            minDate={new Date()}
                            filterDate={isWeekday}
                            dateFormat="MMMM d, yyyy"
                            placeholderText="Choose available date"
                        />
                    </div>

                    {timeSlots.length > 0 && (
                        <div className="time-slots-container">
                            <label className="date-picker-label">Available Time Slots</label>
                            <div className="time-slots-grid">
                                {timeSlots.map((slot, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedTime(slot)}
                                        className={`time-slot ${
                                            selectedTime?.start_time === slot.start_time ? 'selected' : ''
                                        }`}
                                    >
                                        {slot.start_time} - {slot.end_time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedDate && timeSlots.length === 0 && (
                        <p className="section-content">No available slots for this date</p>
                    )}

                    <button
                        onClick={handleBookAppointment}
                        disabled={!selectedDate || !selectedTime}
                        className="booking-button"
                    >
                        Continue to Booking
                    </button>

                    <div className="contact-info">
                        <FaPhoneAlt />{' '}
                        <a href={`tel:${doctor.contact}`} className="contact-link">
                            Contact directly
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DoctorProfile;