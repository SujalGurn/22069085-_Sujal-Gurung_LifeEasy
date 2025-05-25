import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../style/doctorCard.css';
import Footer from '@/components/Footer';

const DoctorList = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const backendUrl = 'http://localhost:3002';
    const defaultAvatar = 'https://via.placeholder.com/100'; // Fallback public URL

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const { data } = await axios.get('/api/doctors', {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (!data || !Array.isArray(data.doctors)) {
                    throw new Error('Invalid data format received');
                }

                console.log('GET /api/doctors response:', data);
                data.doctors.forEach(doctor => {
                    console.log(`Doctor ${doctor.fullname} profile_picture:`, doctor.profile_picture);
                });

                setDoctors(data.doctors);
            } catch (error) {
                setError(error.response?.data?.message || error.message || 'Failed to load doctors');
                console.error('Doctor fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const handleSelectDoctor = (doctorId) => {
        if (!doctorId) {
            console.error('Invalid doctor ID');
            return;
        }
        navigate(`/doctors/${doctorId}/profile`);
    };

    const handleRetry = async () => {
        setError('');
        setLoading(true);
        try {
            const { data } = await axios.get('/api/doctors', {
                params: { t: Date.now() },
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!data || !Array.isArray(data.doctors)) {
                throw new Error('Invalid data format received');
            }
            console.log('GET /api/doctors retry response:', data);
            setDoctors(data.doctors);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to refresh doctors list');
        } finally {
            setLoading(false);
        }
    };

    const handleImageError = (doctorId) => {
        console.error(`Failed to load profile picture for doctor ${doctorId}`);
        setDoctors(prevDoctors =>
            prevDoctors.map(doctor =>
                doctor.id === doctorId
                    ? { ...doctor, profile_picture: defaultAvatar }
                    : doctor
            )
        );
    };

    return (
        <div className="doctor-list-container">
            <div className="contain">
                <h1 className="section-title">Our Medical Specialists</h1>
                
                {loading ? (
                    <div className="loading-container">
                        <LoadingSpinner />
                        <p>Loading doctors...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p className="error-message">⚠️ {error}</p>
                        <button 
                            onClick={handleRetry}
                            className="retry-button"
                        >
                            Try Again
                        </button>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="empty-state">
                        <p>No doctors available at the moment</p>
                        <button onClick={handleRetry} className="retry-button">
                            Check Again
                        </button>
                    </div>
                ) : (
                    <div className="doctor-grid">
                        {doctors.map(doctor => (
                            <article 
                                key={doctor.id} 
                                className="doctor-card"
                                onClick={() => handleSelectDoctor(doctor.id)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="card-content">
                                    {/* Left side: Image */}
                                    <div className="card-image">
                                        <img 
                                            src={
                                                doctor.profile_picture && doctor.profile_picture !== 'null' 
                                                    ? `${backendUrl}${doctor.profile_picture}?t=${Date.now()}` 
                                                    : defaultAvatar
                                            } 
                                            alt={doctor.fullname}
                                            className="doctor-avatar"
                                            onError={() => handleImageError(doctor.id)}
                                        />
                                    </div>
                            
                                    {/* Right side: Info */}
                                    <div className="card-info">
                                        <h3 className="doctor-name">Dr. {doctor.fullname}</h3>
                                        <p className="specialization">
                                            <strong>Specialization:</strong> {doctor.specialization}
                                        </p>
                                        {doctor.years_experience && (
                                            <p className="experience">
                                                <strong>Experience:</strong> {doctor.years_experience} years
                                            </p>
                                        )}
                                        {doctor.contact && (
                                            <p className="contact">
                                                <strong>Contact:</strong> {doctor.contact}
                                            </p>
                                        )}
                                        <button 
                                            className="view-profile-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectDoctor(doctor.id);
                                            }}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default DoctorList;