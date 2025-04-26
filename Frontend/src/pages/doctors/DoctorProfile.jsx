import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { FaPhoneAlt, FaStethoscope, FaGraduationCap, FaBriefcase, FaMedkit } from 'react-icons/fa';
import { UserContext } from '../../UserContext';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


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
        }
    });

    // Resolve doctor ID
    useEffect(() => {
        const resolveDoctorId = async () => {
            try {
                if (/^\d+$/.test(urlId)) {
                    setDoctorId(parseInt(urlId, 10));
                } else if (userData?.role === 'doctor') {
                    const { data } = await axios.get(`/api/doctors/by-user/${userData.id}`, getAuthConfig());
                    setDoctorId(data.doctorId);
                } else {
                    throw new Error('Invalid doctor ID');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load doctor information');
                setLoading(false);
            }
        };
        resolveDoctorId();
    }, [urlId, userData]);

    // Fetch doctor data and availability
    useEffect(() => {
        const fetchDoctorData = async () => {
            if (!doctorId) return;
            setLoading(true);
            try {
                const [profileRes, daysRes] = await Promise.all([
                    axios.get(`/api/doctors/${doctorId}/profile`, getAuthConfig()),
                    axios.get(`/api/doctors/${doctorId}/availability/days`, getAuthConfig())
                ]);

                setDoctor({
                    ...profileRes.data.doctor,
                    about: profileRes.data.doctor.about || "No bio available",
                    qualifications: profileRes.data.doctor.qualifications || [],
                    experience: profileRes.data.doctor.experience || []
                });

                const days = daysRes.data.days || 
                           daysRes.data.availability?.map(d => d.day_of_week) || [];
                setAvailableDays(days);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctorData();
    }, [doctorId]);

    // Handle date selection and time slot fetching
    const handleDateChange = async (date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        setTimeSlots([]);
        
        try {
            const dayOfWeek = moment(date).format('dddd'); // Get full day name
            const { data } = await axios.get(
                `/api/doctors/${doctorId}/availability/times?day=${dayOfWeek}`,
                getAuthConfig()
            );
            
            setTimeSlots(data.timeSlots || []);
        } catch (err) {
            setError('Failed to load time slots');
        }
    };

    // Date filtering logic
    const isWeekday = (date) => {
        const day = moment(date).format('dddd');
        return availableDays.includes(day);
    };

    // Handle appointment booking
    const handleBookAppointment = () => {
        if (!selectedDate || !selectedTime) {
            alert("Please select a date and time slot first!");
            return;
        }

        navigate('/booking-details/:id', {
            state: {
                doctorId,
                date: moment(selectedDate).format('YYYY-MM-DD'),
                timeSlot: selectedTime
            }
        });
    };

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} />;
    if (!doctor) return <div className="text-center mt-10">Doctor not found</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Doctor Profile Section */}
            <div className="md:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-3xl">👩‍⚕️</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Dr. {doctor.fullname}</h1>
                        <p className="text-gray-600">{doctor.specialization}</p>
                        {doctor.contact && (
                            <p className="text-gray-600 mt-1">
                                <FaPhoneAlt className="inline mr-2" />
                                {doctor.contact}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">About</h2>
                        <p className="text-gray-700">{doctor.about}</p>
                    </section>

                    {doctor.experience?.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold mb-2">Experience</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                {doctor.experience.map((exp, idx) => (
                                    <li key={idx} className="text-gray-700">
                                        <p className="font-medium">{exp.position}</p>
                                        <p>{exp.institute} • {exp.duration}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {doctor.qualifications?.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold mb-2">Qualifications</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                {doctor.qualifications.map((q, idx) => (
                                    <li key={idx} className="text-gray-700">
                                        {q.qualification} ({q.year}) - {q.institution}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>

            {/* Booking Section */}
            <div className="border rounded-lg p-6 bg-green-50 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-center">Book Appointment</h2>
                {doctor.opd_schedule && (
                    <p className="text-sm mb-4 text-center text-gray-600">
                        <strong>OPD Hours:</strong> {doctor.opd_schedule}
                    </p>
                )}

                <div className="mb-4">
                    <label className="block mb-2 font-medium">Select Date</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        minDate={new Date()}
                        filterDate={isWeekday}
                        dateFormat="MMMM d, yyyy"
                        className="w-full p-2 border rounded"
                        placeholderText="Choose available date"
                    />
                </div>

                {timeSlots.length > 0 && (
                    <div className="mb-4">
                        <label className="block mb-2 font-medium">Available Time Slots</label>
                        <div className="grid grid-cols-2 gap-2">
                            {timeSlots.map((slot, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedTime(slot)}
                                    className={`p-2 text-sm rounded transition-colors ${
                                        selectedTime?.start_time === slot.start_time
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white border hover:bg-green-100'
                                    }`}
                                >
                                    {slot.start_time} - {slot.end_time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedDate && timeSlots.length === 0 && (
                    <p className="text-gray-500 text-center mb-4">No available slots for this date</p>
                )}

                <button
                    onClick={handleBookAppointment}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Booking
                </button>

                <div className="mt-4 text-center text-sm">
                    <FaPhoneAlt className="inline-block mr-2" />
                    <a href={`tel:${doctor.contact}`} className="text-blue-600 hover:underline">
                        Contact directly
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfile;