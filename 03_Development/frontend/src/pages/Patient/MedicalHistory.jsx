import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const MedicalHistoryPage = () => {
    const [histories, setHistories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [formData, setFormData] = useState({
        patientId: '',
        bloodPressure: '',
        weight: '',
        height: '',
        medication: '',
        allergies: '',
        report: null,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            if (decoded.role !== 'admin' && decoded.role !== 'doctor') {
                setError('Access denied: Only admins or doctors can view all medical history.');
                return;
            }
        } else {
            setError('Please log in to access this page.');
            return;
        }

        fetchHistories();
    }, []);

    const fetchHistories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/medical-history', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.data.success) {
                setHistories(res.data.data || []);
            } else {
                setError(res.data.message || 'Failed to fetch medical history');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching medical history');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'report') {
            setFormData({ ...formData, report: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to submit medical history.');
            return;
        }

        const payload = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] && key !== 'report') {
                payload.append(key, formData[key]);
            }
        });
        if (formData.report) {
            payload.append('report', formData.report);
        }

        try {
            if (selectedHistory) {
                await axios.put(`/api/history/${selectedHistory.id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await axios.post(`/api/patients/${formData.patientId}/history`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            setShowModal(false);
            setFormData({
                patientId: '',
                bloodPressure: '',
                weight: '',
                height: '',
                medication: '',
                allergies: '',
                report: null,
            });
            setSelectedHistory(null);
            fetchHistories();
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving medical history');
            console.error('Upload error:', err);
        }
    };

    const handleEdit = (history) => {
        setSelectedHistory(history);
        setFormData({
            patientId: history.patient_id,
            bloodPressure: history.blood_pressure || '',
            weight: history.weight || '',
            height: history.height || '',
            medication: history.medication || '',
            allergies: history.allergies || '',
            report: null,
        });
        setShowModal(true);
    };

    const handleViewReport = async (filename) => {
        try {
            const token = localStorage.getItem('token');
            const baseFilename = filename.split('/').pop();
            const response = await axios.get(`/api/reports/${baseFilename}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const win = window.open(url, '_blank');

            setTimeout(() => {
                if (win) win.close();
                window.URL.revokeObjectURL(url);
            }, 60000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to view report.');
        }
    };

    if (error) {
        return (
            <div className="p-6 text-red-500 text-xl font-semibold">{error}</div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Medical History Records</h1>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setSelectedHistory(null);
                        setFormData({
                            patientId: '',
                            bloodPressure: '',
                            weight: '',
                            height: '',
                            medication: '',
                            allergies: '',
                            report: null,
                        });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                    Add Record
                </button>
            </div>

            <table className="w-full table-auto border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border">Patient ID</th>
                        <th className="p-2 border">Blood Pressure</th>
                        <th className="p-2 border">Weight</th>
                        <th className="p-2 border">Height</th>
                        <th className="p-2 border">Medication</th>
                        <th className="p-2 border">Allergies</th>
                        <th className="p-2 border">Report</th>
                        <th className="p-2 border">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {histories.map((h) => (
                        <tr key={h.id}>
                            <td className="border p-2">{h.patient_id}</td>
                            <td className="border p-2">{h.blood_pressure}</td>
                            <td className="border p-2">{h.weight}</td>
                            <td className="border p-2">{h.height}</td>
                            <td className="border p-2">{h.medication}</td>
                            <td className="border p-2">{h.allergies}</td>
                            <td className="border p-2">
                                {h.report_name ? (
                                    <button
                                        onClick={() => handleViewReport(h.report_path)}
                                        className="text-blue-600 underline"
                                    >
                                        {h.report_name}
                                    </button>
                                ) : (
                                    'No File'
                                )}
                            </td>
                            <td className="border p-2">
                                <button
                                    className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 text-sm rounded"
                                    onClick={() => handleEdit(h)}
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
                        <h2 className="text-lg font-semibold mb-4">
                            {selectedHistory ? 'Edit Medical History' : 'Add Medical History'}
                        </h2>
                        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-3">
                            <input
                                type="text"
                                name="patientId"
                                placeholder="Patient ID"
                                value={formData.patientId}
                                onChange={handleInputChange}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="text"
                                name="bloodPressure"
                                placeholder="Blood Pressure"
                                value={formData.bloodPressure}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="text"
                                name="weight"
                                placeholder="Weight (kg)"
                                value={formData.weight}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="text"
                                name="height"
                                placeholder="Height (cm)"
                                value={formData.height}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="text"
                                name="medication"
                                placeholder="Medication"
                                value={formData.medication}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="text"
                                name="allergies"
                                placeholder="Allergies"
                                value={formData.allergies}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="file"
                                name="report"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleInputChange}
                                className="w-full"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                >
                                    {selectedHistory ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalHistoryPage;