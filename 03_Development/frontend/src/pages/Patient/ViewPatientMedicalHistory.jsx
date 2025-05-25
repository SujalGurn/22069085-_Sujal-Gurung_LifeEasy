import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import '../../style/medicalHistory.css';
import Footer from '../../components/Footer';

const ViewPatientMedicalHistory = () => {
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { patientId } = useParams();

    useEffect(() => {
        const fetchMedicalHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                let apiUrl = '/api/patient/medical-history';

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
const handleViewReport = async (filename) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to view the report.');
            return;
        }

        const baseFilename = filename.split('/').pop();
        console.log('Fetching report:', baseFilename);

        const response = await axios.get(`/api/reports/${baseFilename}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const win = window.open(url, '_blank');

        setTimeout(() => {
            if (win) win.close();
            window.URL.revokeObjectURL(url);
        }, 10000);
    } catch (error) {
        console.error('Error viewing report:', error);
        const errorMessage = error.response?.data?.message || 'Failed to view report. Please try again.';
        setError(errorMessage);
    }
};

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f5ee]">
                <Loader className="animate-spin h-12 w-12 text-[#14467c]" />
                <span className="mt-4 text-[#14467c] text-lg">Loading medical history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f5ee]">
                <p className="text-red-500 text-xl font-semibold">{error}</p>
            </div>
        );
    }

    if (medicalHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f5ee]">
                <p className="text-[#14467c] text-lg">No medical history recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f5ee] py-12 px-4">
            <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-3xl p-8">
                <h2 className="text-4xl font-extrabold text-[#14467c] text-center mb-8">Medical History</h2>
                <div className="space-y-8">
                    {medicalHistory.map((record) => (
                        <div key={record.id} className="bg-[#ffffff] p-6 rounded-lg shadow-md space-y-4">
                            <p className="font-semibold text-lg"><strong>Recorded At:</strong> {new Date(record.recorded_at).toLocaleString()}</p>
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
                                <button
                                    onClick={() => handleViewReport(record.report_path)}
                                    className="view-report-btn bg-[#14467c] text-white px-4 py-2 rounded hover:bg-[#f9cc48]"
                                >
                                    View Report
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ViewPatientMedicalHistory;