import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../UserContext';
import profileImage from '../assets/profile.png';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiCalendar,
  FiUser,
  FiClock,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiPlusSquare,
  FiFolder,
} from 'react-icons/fi';

const COLORS = {
  primary: "#14467c",
  secondary: "#f9cc48",
  success: "#53b774",
  background: "#ffffff",
  surface: "#ffffff",
  textPrimary: "#14467c",
  textSecondary: "#64748b"
};

const DoctorHeader = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const { userData, logout } = useContext(UserContext);
  const [doctorId, setDoctorId] = useState('');
  const [loadingDoctorId, setLoadingDoctorId] = useState(false);

  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!userData) return;
      
      setLoadingDoctorId(true);
      try {
        if (userData.role === 'doctor') {
          const response = await axios.get(`/api/doctors/by-user/${userData.id}`);
          setDoctorId(response.data.doctorId.toString());
        }
      } catch (err) {
        console.error('Error fetching doctor ID:', err);
        setDoctorId('');
      } finally {
        setLoadingDoctorId(false);
      }
    };

    fetchDoctorId();
  }, [userData]);

  const SIDEBAR_ITEMS = [
    { 
      name: "Dashboard", 
      path: "/doctorDashboard", 
      icon: FiHome,
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48"
    },
    { 
      name: "Appointments", 
      path: "/appointmentList", 
      icon: FiCalendar,
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48"
    },
    { 
      name: "Patients", 
      path: "/patientsList",
      icon: FiPlusSquare,
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48"
    },
    { 
      name: "Availability", 
      path: "/manage-availability", 
      icon: FiClock,
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48"
    },
    { 
      name: "Add Medical History", 
      path:"/add-medicalHistory", 
      icon: FiFolder, 
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48" 
    },
    { 
      name: "Medical History", 
      path:"/medicalHistory", 
      icon: FiFolder,
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48" 
    },
    {
      name: "Doctor Profile",
      path: doctorId ? `/doctors/${doctorId}/profile` : '#',
      icon: FiUser,
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48"
    },
    {
      name: "Edit Doctor Profile",
      path: doctorId ? `/doctors/${doctorId}/edit-profile` : '#',
      icon: FiUser,
      activeBg: "#f9cc4820",
      activeIcon: "#f9cc48"
    },
  ];

  return (
    <motion.div
      className="fixed top-0 left-0 h-screen z-50 shadow-xl"
      style={{ backgroundColor: COLORS.background }}
      animate={{ width: isSidebarOpen ? 250 : 80 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="h-full flex flex-col p-4 border-r" style={{ borderRight: `1px solid ${COLORS.primary}10` }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 p-2 rounded-full shadow-lg"
          style={{ backgroundColor: COLORS.primary }}
        >
          {isSidebarOpen ? (
            <FiChevronLeft className="text-white text-lg" />
          ) : (
            <FiChevronRight className="text-white text-lg" />
          )}
        </motion.button>

        <nav className="flex-1 mt-4 space-y-2">
          <h1 
            className="pl-2 pb-8 pt-2 font-bold text-[1.5rem] truncate"
            style={{ color: COLORS.primary, textShadow: `0 2px 4px ${COLORS.primary}10` }}
          >
            {isSidebarOpen ? "LifeEasy Doctor" : "LE"}
          </h1>

          {loadingDoctorId ? (
            <div className="p-2 text-sm text-gray-500">Loading navigation...</div>
          ) : (
            SIDEBAR_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center no-underline ${
                  loadingDoctorId ? ' opacity-50 pointer-events-none' : ''
                }`}
              >
                <motion.div
                  className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out border-l-8 ${
                    location.pathname === item.path
                      ? "bg-[#f9cc4820] border-l-8 border-[#f9cc48]"
                      : "hover:bg-[#f9cc4820] border-transparent"
                  }`}
                >
                  <item.icon
                    size={22}
                    className="flex-shrink-0"
                    style={{ 
                      color: location.pathname === item.path ? COLORS.primary : "#14467c",
                      transition: "color 0.2s ease-in-out"
                    }}
                  />
                  <AnimatePresence initial={false}>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="ml-3 text-sm font-semibold"
                        style={{ color: "#14467c" }}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isSidebarOpen && (
                    <span 
                      className="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      style={{ backgroundColor: "#f9cc48", color: "#14467c" }}
                    >
                      {item.name}
                    </span>
                  )}
                </motion.div>
              </Link>
            ))
          )}
        </nav>

        {userData && (
          <div className="mt-auto pt-4 border-t" style={{ borderColor: "#14467c20" }}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={profileImage}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2"
                style={{ borderColor: "#14467c" }}
              />
              <AnimatePresence initial={false}>
                {isSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1 min-w-0"
                  >
                    <p 
                      className="text-sm font-medium truncate"
                      style={{ color: "#14467c" }}
                    >
                      Dr. {userData.fullname}
                    </p>
                    <button
                      onClick={logout}
                      className="text-xs hover:text-[#53b774] transition-colors truncate flex items-center gap-1"
                      style={{ color: "#14467c" }}
                    >
                      <FiLogOut className="text-sm" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DoctorHeader;