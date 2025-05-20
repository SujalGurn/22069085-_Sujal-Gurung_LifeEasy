import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit, XCircle, CheckCircle, FileText, User, Loader2 } from 'lucide-react';

// Color Constants
const COLORS = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#27AE60',
  background: '#F8F9FA',
  error: '#E74C3C',
  text: '#2C3E50',
  lightText: '#95A5A6'
};

const Doctors = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [rejectedDoctors, setRejectedDoctors] = useState([]); // Added missing state
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [editedDoctor, setEditedDoctor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Added for action feedback
  const [error, setError] = useState(null);
  const [editError, setEditError] = useState('');
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          fetchPendingDoctors(),
          fetchApprovedDoctors(),
          fetchRejectedDoctors(), // Added to fetch rejected doctors
        ]);
      } catch (err) {
        setError('Failed to load dashboard data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDocumentPreview = (docUrl) => {
    console.log("Previewing document:", docUrl);
    const cleanUrl = docUrl.replace(/kyc\/(?=kyc)/, '');
    setPreviewDocument(cleanUrl);
  };

  const fetchPendingDoctors = async () => {
    try {
      const response = await axios.get('/api/admin/verifications/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (response.data.success && Array.isArray(response.data.doctors)) {
        setPendingDoctors(response.data.doctors);
      } else {
        setPendingDoctors([]);
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to load pending verifications');
      setPendingDoctors([]);
    }
  };

  const fetchApprovedDoctors = async () => {
    try {
      const response = await axios.get('/api/admin/doctors/approved', {
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

  const fetchRejectedDoctors = async () => {
    try {
      const response = await axios.get('/api/admin/doctors/rejected', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRejectedDoctors(response.data.doctors || []);
    } catch (error) {
      setError('Failed to load rejected doctors');
      setRejectedDoctors([]);
    }
  };

  const renderDocumentsCell = (doctor) => (
    <div className="flex gap-3">
      <button
        onClick={() => handleDocumentPreview(doctor.certification_path)}
        className="flex items-center gap-1 text-sm hover:underline"
        style={{ color: COLORS.secondary }}
      >
        <FileText size={16} /> Certification
      </button>
      <button
        onClick={() => handleDocumentPreview(doctor.id_proof_path)}
        className="flex items-center gap-1 text-sm hover:underline"
        style={{ color: COLORS.secondary }}
      >
        <FileText size={16} /> ID Proof
      </button>
    </div>
  );

  const DocumentPreviewModal = () => {
    useEffect(() => {
      if (previewDocument) {
        window.open(previewDocument, '_blank', 'noopener,noreferrer');
      }
    }, [previewDocument]);

    return previewDocument && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: COLORS.primary }}>
              Document Preview
            </h3>
            <button onClick={() => setPreviewDocument(null)}>
              <XCircle size={24} color={COLORS.error} />
            </button>
          </div>
          <div className="text-center">
            <p style={{ color: COLORS.text }}>
              The document should have opened in a new tab.
            </p>
            <a 
              href={previewDocument} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-blue-500 underline text-center py-2"
            >
              Click here if it didn't open
            </a>
            <a 
              href={previewDocument} 
              download
              className="block text-blue-500 underline text-center py-2"
            >
              Download Document
            </a>
          </div>
        </div>
      </div>
    );
  };

  const handleApprove = async (doctorId) => {
    setActionLoading(true);
    try {
      await axios.put(`/api/admin/verifications/approve/${doctorId}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      await fetchPendingDoctors();
      await fetchApprovedDoctors();
    } catch (error) {
      setError('Approval failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (doctorId) => {
    if (!rejectionNotes.trim()) {
      setError('Rejection notes are required.');
      return;
    }
    setActionLoading(true);
    try {
      const response = await axios.put(
        `/api/admin/verifications/reject/${doctorId}`,
        { notes: rejectionNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      if (response.data.success) {
        await fetchPendingDoctors();
        await fetchRejectedDoctors();
        setSelectedDoctorId(null);
        setRejectionNotes('');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/admin/doctors/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setApprovedDoctors(approvedDoctors.filter(doctor => doctor.id !== doctorId));
      setRejectedDoctors(rejectedDoctors.filter(d => d.id !== doctorId));
      await fetchApprovedDoctors(); // Sync with server
      await fetchRejectedDoctors(); // Sync with server
    } catch (error) {
      setError('Failed to delete doctor. Please try again.');
    } finally {
      setActionLoading(false);
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
    setActionLoading(true);
    try {
      const response = await axios.put(
        `/api/admin/doctors/${editedDoctor.id}`,
        editedDoctor,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        setShowEditModal(false);
        await fetchApprovedDoctors();
      }
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update doctor');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div 
      className="p-6 md:p-8 max-w-7xl mx-auto"
      initial={{ opacity: 2 }}
      animate={{ opacity: 1 }}
    >
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

      {loading && (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin" size={40} color={COLORS.primary} />
        </div>
      )}

      {!loading && (
        <>
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
                          {renderDocumentsCell(doctor)}
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
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                              Approve
                            </button>
                            <button
                              onClick={() => setSelectedDoctorId(doctor.doctor_id)}
                              className="px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
                              style={{ 
                                backgroundColor: COLORS.error + '20',
                                color: COLORS.error
                              }}
                              disabled={actionLoading}
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

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-white rounded-xl p-6 shadow-sm border"
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
                              disabled={actionLoading}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(doctor.id)}
                              className="hover:bg-red-50 p-1.5 rounded"
                              style={{ color: COLORS.error }}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
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

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-white rounded-xl p-6 shadow-sm border"
            style={{ borderColor: COLORS.primary + '20' }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.primary }}>
              Rejected Applications
            </h2>
            {rejectedDoctors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: COLORS.background }}>
                    <tr>
                      {['Doctor', 'Specialization', 'License', 'Rejection Reason', 'Actions'].map((header) => (
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
                    {rejectedDoctors.map((doctor) => (
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
                        <td className="px-4 py-3" style={{ color: COLORS.text }}>
                          {doctor.verification_notes || 'No reason provided'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleDelete(doctor.id)}
                              className="hover:bg-red-50 p-1.5 rounded"
                              style={{ color: COLORS.error }}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
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
                <span style={{ color: COLORS.lightText }}>No rejected applications found</span>
              </div>
            )}
          </motion.section>
        </>
      )}

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
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Rejection'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <DocumentPreviewModal />
    </motion.div>
  );
};

export default Doctors;