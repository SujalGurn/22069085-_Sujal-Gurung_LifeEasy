import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { UserContext } from '../../UserContext';
import StatCard from '../../components/StatCard';
import { FiZap as Zap, FiUsers as Users, FiUserPlus as UserPlus, FiCalendar as Calendar } from 'react-icons/fi';
import AppLayout from '../../components/AppLayout';

const AdminDashboard = () => {
    const { isAdmin, loading: userLoading } = useContext(UserContext);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        totalPatients: 0,
        totalDoctors: 0,
        totalAvailability: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3002/api/stats/admin-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    setStats(response.data.stats);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch statistics');
            } finally {
                setLoading(false);
            }
        };

        if (isAdmin && !userLoading) {
            fetchStats();
        }
    }, [isAdmin, userLoading]);

    if (userLoading) {
        return <div className="p-4">Loading user permissions...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="p-4 text-red-500">
                Access denied. Admin privileges required.
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto ">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <motion.div
                    className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <StatCard
                        name="Total Appointments"
                        icon={Zap}
                        value={loading ? '...' : stats.totalAppointments}
                        color="#4F46E5"
                    />
                    <StatCard
                        name="Total Patients"
                        icon={Users}
                        value={loading ? '...' : stats.totalPatients}
                        color="#FBBF24"
                    />
                    <StatCard
                        name="Total Doctors"
                        icon={UserPlus}
                        value={loading ? '...' : stats.totalDoctors}
                        color="#10B981"
                    />
                    <StatCard
                        name="Total Availability"
                        icon={Calendar}
                        value={loading ? '...' : stats.totalAvailability}
                        color="#EF4444"
                    />
                </motion.div>
            </main>
        </div>
    );
};

export default AdminDashboard;