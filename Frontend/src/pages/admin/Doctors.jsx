import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit, XCircle, CheckCircle, FileText, User } from 'lucide-react';

// Color Constants
const COLORS = {
  primary: '#2C3E50',         // Dark Blue-Gray
  secondary: '#3498DB',       // Soft Blue
  accent: '#27AE60',          // Fresh Green
  background: '#F8F9FA',      // Light Gray
  error: '#E74C3C',           // Alert Red
  text: '#2C3E50',            // Primary Text
  lightText: '#95A5A6'        // Secondary Text
};
const Doctors = () => {
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [approvedDoctors, setApprovedDoctors] = useState([]);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState(null);
    const [editedDoctor, setEditedDoctor] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editError, setEditError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                await fetchPendingDoctors();
                await fetchApprovedDoctors();
            } catch (err) {
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchPendingDoctors = async () => {
        try {
            const response = await axios.get('/api/admin/verifications/pending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Cache-Control': 'no-cache'
                }
            });
            setPendingDoctors(response.data.doctors || []);
        } catch (error) {
            setError('Failed to load pending verifications');
            setPendingDoctors([]);
        }
    };
    
    const fetchApprovedDoctors = async () => {
        try {
            const response = await axios.get('/api/admin/doctors', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setApprovedDoctors(response.data.doctors || []);
        } catch (error) {
            setError('Failed to load approved doctors');
            setApprovedDoctors([]);
        }
    };

    const handleApprove = async (doctorId) => {
        try {
            await axios.put(`/api/admin/verifications/approve/${doctorId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            fetchPendingDoctors();
        } catch (error) {
            setError('Approval failed. Please try again.');
        }
    };

    const handleReject = async (doctorId) => {
        try {
            await axios.put(`/api/admin/verifications/reject/${doctorId}`, { notes: rejectionNotes }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            fetchPendingDoctors();
            setRejectionNotes('');
            setSelectedDoctorId(null);
        } catch (error) {
            setError('Rejection failed. Please try again.');
        }
    };

    const handleEditClick = async (doctorId) => {
        try {
            const response = await axios.get(`/api/admin/doctors/${doctorId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (response.data.success) {
                setEditedDoctor(response.data.doctor);
                setShowEditModal(true);
                setEditError('');
            }
        } catch (error) {
            setEditError('Failed to load doctor details');
        }
    };

    const handleDoctorUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `/api/admin/doctors/${editedDoctor.id}`,
                editedDoctor,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            if (response.data.success) {
                setShowEditModal(false);
                fetchApprovedDoctors();
            }
        } catch (error) {
            setEditError(error.response?.data?.message || 'Failed to update doctor');
        }
    };

    return (
        <motion.div 
            className="p-6 md:p-8 max-w-7xl mx-auto"
            initial={{ opacity: 2 }}
            animate={{ opacity: 1 }}
        >
            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.error + '20', color: COLORS.error }}
                >
                    <span>{error}</span>
                    <button 
                        onClick={() => setError(null)}
                        style={{ color: COLORS.error }}
                    >
                        <XCircle size={20} />
                    </button>
                </motion.div>
            )}

            {/* Pending Verifications Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 bg-white rounded-xl p-6 shadow-sm border"
                style={{ borderColor: COLORS.primary + '20' }}
            >
                <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.primary }}>
                    Pending Verifications
                </h2>
                
                {pendingDoctors.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ backgroundColor: COLORS.background }}>
                                <tr>
                                    {['Doctor', 'License', 'Specialization', 'Documents', 'Actions'].map((header) => (
                                        <th 
                                            key={header}
                                            className="px-4 py-3 text-left text-sm font-medium"
                                            style={{ color: COLORS.text }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: COLORS.primary + '20' }}>
                                {pendingDoctors.map((doctor) => (
                                    <motion.tr
                                        key={doctor.doctor_id}
                                        className="hover:bg-gray-50"
                                        whileHover={{ scale: 1.005 }}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User size={16} style={{ color: COLORS.secondary }} />
                                                </div>
                                                <div className="ml-3">
                                                    <div style={{ color: COLORS.text }}>{doctor.fullname}</div>
                                                    <div className="text-sm" style={{ color: COLORS.lightText }}>
                                                        {doctor.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3" style={{ color: COLORS.text }}>
                                            {doctor.license_number}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: COLORS.text }}>
                                            {doctor.specialization}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-3">
                                                <a
                                                    href={doctor.certification_path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-sm hover:underline"
                                                    style={{ color: COLORS.secondary }}
                                                >
                                                    <FileText size={16} /> Certification
                                                </a>
                                                <a
                                                    href={doctor.id_proof_path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-sm hover:underline"
                                                    style={{ color: COLORS.secondary }}
                                                >
                                                    <FileText size={16} /> ID Proof
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(doctor.doctor_id)}
                                                    className="px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
                                                    style={{ 
                                                        backgroundColor: COLORS.accent + '20',
                                                        color: COLORS.accent
                                                    }}
                                                >
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => setSelectedDoctorId(doctor.doctor_id)}
                                                    className="px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
                                                    style={{ 
                                                        backgroundColor: COLORS.error + '20',
                                                        color: COLORS.error
                                                    }}
                                                >
                                                    <XCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6 text-center rounded-lg" style={{ backgroundColor: COLORS.background }}>
                        <span style={{ color: COLORS.lightText }}>No pending verifications found</span>
                    </div>
                )}
            </motion.section>

            {/* Approved Doctors Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border"
                style={{ borderColor: COLORS.primary + '20' }}
            >
                <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.primary }}>
                    Registered Doctors
                </h2>
                
                {approvedDoctors.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ backgroundColor: COLORS.background }}>
                                <tr>
                                    {['Doctor', 'Specialization', 'License', 'Status', 'Actions'].map((header) => (
                                        <th 
                                            key={header}
                                            className="px-4 py-3 text-left text-sm font-medium"
                                            style={{ color: COLORS.text }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: COLORS.primary + '20' }}>
                                {approvedDoctors.map((doctor) => (
                                    <motion.tr
                                        key={doctor.id}
                                        className="hover:bg-gray-50"
                                        whileHover={{ scale: 1.005 }}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User size={16} style={{ color: COLORS.secondary }} />
                                                </div>
                                                <div className="ml-3">
                                                    <div style={{ color: COLORS.text }}>{doctor.fullname}</div>
                                                    <div className="text-sm" style={{ color: COLORS.lightText }}>
                                                        {doctor.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3" style={{ color: COLORS.text }}>
                                            {doctor.specialization}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: COLORS.text }}>
                                            {doctor.license_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={{ 
                                                    backgroundColor: COLORS.accent + '20',
                                                    color: COLORS.accent
                                                }}>
                                                Approved
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleEditClick(doctor.id)}
                                                    className="hover:bg-blue-50 p-1.5 rounded"
                                                    style={{ color: COLORS.secondary }}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="hover:bg-red-50 p-1.5 rounded"
                                                    style={{ color: COLORS.error }}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6 text-center rounded-lg" style={{ backgroundColor: COLORS.background }}>
                        <span style={{ color: COLORS.lightText }}>No registered doctors found</span>
                    </div>
                )}
            </motion.section>

            {/* Rejection Modal */}
            {selectedDoctorId && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md"
                        style={{ borderColor: COLORS.primary + '20' }}
                    >
                        <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.primary }}>
                            Rejection Details
                        </h3>
                        <textarea
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            placeholder="Provide specific reasons for rejection..."
                            className="w-full p-3 rounded-lg border-2 focus:outline-none mb-4"
                            style={{
                                borderColor: COLORS.primary + '40',
                                color: COLORS.text
                            }}
                            rows="4"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedDoctorId(null)}
                                className="px-4 py-2 rounded-lg border-2"
                                style={{
                                    borderColor: COLORS.primary + '40',
                                    color: COLORS.text
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReject(selectedDoctorId)}
                                className="px-4 py-2 rounded-lg text-white"
                                style={{ backgroundColor: COLORS.error }}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md"
                        style={{ borderColor: COLORS.primary + '20' }}
                    >
                        <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.primary }}>
                            Edit Doctor Details
                        </h3>
                        
                        {editError && (
                            <div className="mb-4 p-3 rounded-lg text-sm"
                                style={{ 
                                    backgroundColor: COLORS.error + '20',
                                    color: COLORS.error
                                }}>
                                {editError}
                            </div>
                        )}

                        <form onSubmit={handleDoctorUpdate} className="space-y-4">
                            {['fullname', 'email', 'specialization', 'license_number'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium mb-1 capitalize"
                                        style={{ color: COLORS.text }}>
                                        {field.replace('_', ' ')}
                                    </label>
                                    <input
                                        type={field === 'email' ? 'email' : 'text'}
                                        value={editedDoctor?.[field] || ''}
                                        onChange={(e) => setEditedDoctor({
                                            ...editedDoctor,
                                            [field]: e.target.value
                                        })}
                                        className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                                        style={{
                                            borderColor: COLORS.primary + '40',
                                            color: COLORS.text
                                        }}
                                        required
                                    />
                                </div>
                            ))}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 rounded-lg border-2"
                                    style={{
                                        borderColor: COLORS.primary + '40',
                                        color: COLORS.text
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#14467c] text-white"
                                    
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default Doctors;