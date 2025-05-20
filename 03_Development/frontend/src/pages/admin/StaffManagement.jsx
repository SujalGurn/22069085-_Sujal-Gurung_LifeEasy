import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../UserContext';
import { motion } from 'framer-motion';
import { Edit, Trash2, UserPlus, Search } from 'lucide-react';

const COLORS = {
    primary: '#1D2366',         // Dark Blue-Gray
    secondary: '#3498DB',       // Soft Blue
    accent: '#27AE60',          // Fresh Green
    background: '#F8F9FA',      // Light Gray
    error: '#E74C3C',           // Alert Red
    text: '#2C3E50',            // Primary Text
    lightText: '#95A5A6'        // Secondary Text
  };
  
const StaffManagement = () => {
    const { userData, isAdmin, loading } = useContext(UserContext);
    console.log("StaffManagement rendered. isAdmin:", isAdmin, "loading:", loading);

    const [staffList, setStaffList] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        address: '',
        email: '',
        role: 'staff',
        department: '',
        shift: 'morning',
        contact_number: '',
        specialization: ''
    });
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [localLoading, setLocalLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isAdmin) {
            fetchStaff();
        }
    }, [isAdmin]);

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3002/api/admin/staff', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setStaffList(response.data.data);
        } catch (err) {
            setError('Failed to fetch staff list');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLocalLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:3002/api/admin/staff', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setSuccess('Staff member added successfully!');
                setFormData({
                    full_name: '',
                    address: '',
                    email: '',
                    role: 'staff',
                    department: '',
                    shift: 'morning',
                    contact_number: '',
                    specialization: ''
                });
                fetchStaff();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add staff member');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEdit = (staff) => {
        setEditingStaffId(staff.id);
        setEditFormData({ ...staff });
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async (id) => {
        setError('');
        setSuccess('');
        setLocalLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`http://localhost:3002/api/admin/staff/${id}`, editFormData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setSuccess('Staff member updated successfully!');
                setEditingStaffId(null);
                fetchStaff();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update staff member');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingStaffId(null);
        setEditFormData({});
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            setError('');
            setSuccess('');
            setLocalLoading(true);

            try {
                const token = localStorage.getItem('token');
                const response = await axios.delete(`http://localhost:3002/api/admin/staff/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setSuccess('Staff member deleted successfully!');
                    fetchStaff();
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete staff member');
            } finally {
                setLocalLoading(false);
            }
        }
    };

    if (loading) {
        return <div>Loading staff list...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="text-center text-red-600 text-lg font-semibold mt-10">
                Admin access required
            </div>
        );
    }
    return (
        <motion.div 
            className="p-6 md:p-8 max-w-7xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header Section */}
            <div className="mb-8">
                
                
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3" size={20} color={COLORS.lightText} />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none"
                        style={{
                            border: `2px solid ${COLORS.primary}20`,
                            backgroundColor: 'white',
                            color: COLORS.text
                        }}
                    />
                </div>
            </div>

            {/* Add Staff Form */}
            <motion.form 
                onSubmit={handleSubmit}
                className="bg-white rounded-xl p-6 mb-8 shadow-sm border"
                style={{ borderColor: COLORS.primary + '20' }}
            >
                <h2 className="text-xl font-semibold mb-4" style={{ color: COLORS.primary }}>
                    Add New Staff Member
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                    {['full_name', 'email', 'department', 'contact_number'].map((field) => (
                        <div key={field} className="space-y-1">
                            <label className="text-sm font-medium" style={{ color: COLORS.text }}>
                                {field.replace('_', ' ').toUpperCase()} *
                            </label>
                            <input
                                type={field === 'email' ? 'email' : 'text'}
                                name={field}
                                value={formData[field]}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border-2 focus:ring-2"
                                style={{
                                    borderColor: COLORS.primary + '40',
                                    backgroundColor: '#ffffff',
                                    color: COLORS.text,
                                }}
                                required
                            />
                        </div>
                    ))}

                    {/* Role and Shift Selectors */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium" style={{ color: COLORS.text }}>
                            ROLE *
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border-2"
                            style={{
                                borderColor: COLORS.primary + '40',
                                color: COLORS.text,
                            }}
                        >
                            <option value="staff">General Staff</option>
                            <option value="nurse">Nurse</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium" style={{ color: COLORS.text }}>
                            SHIFT *
                        </label>
                        <select
                            name="shift"
                            value={formData.shift}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border-2"
                            style={{
                                borderColor: COLORS.primary + '40',
                                color: COLORS.text,
                            }}
                        >
                            <option value="morning">Morning (8AM - 4PM)</option>
                            <option value="evening">Evening (4PM - 12AM)</option>
                            <option value="night">Night (12AM - 8AM)</option>
                        </select>
                    </div>

                    {/* Specialization */}
                    {formData.role === 'nurse' && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium" style={{ color: COLORS.text }}>
                                SPECIALIZATION
                            </label>
                            <input
                                type="text"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border-2"
                                style={{
                                    borderColor: COLORS.primary + '40',
                                    color: COLORS.text,
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="mt-6 flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={localLoading}
                        className="px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all"
                        style={{
                            backgroundColor: localLoading ? COLORS.lightText : COLORS.primary,
                            color: 'white',
                        }}
                    >
                        <UserPlus size={18} />
                        {localLoading ? 'Adding...' : 'Add Staff'}
                    </button>
                    {error && <span className="text-sm" style={{ color: COLORS.error }}>{error}</span>}
                    {success && <span className="text-sm" style={{ color: COLORS.accent }}>{success}</span>}
                </div>
            </motion.form>

            {/* Staff List Table */}
            <motion.div 
                className="bg-white rounded-xl shadow-sm overflow-hidden border"
                style={{ borderColor: COLORS.primary + '20' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <table className="w-full">
                    <thead style={{ backgroundColor: COLORS.background }}>
                        <tr>
                            {['NAME', 'ROLE', 'DEPARTMENT', 'SHIFT', 'CONTACT', 'ACTIONS'].map((header) => (
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
                        {staffList.map((staff) => (
                            <motion.tr 
                                key={staff.id}
                                className="hover:bg-gray-50"
                                whileHover={{ scale: 1.005 }}
                            >
                                {editingStaffId === staff.id ? (
                                    // Edit Mode
                                    <EditRow 
                                        editFormData={editFormData}
                                        handleEditChange={handleEditChange}
                                        handleSaveEdit={() => handleSaveEdit(staff.id)}
                                        handleCancelEdit={handleCancelEdit}
                                        colors={COLORS}
                                    />
                                ) : (
                                    // Display Mode
                                    <>
                                        <td className="px-4 py-3 font-medium" style={{ color: COLORS.text }}>
                                            {staff.full_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span 
                                                className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: staff.role === 'nurse' 
                                                        ? COLORS.accent + '20' 
                                                        : COLORS.secondary + '20',
                                                    color: staff.role === 'nurse' 
                                                        ? COLORS.accent 
                                                        : COLORS.secondary
                                                }}
                                            >
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3" style={{ color: COLORS.text }}>
                                            {staff.department}
                                        </td>
                                        <td className="px-4 py-3 capitalize" style={{ color: COLORS.text }}>
                                            {staff.shift}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: COLORS.text }}>
                                            {staff.contact_number}
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button 
                                                onClick={() => handleEdit(staff)} 
                                                className="p-1.5 rounded hover:bg-blue-50"
                                                style={{ color: COLORS.secondary }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(staff.id)} 
                                                className="p-1.5 rounded hover:bg-red-50"
                                                style={{ color: COLORS.error }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </motion.div>
    );
};

// Reusable Edit Row Component
const EditRow = ({ editFormData, handleEditChange, handleSaveEdit, handleCancelEdit, colors }) => (
    <>
        {['full_name', 'role', 'department', 'shift', 'contact_number'].map((field) => (
            <td key={field} className="px-4 py-3">
                {field === 'role' || field === 'shift' ? (
                    <select
                        name={field}
                        value={editFormData[field]}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 rounded border"
                        style={{
                            
                            borderColor: colors.primary + '40',
                            
                            color: colors.text
                        }}
                    >
                        {field === 'role' ? (
                            <>
                                <option value="staff">Staff</option>
                                <option value="nurse">Nurse</option>
                            </>
                        ) : (
                            <>
                                <option value="morning">Morning</option>
                                <option value="evening">Evening</option>
                                <option value="night">Night</option>
                            </>
                        )}
                    </select>
                ) : (
                    <input
                        type={field === 'contact_number' ? 'tel' : 'text'}
                        name={field}
                        value={editFormData[field] || ''}
                        onChange={handleEditChange}
                        className="w-full px-2 py-1 rounded border"
                        style={{
                            borderColor: colors.primary + '40',
                            color: colors.text
                        }}
                    />
                )}
            </td>
        ))}
        <td className="px-4 py-3 flex gap-2">
            <button 
                onClick={handleSaveEdit}
                className="px-3 py-1 rounded font-medium"
                style={{ backgroundColor: colors.primary, color: 'white' }}
            >
                Save
            </button>
            <button 
                onClick={handleCancelEdit}
                className="px-3 py-1 rounded border"
                style={{ borderColor: colors.primary + '40', color: colors.text }}
            >
                Cancel
            </button>
        </td>
    </>
);


export default StaffManagement;