import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Loader } from 'lucide-react';
import '../../style/PatientsProfile.css';
import Footer from "../../components/Footer";
const ViewPatientProfile = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/profile/patient', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setProfileData(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch patient profile');
                }
            } catch (error) {
                setError(error.response?.data?.message || 'Error fetching patient profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="patient-profile-container">
                <div className="patient-profile-loading">
                    <Loader className="patient-profile-spinner" />
                    <span className="patient-profile-loading-text">Loading patient profile...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="patient-profile-container">
                <div className="patient-profile-error">
                    <p className="patient-profile-error-text">{error}</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="patient-profile-container">
                <div className="patient-profile-empty">
                    <p className="patient-profile-empty-text">No patient profile found.</p>
                    <Link to="/edit-patient-profile" className="patient-profile-cta-button">
                        Create Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
        <div className="patient-profile-container">
            <div className="profile-grid">
                <div>
                    <div className="patient-header">
                        <img
                            src={profileData.profile_picture || '/default-avatar.png'}
                            alt={profileData.fullname}
                            className="patient-avatar"
                        />
                        <div className="patient-info">
                            <h1 className="patient-name">{profileData.fullname}</h1>
                            <p className="patient-email">{profileData.email}</p>
                        </div>
                    </div>

                    <div className="section-content">
                        <h2 className="section-title">Patient Details</h2>
                        <ul className="patient-details-list">
                            {profileData.patient_code && (
                                <li className="list-item">
                                    <strong>Patient Code:</strong> {profileData.patient_code}
                                </li>
                            )}
                            {profileData.gender && (
                                <li className="list-item">
                                    <strong>Gender:</strong> {profileData.gender}
                                </li>
                            )}
                            {profileData.blood_group && (
                                <li className="list-item">
                                    <strong>Blood Group:</strong> {profileData.blood_group}
                                </li>
                            )}
                            {profileData.address && (
                                <li className="list-item">
                                    <strong>Address:</strong> {profileData.address}
                                </li>
                            )}
                            {profileData.contact_number && (
                                <li className="list-item">
                                    <strong>Contact Number:</strong> {profileData.contact_number}
                                </li>
                            )}
                            {profileData.emergency_contact_name && (
                                <li className="list-item">
                                    <strong>Emergency Contact Name:</strong> {profileData.emergency_contact_name}
                                </li>
                            )}
                            {profileData.emergency_contact_number && (
                                <li className="list-item">
                                    <strong>Emergency Contact Number:</strong> {profileData.emergency_contact_number}
                                </li>
                            )}
                        </ul>

                        <div className="patient-profile-actions">
                            <Link to="/edit-patient-profile" className="patient-profile-cta-button">
                                Edit Profile
                            </Link>
                        </div>
                    </div>
                </div>
            
            </div>
        </div>
    <Footer />
    </div>
    );
};

export default ViewPatientProfile;