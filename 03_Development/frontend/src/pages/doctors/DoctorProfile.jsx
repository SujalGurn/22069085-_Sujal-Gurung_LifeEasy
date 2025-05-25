import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { FaPhoneAlt } from 'react-icons/fa';
import { UserContext } from '../../UserContext';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../style/doctorProfile.css';
import { toast } from 'react-toastify';

const DoctorProfile = () => {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = useContext(UserContext);
    const [doctorId, setDoctorId] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableDays, setAvailableDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [imageError, setImageError] = useState(null);

    const backendUrl = 'http://localhost:3002';
    const defaultAvatar = 'https://via.placeholder.com/100'; // Fallback public URL

    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        params: { t: Date.now() }
    });

    useEffect(() => {
        const { state } = location;
        if (state?.success) {
            toast.success(state.success, {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true
            });
        }
    }, [location]);

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

                console.log('GET /api/doctors/profile response:', profileRes.data);
                console.log('profile_picture from API:', profileRes.data?.doctor?.profile_picture);

                if (!profileRes.data?.doctor) {
                    throw new Error('Doctor profile not found');
                }

                const doctorData = profileRes.data.doctor;
                const profilePicture = doctorData.profile_picture
                    ? `${backendUrl}${doctorData.profile_picture}?t=${Date.now()}`
                    : defaultAvatar;

                console.log('Profile picture URL:', profilePicture);

                setDoctor({
                    id: doctorData.id,
                    fullname: doctorData.fullname || 'Unknown Doctor',
                    contact: doctorData.contact || 'Not available',
                    email: doctorData.email || '',
                    specialization: doctorData.specialization || 'General Practitioner',
                    licenseNumber: doctorData.licenseNumber || '',
                    about: doctorData.about || 'No bio available',
                    profilePicture,
                    opdSchedule: doctorData.opdSchedule || 'Not specified',
                    consultationFee: doctorData.consultationFee != null ? Number(doctorData.consultationFee) : 250.00,
                    qualifications: doctorData.qualifications || [],
                    experience: doctorData.experience || []
                });

                setAvailableDays(daysRes.data?.days || []);
                setError(null);
                setImageError(null);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) fetchData();
    }, [doctorId, backendUrl]);

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
                    params: { day: dayOfWeek, t: Date.now() }
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
            toast.error("Please select a date and time slot first!", {
                position: "top-center",
                autoClose: 2000
            });
            return;
        }

        const consultationFee = doctor?.consultationFee || 250.00;

        navigate('/appointment-details', {
            state: {
                doctorId,
                date: selectedDate,
                timeSlot: selectedTime,
                consultationFee
            }
        });
    };

    const handleImageError = () => {
        console.error('Failed to load profile picture:', doctor?.profilePicture);
        setImageError('Unable to load profile picture. Using default avatar.');
        setDoctor(prev => ({
            ...prev,
            profilePicture: defaultAvatar
        }));
    };

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
    if (!doctor) return <div className="text-center mt-10">Doctor not found</div>;

    return (
        <div className="doctor-profile-container">
            <div className="profile-grid">
                <div>
                    <div className="doctor-header">
                        <img 
                            src={doctor.profilePicture} 
                            alt={doctor.fullname}
                            className="doctor-avatar"
                            onError={handleImageError}
                        />
                        {imageError && <p className="error-text">{imageError}</p>}
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
                                            <p>{exp.position} at {exp.institute} ({exp.duration})</p>
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

                <div className="booking-sidebar">
                    <div className="booking-header">
                        <h2 className="booking-title">Book Appointment</h2>
                    </div>
                    <p className="opd-schedule">
                        <strong>OPD Hours:</strong> {doctor.opdSchedule}
                    </p>
                    <p className="consultation-fee">
                        <strong>Consultation Fee:</strong> NPR {doctor.consultationFee.toFixed(2)}
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