import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext'; // Adjust path if necessary

export const useDoctors = () => {
    const { token } = useContext(UserContext);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDoctors = async () => {
            console.log('Token for fetching doctors (from context) in useDoctors:', token);
            try {
                const res = await axios.get('/api/doctors', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                console.log('Response from /api/doctors:', res);
                if (res.data && res.data.success && Array.isArray(res.data.doctors)) {
                    console.log('Fetched doctors data:', res.data.doctors);
                    setDoctors(res.data.doctors);
                } else {
                    console.warn('Doctors API response data is not in the expected format:', res.data);
                    setError('Failed to load doctors: Invalid data format');
                }
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to fetch doctors');
                setLoading(false);
                console.error('Failed to fetch doctors in useDoctors:', err);
                if (err.response) {
                    console.error('Error details:', err.response.data);
                }
            }
        };

        if (token) {
            fetchDoctors();
        } else {
            setLoading(false);
            setError('Authentication token not available');
        }
    }, [token]);

    return { doctors, loading, error };
};

export default useDoctors;