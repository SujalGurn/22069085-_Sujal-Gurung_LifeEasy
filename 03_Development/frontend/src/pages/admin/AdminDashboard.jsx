import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    const [appointmentData, setAppointmentData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch basic stats
                const statsResponse = await axios.get('http://localhost:3002/api/stats/admin-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Fetch appointment data for chart
                const appointmentsResponse = await axios.get('http://localhost:3002/api/stats/appointments-trend', {
                    headers: { Authorization: `Bearer ${token}` }
                });
 console.log('Appointment Trend Data:', appointmentsResponse.data.trend);
                if (statsResponse.data.success && appointmentsResponse.data.success) {
                    setStats(statsResponse.data.stats);
                    setAppointmentData(appointmentsResponse.data.trend);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (isAdmin && !userLoading) {
            fetchData();
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
                <motion.div
    className="bg-white p-6 rounded-xl shadow-sm mt-8"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
>
    <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
            Appointment Trends (Last 6 Months)
        </h2>
        {!loading && (
            <div className="text-sm text-gray-500">
                Total: {appointmentData.reduce((sum, item) => sum + item.appointments, 0)}
            </div>
        )}
    </div>
    <div className="h-64">
        {loading ? (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-32 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
                Failed to load chart data
            </div>
        ) : appointmentData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
                No appointment data available
            </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
    dataKey="month"
    tickFormatter={(value) => {
        const [year, month] = value.split('-');
        return new Date(year, month-1).toLocaleString('default', { month: 'short' });
    }}
    tick={{ fill: '#6B7280', fontSize: 12 }}
    axisLine={false}
/>
<Tooltip 
    cursor={{ fill: '#E5E7EB' }}
    content={({ active, payload, label }) => (
        active && (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-medium text-gray-700">
                    {new Date(label + '-01').toLocaleString('default', { 
                        month: 'long', 
                        year: 'numeric' 
                    })}
                </p>
                <p className="text-sm text-[#3B82F6]">
                    Appointments: {payload[0].value}
                </p>
            </div>
        )
    )}
/>
                    <Bar 
                        dataKey="appointments" 
                        fill="#53b774"
                        radius={[4, 4, 0, 0]}
                        name="Appointments"
                    />
                </BarChart>
            </ResponsiveContainer>
        )}
    </div>
</motion.div>
            </main>
        </div>
    );
};

export default AdminDashboard;