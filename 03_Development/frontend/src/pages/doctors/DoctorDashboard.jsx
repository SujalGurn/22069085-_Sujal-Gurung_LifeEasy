import React, { useState, useEffect } from 'react';
import { FiUsers, FiCalendar, FiDollarSign, FiActivity, FiPlusCircle, FiBell } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import AppointmentList from './AppointList'; // Fixed import to match filename
import axios from 'axios';

const DoctorDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 0,
    upcomingAppointments: 0,
    monthlyEarnings: 0,
    completedAppointments: 0,
    appointments: [],
    earningsData: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let errors = [];

        // Fetch stats
        try {
          const statsResponse = await axios.get('/api/stats/doctor-stats', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log('Stats Response:', statsResponse.data);
          const { totalPatients, upcomingAppointments, monthlyEarnings, completedAppointments } = statsResponse.data.stats;
          setDashboardData(prev => ({ ...prev, totalPatients, upcomingAppointments, monthlyEarnings, completedAppointments }));
        } catch (err) {
          errors.push(`Stats: ${err.response?.data?.message || err.message}`);
        }

        // Fetch earnings trend
        try {
          const earningsResponse = await axios.get('/api/stats/doctor-earnings-trend', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log('Earnings Response:', earningsResponse.data);
          setDashboardData(prev => ({
            ...prev,
            earningsData: earningsResponse.data.trend.map(item => ({
              month: item.month.slice(0, 7),
              earnings: item.earnings
            }))
          }));
        } catch (err) {
          errors.push(`Earnings: ${err.response?.data?.message || err.message}`);
        }

        // Fetch appointments
        try {
          const appointmentsResponse = await axios.get('/api/stats/doctor-appointments', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log('Appointments Response:', appointmentsResponse.data);
          setDashboardData(prev => ({ ...prev, appointments: appointmentsResponse.data.appointments }));
        } catch (err) {
          errors.push(`Appointments: ${err.response?.data?.message || err.message}`);
        }

        // Fetch alerts
        try {
          const alertsResponse = await axios.get('/api/stats/doctor-alerts', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log('Alerts Response:', alertsResponse.data);
          setDashboardData(prev => ({ ...prev, alerts: alertsResponse.data.alerts.map(alert => alert.message) }));
        } catch (err) {
          errors.push(`Alerts: ${err.response?.data?.message || err.message}`);
        }

        if (errors.length > 0) {
          setError(`Failed to load some data: ${errors.join('; ')}`);
        }
      } catch (err) {
        setError(`Unexpected error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#14467c]">Welcome Dr. Gurung</h1> {/* Updated to match doctors table */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard icon={<FiUsers />} title="Total Patients" value={dashboardData.totalPatients} color="#3B82F6" />
        <SummaryCard icon={<FiCalendar />} title="Pending Appts" value={dashboardData.upcomingAppointments} color="#10B981" /> {/* Renamed for clarity */}
        <SummaryCard icon={<FiDollarSign />} title="Monthly Earnings" value={`$${dashboardData.monthlyEarnings.toLocaleString()}`} color="#F59E0B" /> {/* Formatted earnings */}
        <SummaryCard icon={<FiActivity />} title="Completed (Month)" value={dashboardData.completedAppointments} color="#8B5CF6" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-[#14467c]">Earnings Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="earnings" fill="#CBE9DC" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Appointments */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#14467c]">Pending Appointments</h2>
            <FiCalendar className="text-[#14467c]" />
          </div>
          <AppointmentList appointments={dashboardData.appointments} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#14467c]">Alerts & Notifications</h2>
            <FiBell className="text-[#14467c]" />
          </div>
          <ul className="space-y-3">
            {dashboardData.alerts.map((alert, index) => (
              <li
                key={index}
                className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg text-red-700"
              >
                {alert}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-[#14467c]">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction icon={<FiPlusCircle />} title="New Prescription" color="#10B981" />
            <QuickAction icon={<FiUsers />} title="Add Patient" color="#3B82F6" />
            <QuickAction icon={<FiCalendar />} title="Schedule Time Off" color="#F59E0B" />
            <QuickAction icon={<FiActivity />} title="View Reports" color="#8B5CF6" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon, title, value, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4"
  >
    <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
      {React.cloneElement(icon, { className: "text-xl", style: { color } })}
    </div>
    <div>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  </motion.div>
);

// Quick Action Button Component
const QuickAction = ({ icon, title, color }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    className="p-4 flex flex-col items-center rounded-lg hover:shadow-md transition-all"
    style={{ backgroundColor: `${color}20` }}
  >
    {React.cloneElement(icon, { className: "text-2xl mb-2", style: { color } })}
    <span className="text-sm font-medium" style={{ color }}>{title}</span>
  </motion.button>
);

export default DoctorDashboard;