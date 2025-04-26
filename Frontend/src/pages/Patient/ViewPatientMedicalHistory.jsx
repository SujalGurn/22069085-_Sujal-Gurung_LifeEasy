// In your ViewPatientMedicalHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ViewPatientMedicalHistory = () => {
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { patientId } = useParams();

    useEffect(() => {
        const fetchMedicalHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                let apiUrl = '/api/patient/medical-history'; // Default for logged-in patient

                // If a patientId is present in the URL (doctor viewing), fetch for that patient
                if (patientId) {
                    apiUrl = `/api/patients/${patientId}/history`;
                }

                const response = await axios.get(apiUrl, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setMedicalHistory(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch medical history');
                }
            } catch (error) {
                setError(error.response?.data?.message || 'Error fetching medical history');
            } finally {
                setLoading(false);
            }
        };

        fetchMedicalHistory();
    }, [patientId]);

    if (loading) {
        return <div>Loading medical history...</div>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    if (medicalHistory.length === 0) {
        return <p>No medical history recorded yet.</p>;
    }

    return (
        <div>
            <h2>Your Medical History</h2>
            <ul>
                {medicalHistory.map((record) => (
                    <li key={record.id}>
                        <p><strong>Recorded At:</strong> {new Date(record.recorded_at).toLocaleString()}</p>
                        {record.blood_pressure && <p><strong>Blood Pressure:</strong> {record.blood_pressure}</p>}
                        {record.medication && <p><strong>Medication:</strong> {record.medication}</p>}
                        {record.allergies && <p><strong>Allergies:</strong> {record.allergies}</p>}
                        {record.weight && <p><strong>Weight:</strong> {record.weight} kg</p>}
                        {record.height && <p><strong>Height:</strong> {record.height} cm</p>}
                        {record.medical_condition && <p><strong>Medical Condition:</strong> {record.medical_condition}</p>}
                        {record.diagnosis && <p><strong>Diagnosis:</strong> {record.diagnosis}</p>}
                        {record.treatment && <p><strong>Treatment:</strong> {record.treatment}</p>}
                        {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                        {record.report_name && <p><strong>Report:</strong> {record.report_name}</p>}
                        {record.report_path && (
                            <p>
                                <strong>Report File:</strong>
                                <a href={record.report_path} target="_blank" rel="noopener noreferrer">
                                    View Report
                                </a>
                            </p>
                        )}
                        <hr />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ViewPatientMedicalHistory;