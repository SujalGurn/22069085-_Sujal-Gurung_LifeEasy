// In your EditPatientProfile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditPatientProfile = () => {
    const [formData, setFormData] = useState({
        gender: '',
        blood_group: '',
        address: '',
        contact_number: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
        // Add other fields from your PatientProfile model here, initializing with empty strings
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
                    // Extract patient-specific data for the form
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
                        // Initialize other fields with empty strings as well
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
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-semibold mb-4">Edit Patient Profile</h2>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            {success && <p className="text-green-500 mb-2">{success}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="gender" className="block text-gray-700 text-sm font-bold mb-2">Gender:</label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="blood_group" className="block text-gray-700 text-sm font-bold mb-2">Blood Group:</label>
                    <input type="text" id="blood_group" name="blood_group" value={formData.blood_group} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div>
                    <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Address:</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div>
                    <label htmlFor="contact_number" className="block text-gray-700 text-sm font-bold mb-2">Contact Number:</label>
                    <input type="text" id="contact_number" name="contact_number" value={formData.contact_number} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div>
                    <label htmlFor="emergency_contact_name" className="block text-gray-700 text-sm font-bold mb-2">Emergency Contact Name:</label>
                    <input type="text" id="emergency_contact_name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div>
                    <label htmlFor="emergency_contact_number" className="block text-gray-700 text-sm font-bold mb-2">Emergency Contact Number:</label>
                    <input type="text" id="emergency_contact_number" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                {/* Add more form fields here for other patient profile information */}
                <div className="col-span-full">
                    <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditPatientProfile;