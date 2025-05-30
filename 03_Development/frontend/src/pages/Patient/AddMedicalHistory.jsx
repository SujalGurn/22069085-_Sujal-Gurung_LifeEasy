// frontend/src/pages/Patient/AddMedicalHistory.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AddMedicalHistory = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    blood_pressure: '',
    medication: '',
    allergies: '',
    weight: '',
    height: '',
    medical_condition: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    report_date: '',
    report_type: '',
    report_notes: '',
  });
  const [reportFile, setReportFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setReportFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formDataToSend = new FormData();
    formDataToSend.append('patient_id', patientId);
    for (const key in formData) {
      formDataToSend.append(key, formData[key]);
    }
    if (reportFile) {
      formDataToSend.append('report', reportFile);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/patients/${patientId}/history`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setSuccess('Medical history added successfully!');
        setFormData({
          blood_pressure: '',
          medication: '',
          allergies: '',
          weight: '',
          height: '',
          medical_condition: '',
          diagnosis: '',
          treatment: '',
          notes: '',
          report_date: '',
          report_type: '',
          report_notes: '',
        });
        setReportFile(null);
        // Optionally navigate back or show a message
        setTimeout(() => {
          navigate(`/patients/${patientId}/medical-history`); // Navigate back to patient's history
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to add medical history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding medical history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white-200 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-2xl font-semibold text-black-100 mb-4">Add Medical History</h2>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {success && <p className="text-green-400 mb-4">{success}</p>}
      <p className="text-gray-700 mb-4">Patient ID: <span className="font-medium">{patientId}</span></p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Blood Pressure', name: 'blood_pressure' },
          { label: 'Medication', name: 'medication' },
          { label: 'Allergies', name: 'allergies' },
          { label: 'Weight (kg)', name: 'weight' },
          { label: 'Height (cm)', name: 'height' },
          { label: 'Medical Condition', name: 'medical_condition' },
          { label: 'Diagnosis', name: 'diagnosis' },
          { label: 'Treatment', name: 'treatment' },
          { label: 'Notes', name: 'notes', type: 'textarea' },
          { label: 'Report Date', name: 'report_date', type: 'date' },
          { label: 'Report Type', name: 'report_type' },
          { label: 'Report Notes', name: 'report_notes', type: 'textarea' },
        ].map(({ label, name, type = 'text' }) => (
          <div key={name}>
            <label htmlFor={name} className="block text-black-300 text-sm mb-1">{label}:</label>
            {type === 'textarea' ? (
              <textarea
                id={name}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
              />
            ) : (
              <input
                id={name}
                name={name}
                type={type}
                value={formData[name]}
                onChange={handleChange}
                className="w-full bg-offwhite-700 text-black p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            )}
          </div>
        ))}

        <div className="md:col-span-2">
          <label htmlFor="report" className="block text-gray-300 text-sm mb-1">Upload Report:</label>
          <input
            type="file"
            id="report"
            name="report"
            onChange={handleFileChange}
            className="w-full text-white file:bg-white-700 file:border file:border-gray-600 file:rounded-md file:px-3 file:py-1 file:text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
          >
            {loading ? 'Adding...' : 'Add Medical History'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddMedicalHistory;