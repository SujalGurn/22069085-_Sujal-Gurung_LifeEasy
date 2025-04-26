// In your ViewPatientProfile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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
        return <div>Loading patient profile...</div>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    if (!profileData) {
        return <p>No patient profile found. <Link to="/edit-patient-profile">Create one?</Link></p>;
    }

    return (
        <div>
            <h2>Your Patient Profile</h2>
            <p><strong>Full Name:</strong> {profileData.fullname}</p> {/* Display fullname */}
            <p><strong>Email:</strong> {profileData.email}</p> {/* Display email */}
            {profileData.patient_code && <p><strong>Patient Code:</strong> {profileData.patient_code}</p>}
            {profileData.gender && <p><strong>Gender:</strong> {profileData.gender}</p>}
            {profileData.blood_group && <p><strong>Blood Group:</strong> {profileData.blood_group}</p>}
            {profileData.address && <p><strong>Address:</strong> {profileData.address}</p>}
            {profileData.contact_number && <p><strong>Contact Number:</strong> {profileData.contact_number}</p>}
            {profileData.emergency_contact_name && <p><strong>Emergency Contact Name:</strong> {profileData.emergency_contact_name}</p>}
            {profileData.emergency_contact_number && <p><strong>Emergency Contact Number:</strong> {profileData.emergency_contact_number}</p>}
            <Link to="/edit-patient-profile">Edit Profile</Link>
        </div>
    );
};

export default ViewPatientProfile;