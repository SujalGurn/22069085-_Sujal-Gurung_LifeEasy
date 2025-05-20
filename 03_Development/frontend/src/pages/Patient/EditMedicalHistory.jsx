// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useParams } from 'react-router-dom'; // Assuming you use React Router

// const EditMedicalHistory = () => {
//     const { historyId } = useParams();
//     const [formData, setFormData] = useState({
//         blood_pressure: '',
//         medication: '',
//         allergies: '',
//         weight: '',
//         height: '',
//         medical_condition: '',
//         diagnosis: '',
//         treatment: '',
//         notes: '',
//         report_date: '',
//         report_type: '',
//         report_notes: '',
//         existing_report_name: '',
//         existing_report_path: '',
//     });
//     const [reportFile, setReportFile] = useState(null);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         const fetchMedicalHistory = async () => {
//             try {
//                 const token = localStorage.getItem('token');
//                 const response = await axios.get(`/api/history/${historyId}`, {
//                     headers: { Authorization: `Bearer ${token}` },
//                 });
//                 if (response.data) {
//                     setFormData(response.data);
//                 } else {
//                     setError('Medical history not found');
//                 }
//             } catch (error) {
//                 setError(error.response?.data?.message || 'Error fetching medical history');
//             }
//         };

//         fetchMedicalHistory();
//     }, [historyId]);

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleFileChange = (e) => {
//         setReportFile(e.target.files[0]);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');
//         setSuccess('');

//         const formDataToSend = new FormData();
//         for (const key in formData) {
//             formDataToSend.append(key, formData[key]);
//         }
//         if (reportFile) {
//             formDataToSend.append('report', reportFile);
//         }

//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.put(`/api/history/${historyId}`, formDataToSend, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                     Authorization: `Bearer ${token}`,
//                 },
//             });

//             if (response.data.success) {
//                 setSuccess('Medical history updated successfully!');
//                 // Optionally redirect or update the list
//             } else {
//                 setError(response.data.message || 'Failed to update medical history');
//             }
//         } catch (error) {
//             setError(error.response?.data?.message || 'Error updating medical history');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div>
//             <h2>Edit Medical History ID: {historyId}</h2>
//             {error && <p style={{ color: 'red' }}>{error}</p>}
//             {success && <p style={{ color: 'green' }}>{success}</p>}
//             <form onSubmit={handleSubmit}>
//                 {/* ... Input fields for blood_pressure, medication, allergies, etc. using handleChange and pre-filled with formData */}
//                 <div>
//                     <label htmlFor="report">Upload New Report (Optional):</label>
//                     <input type="file" id="report" name="report" onChange={handleFileChange} />
//                     {formData.report_name && <p>Current Report: {formData.report_name}</p>}
//                 </div>
//                 <div>
//                     <label htmlFor="report_date">Report Date:</label>
//                     <input type="date" id="report_date" name="report_date" value={formData.report_date} onChange={handleChange} />
//                 </div>
//                 <div>
//                     <label htmlFor="report_type">Report Type:</label>
//                     <input type="text" id="report_type" name="report_type" value={formData.report_type} onChange={handleChange} />
//                 </div>
//                 <div>
//                     <label htmlFor="report_notes">Report Notes:</label>
//                     <textarea id="report_notes" name="report_notes" value={formData.report_notes} onChange={handleChange} />
//                 </div>
//                 <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update History'}</button>
//             </form>
//         </div>
//     );
// };

// export default EditMedicalHistory;