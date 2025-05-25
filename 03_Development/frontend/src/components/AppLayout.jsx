import { motion } from 'framer-motion';
import AdminHeader from './AdminHeader';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopHead from './TopHead';

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // Optional: Dynamic title mapping based on route
  const getTitle = (pathname) => {
    switch (pathname) {
      case '/adminDashboard': return 'Admin Dashboard';
      case '/qr-scanner': return 'Scan QR Code';
      case '/doctorAd': return 'Manage Doctors';
      case '/admin-manage-availability': return 'Manage Doctor Availability';
      case '/admin-manage-patients': return 'Patient Managment';
      case '/staff-management': return 'Staff Management';
      case '/salaryForm': return 'Salary Configuration';
      case '/salaryHistory': return 'Salary History';
      case '/pendingApproval': return 'Pending Approvals';
      case '/initialSalaryConfig': return 'Initial Salary Configuration';
      case '/bed-management': return 'Bed Management';
      default: return 'adminDashboard';
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminHeader 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      <motion.main
        className="flex-1 bg-gray-50 overflow-x-hidden"
        animate={{
          marginLeft: isSidebarOpen ? 240 : 80,
        }}
        transition={{ duration: 0.2 }}
      >
        <TopHead title={getTitle(location.pathname)} />

        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default AppLayout;
