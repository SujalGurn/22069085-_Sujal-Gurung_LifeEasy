import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BedManagement = () => {
    const [beds, setBeds] = useState([]);
    const [formData, setFormData] = useState({
        bed_number: '',
        room_number: '',
        room_type: 'general',
        status: 'available',
        notes: '',
    });
    const [assignData, setAssignData] = useState({
        patient_id: '',
        admission_date: '',
    });
    const [filters, setFilters] = useState({
        status: '',
        room_type: '',
        room_number: '',
    });
    const [editingBedId, setEditingBedId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBeds();
    }, [filters]);

    const fetchBeds = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.room_type) params.room_type = filters.room_type;
            if (filters.room_number) params.room_number = filters.room_number;

            const res = await axios.get('/api/beds', {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            if (res.data.success) {
                setBeds(res.data.data || []);
            } else {
                setError(res.data.message || 'Failed to fetch beds');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching beds');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAssignChange = (e) => {
        setAssignData({ ...assignData, [e.target.name]: e.target.value });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const token = localStorage.getItem('token');
        try {
            if (editingBedId) {
                const res = await axios.put(`/api/beds/${editingBedId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success) {
                    toast.success('Bed updated successfully!');
                    setEditingBedId(null);
                    setFormData({ bed_number: '', room_number: '', room_type: 'general', status: 'available', notes: '' });
                    fetchBeds();
                } else {
                    setError(res.data.message || 'Failed to update bed');
                }
            } else {
                const res = await axios.post('/api/beds', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success) {
                    toast.success('Bed added successfully!');
                    setFormData({ bed_number: '', room_number: '', room_type: 'general', status: 'available', notes: '' });
                    fetchBeds();
                } else {
                    setError(res.data.message || 'Failed to add bed');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving bed');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSubmit = async (bedId) => {
        setError('');
        setLoading(true);

        // Validate assignData
        if (!assignData.patient_id || isNaN(assignData.patient_id)) {
            setError('Please provide a valid Patient ID');
            setLoading(false);
            return;
        }
        if (!assignData.admission_date) {
            setError('Please select an admission date');
            setLoading(false);
            return;
        }

        // Format admission_date to ISO 8601
        const formattedAdmissionDate = new Date(assignData.admission_date).toISOString();
        const payload = {
            patient_id: parseInt(assignData.patient_id, 10),
            admission_date: formattedAdmissionDate,
        };

        console.log('Assign bed payload:', payload);

        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(`/api/beds/${bedId}/assign`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                toast.success('Bed assigned successfully!');
                setAssignData({ patient_id: '', admission_date: '' });
                fetchBeds();
            } else {
                setError(res.data.message || 'Failed to assign bed');
            }
        } catch (err) {
            console.error('Assign bed error:', err.response?.data);
            setError(err.response?.data?.message || 'Error assigning bed');
        } finally {
            setLoading(false);
        }
    };

    const handleDischarge = async (bedId) => {
        setError('');
        setLoading(true);

        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(`/api/beds/${bedId}/discharge`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                toast.success('Patient discharged successfully!');
                fetchBeds();
            } else {
                setError(res.data.message || 'Failed to discharge patient');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error discharging patient');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (bedId) => {
        if (!window.confirm('Are you sure you want to delete this bed?')) return;

        setError('');
        setLoading(true);

        const token = localStorage.getItem('token');
        try {
            const res = await axios.delete(`/api/beds/${bedId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                toast.success('Bed deleted successfully!');
                fetchBeds();
            } else {
                setError(res.data.message || 'Failed to delete bed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error deleting bed');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (bed) => {
        setFormData({
            bed_number: bed.bed_number,
            room_number: bed.room_number,
            room_type: bed.room_type,
            status: bed.status,
            notes: bed.notes || '',
        });
        setEditingBedId(bed.id);
    };

    return (
        <motion.div
            className="bg-white-200 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            {error && <p className="text-red-400 mb-4">{error}</p>}

            {/*   Bed Form */}
            <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="bed_number" className="block text-black-300 text-sm mb-1">Bed Number:</label>
                    <input
                        id="bed_number"
                        name="bed_number"
                        type="text"
                        value={formData.bed_number}
                        onChange={handleInputChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="room_number" className="block text-black-300 text-sm mb-1">Room Number:</label>
                    <input
                        id="room_number"
                        name="room_number"
                        type="text"
                        value={formData.room_number}
                        onChange={handleInputChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="room_type" className="block text-black-300 text-sm mb-1">Room Type:</label>
                    <select
                        id="room_type"
                        name="room_type"
                        value={formData.room_type}
                        onChange={handleInputChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="general">General</option>
                        <option value="icu">ICU</option>
                        <option value="private">Private</option>
                        <option value="ward">Ward</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-black-300 text-sm mb-1">Status:</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="reserved">Reserved</option>
                        <option value="cleaning">Cleaning</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-black-300 text-sm mb-1">Notes:</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                </div>
                <div className="md:col-span-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#14467c] hover:bg-[#195aa0] text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : editingBedId ? 'Update Bed' : 'Add Bed'}
                    </button>
                </div>
            </form>

            {/* Filters */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="filter_status" className="block text-black-300 text-sm mb-1">Filter by Status:</label>
                    <select
                        id="filter_status"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="reserved">Reserved</option>
                        <option value="cleaning">Cleaning</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="filter_room_type" className="block text-black-300 text-sm mb-1">Filter by Room Type:</label>
                    <select
                        id="filter_room_type"
                        name="room_type"
                        value={filters.room_type}
                        onChange={handleFilterChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All</option>
                        <option value="general">General</option>
                        <option value="icu">ICU</option>
                        <option value="private">Private</option>
                        <option value="ward">Ward</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="filter_room_number" className="block text-black-300 text-sm mb-1">Filter by Room Number:</label>
                    <input
                        id="filter_room_number"
                        name="room_number"
                        type="text"
                        value={filters.room_number}
                        onChange={handleFilterChange}
                        className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Beds Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white-200 rounded-md">
                    <thead>
                        <tr className="bg-gray-700 text-white">
                            <th className="py-2 px-4">Bed Number</th>
                            <th className="py-2 px-4">Room Number</th>
                            <th className="py-2 px-4">Room Type</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4">Patient ID</th>
                            <th className="py-2 px-4">Admission Date</th>
                            <th className="py-2 px-4">Discharge Date</th>
                            <th className="py-2 px-4">Notes</th>
                            <th className="py-2 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {beds.map((bed) => (
                            <tr key={bed.id} className="border-b">
                                <td className="py-2 px-4">{bed.bed_number}</td>
                                <td className="py-2 px-4">{bed.room_number}</td>
                                <td className="py-2 px-4">{bed.room_type}</td>
                                <td className="py-2 px-4">{bed.status}</td>
                                <td className="py-2 px-4">{bed.patient_id || '-'}</td>
                                <td className="py-2 px-4">{bed.admission_date ? new Date(bed.admission_date).toLocaleDateString() : '-'}</td>
                                <td className="py-2 px-4">{bed.discharge_date ? new Date(bed.discharge_date).toLocaleDateString() : '-'}</td>
                                <td className="py-2 px-4">{bed.notes || '-'}</td>
                                <td className="py-2 px-4 flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(bed)}
                                        className="bg-yellow-600 hover:bg-yellow-500 text-white py-1 px-2 rounded-md"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(bed.id)}
                                        className="bg-red-600 hover:bg-red-500 text-white py-1 px-2 rounded-md"
                                        disabled={bed.status === 'occupied'}
                                    >
                                        Delete
                                    </button>
                                    {bed.status === 'available' && (
                                        <div className="flex flex-col space-y-2">
                                            <input
                                                type="number"
                                                name="patient_id"
                                                placeholder="Patient ID"
                                                value={assignData.patient_id}
                                                onChange={handleAssignChange}
                                                className="bg-offwhite-700 text-black p-1 rounded-md border border-gray-600"
                                                min="1"
                                            />
                                            <input
                                                type="date"
                                                name="admission_date"
                                                value={assignData.admission_date}
                                                onChange={handleAssignChange}
                                                className="bg-offwhite-700 text-black p-1 rounded-md border border-gray-600"
                                            />
                                            <button
                                                onClick={() => handleAssignSubmit(bed.id)}
                                                className="bg-[#14467c] hover:bg-[#1a5a9f] text-white py-1 px-2 rounded-md"
                                                disabled={loading}
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    )}
                                    {bed.status === 'occupied' && (
                                        <button
                                            onClick={() => handleDischarge(bed.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white py-1 px-2 rounded-md"
                                        >
                                            Discharge
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default BedManagement;