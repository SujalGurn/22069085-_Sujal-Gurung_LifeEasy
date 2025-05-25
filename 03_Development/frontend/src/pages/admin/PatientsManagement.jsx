import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserContext } from '../../UserContext';

function PatientManagement() {
    const [patients, setPatients] = useState([]);
    const [editingPatient, setEditingPatient] = useState(null);
    const { userData } = useContext(UserContext);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await fetch('/api/admin/patients', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) setPatients(data.patients);
            else console.error('Failed to fetch patients:', data.message);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/admin/patients/${editingPatient.id}`, {
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
            if (!response.ok) throw new Error(data.message || 'Failed to update patient');

            setEditingPatient(null);
            fetchPatients();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="flex-1 overflow-auto">
            <main className="max-w-6xl mx-auto py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-md p-6"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative w-full max-w-sm">
                            <input
                                type="text"
                                placeholder="Search patients..."
                                className="w-full bg-gray-100 text-gray-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14467c]"
                            />
                            <Search className="absolute left-3 top-2.5 text-[#53b774]" size={18} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-[#f5f5f5] text-[#14467c]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Patient ID</th>
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Email</th>
                                    <th className="px-4 py-3 font-semibold">Contact</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {patients.map(patient => (
                                    <motion.tr
                                        key={patient.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-100 transition-colors"
                                    >
                                        <td className="px-4 py-3">{patient.id}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-[#53b774] text-white flex items-center justify-center font-bold">
                                                    {patient.fullname.charAt(0)}
                                                </div>
                                                <span>{patient.fullname}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{patient.email}</td>
                                        <td className="px-4 py-3">{patient.contact}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs font-medium bg-green-200 text-green-900 rounded-full">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 space-x-2">
                                            {userData?.role === 'admin' && (
                                                <button
                                                    onClick={() => setEditingPatient(patient)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {(userData?.role === 'admin' || userData?.role === 'doctor') && (
                                                <Link
                                                    to={`/patients/${patient.id}/add-medical-history`}
                                                    className="text-green-600 hover:underline"
                                                >
                                                    Add History
                                                </Link>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Edit Modal */}
                    {editingPatient && userData?.role === 'admin' && (
                        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center">
                            <motion.form
                                onSubmit={handleUpdate}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl space-y-4"
                            >
                                <h2 className="text-xl font-semibold text-gray-800">Edit Patient</h2>

                                <div>
                                    <label className="text-sm text-gray-600">Full Name</label>
                                    <input
                                        value={editingPatient.fullname}
                                        onChange={e => setEditingPatient({ ...editingPatient, fullname: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#14467c]"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">Email</label>
                                    <input
                                        type="email"
                                        value={editingPatient.email}
                                        onChange={e => setEditingPatient({ ...editingPatient, email: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#14467c]"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">Contact</label>
                                    <input
                                        value={editingPatient.contact}
                                        onChange={e => setEditingPatient({ ...editingPatient, contact: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#14467c]"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPatient(null)}
                                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg bg-[#14467c] text-white hover:bg-[#123c6b]"
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

export default PatientManagement;