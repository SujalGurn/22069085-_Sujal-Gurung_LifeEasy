import React from 'react';
import { FiUsers, FiCalendar, FiDollarSign, FiActivity, FiPlusCircle, FiBell } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import AppointmentList from './AppointmentList'; // Adjust path if needed

const DoctorDashboard = () => {
  const dashboardData = {
    totalPatients: 245,
    upcomingAppointments: 12,
    monthlyEarnings: 12500,
    completedAppointments: 18,
    appointments: [
      { id: 1, patient: "Sarah Johnson", time: "09:00 AM", condition: "Follow-up" },
      { id: 2, patient: "Mike Chen", time: "10:30 AM", condition: "New Patient" },
    ],
    earningsData: [
      { month: 'Jan', earnings: 4000 },
      { month: 'Feb', earnings: 6500 },
      { month: 'Mar', earnings: 12500 },
    ],
    alerts: [
      "Low stock of Painkillers",
      "Annual conference next week",
      "2 pending prescriptions"
    ]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#14467c]">Welcome Dr. Smith</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard icon={<FiUsers />} title="Total Patients" value={dashboardData.totalPatients} color="#3B82F6" />
        <SummaryCard icon={<FiCalendar />} title="Upcoming Appts" value={dashboardData.upcomingAppointments} color="#10B981" />
        <SummaryCard icon={<FiDollarSign />} title="Monthly Earnings" value={`$${dashboardData.monthlyEarnings}`} color="#F59E0B" />
        <SummaryCard icon={<FiActivity />} title="Completed (Month)" value={dashboardData.completedAppointments} color="#8B5CF6" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-[#14467c]">Earnings Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="earnings" fill="#f9cc48" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending Appointments */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#14467c]">Pending Appointments</h2>
            <FiCalendar className="text-[#14467c]" />
          </div>
          <AppointmentList />
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
