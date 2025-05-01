import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../style/editPatientProfile.css';
import Footer from '../../components/Footer';

const EditPatientProfile = () => {
    const [formData, setFormData] = useState({
        gender: '',
        blood_group: '',
        address: '',
        contact_number: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/profile/patient', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success && response.data.data) {
                    const { fullname, email, ...patientData } = response.data.data;
                    setFormData(patientData);
                } else {
                    setFormData({
                        gender: '',
                        blood_group: '',
                        address: '',
                        contact_number: '',
                        emergency_contact_name: '',
                        emergency_contact_number: '',
                    });
                }
            } catch (error) {
                setError(error.response?.data?.message || 'Error fetching patient profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('/api/profile/patient', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setSuccess('Patient profile updated successfully!');
                setTimeout(() => navigate('/patient-profile'), 1500);
            } else {
                setError(response.data.message || 'Failed to update patient profile');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error updating patient profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div >
        <div className="edit-patient-profile-container">
            <div className="edit-patient-profile-card">
                <h2 className="edit-patient-profile-title">Edit Patient Profile</h2>

                {error && <p className="edit-patient-profile-error">{error}</p>}
                {success && <p className="edit-patient-profile-success">{success}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="edit-patient-profile-form">
                        <div className="form-item">
                            <label htmlFor="gender" className="form-label">Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-item">
                            <label htmlFor="blood_group" className="form-label">Blood Group</label>
                            <input
                                type="text"
                                id="blood_group"
                                name="blood_group"
                                value={formData.blood_group}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-item">
                            <label htmlFor="address" className="form-label">Address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-item">
                            <label htmlFor="contact_number" className="form-label">Contact Number</label>
                            <input
                                type="text"
                                id="contact_number"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-item">
                            <label htmlFor="emergency_contact_name" className="form-label">Emergency Contact Name</label>
                            <input
                                type="text"
                                id="emergency_contact_name"
                                name="emergency_contact_name"
                                value={formData.emergency_contact_name}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-item">
                            <label htmlFor="emergency_contact_number" className="form-label">Emergency Contact Number</label>
                            <input
                                type="text"
                                id="emergency_contact_number"
                                name="emergency_contact_number"
                                value={formData.emergency_contact_number}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="edit-patient-profile-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="edit-patient-profile-submit-button"
                        >
                            {loading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
            <Footer />
        </div>
    );
};

export default EditPatientProfile;