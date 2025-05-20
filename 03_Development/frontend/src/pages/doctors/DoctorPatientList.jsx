// DoctorPatientList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext'; // Adjust the import path as needed

function DoctorPatientList() {
    const [patients, setPatients] = useState([]);
    const [editingPatient, setEditingPatient] = useState(null);
    const { userData } = useContext(UserContext); // Get user data to check role
    const navigate = useNavigate();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await fetch('/api/patients', { // Assuming this endpoint fetches all patients
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                setPatients(data.patients);
            } else {
                console.error('Failed to fetch patients:', data.message || 'Unknown error');
                // Optionally display an error message to the user
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            // Optionally display an error message to the user
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/patients/${editingPatient.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    fullname: editingPatient.fullname,
                    email: editingPatient.email,
                    contact: editingPatient.contact
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update patient');
            }

            setEditingPatient(null);
            fetchPatients();
        } catch (error) {
            console.error('Update failed:', error);
            alert(error.message); // Show error message to user
        }
    };

    return (
        <div className="flex-1 overflow-auto ">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-#f8f5ee-800 bg-opacity-50 backdrop-blur-md"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search patients..."
                                className="bg-#1D2366-700 text-black placeholder-gray-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                // Add search functionality here
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-#14467c-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-#14467c-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-#14467c-400 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-#14467c-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-#14467c-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {patients.map(patient => (
                                    <motion.tr
                                        key={patient.id}
                                        className="hover:bg-white transition-colors"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                                                        {patient.fullname.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-#14467c-100">{patient.fullname}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-#14467c-300">{patient.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-#14467c-300">{patient.contact}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-800 text-green-100">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-#14467c-300">
                                            {userData && userData.role === 'admin' && (
                                                <button
                                                    onClick={() => setEditingPatient(patient)}
                                                    className="text-indigo-400 hover:text-indigo-300 mr-2"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {userData && (userData.role === 'doctor' || userData.role === 'admin') && (
                                                <Link
                                                    to={`/patients/${patient.id}/add-medical-history`}
                                                    className="text-green-400 hover:text-green-300"
                                                >
                                                    Add Medical History
                                                </Link>
                                            )}
                                            {userData && (userData.role === 'doctor' || userData.role === 'admin') && (
                                                <Link
                                                    to={`/patients/${patient.id}/medical-history`}
                                                    className="text-blue-400 hover:text-blue-300 ml-2"
                                                >
                                                    View History
                                                </Link>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Edit Modal */}
                    {editingPatient && userData && userData.role === 'admin' && (
                        <div className="fixed z-10 inset-0 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
                            <motion.form
                                onSubmit={handleUpdate}
                                className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-700"
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                            >
                                <h3 className="text-xl font-semibold mb-4 text-gray-100">Edit Patient</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                        <input
                                            value={editingPatient.fullname}
                                            onChange={e => setEditingPatient({ ...editingPatient, fullname: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editingPatient.email}
                                            onChange={e => setEditingPatient({ ...editingPatient, email: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Contact</label>
                                        <input
                                            value={editingPatient.contact}
                                            onChange={e => setEditingPatient({ ...editingPatient, contact: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPatient(null)}
                                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </motion.form>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

export default DoctorPatientList;