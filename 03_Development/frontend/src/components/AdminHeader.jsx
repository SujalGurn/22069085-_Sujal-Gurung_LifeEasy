import {
  FiUsers,
  FiSettings,
  FiCalendar,
  FiMaximize2,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiFolder,
  FiLogOut,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../UserContext";
import profileImage from "../assets/profile.png";
import { p, path } from "framer-motion/client";

const COLORS = {
  primary: "#14467c",
  secondary: "#f9cc48",
  success: "#53b774",
  background: "#ffffff",
  surface: "#ffffff",
  textPrimary: "#00000",
  textSecondary: "#64748b"
};

const SIDEBAR_ITEMS = [
  { 
    name: "Dashboard", 
    path: "/adminDashboard", 
    icon: FiUser,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  { 
    name: "Scan QR", 
    path: "/qr-scanner", 
    icon: FiMaximize2,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  { 
    name: "Doctors", 
    path: "/doctorAd", 
    icon: FiUser,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  { 
    name: "Availability", 
    path: "/admin-manage-availability", 
    icon: FiSettings,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  { 
    name: "Patients", 
    path: "/admin-manage-patients", 
    icon: FiUsers,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  { 
    name: "Staff", 
    path: "/staff-management", 
    icon: FiUsers,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  { 
    name: "Salary Approval",
    path: "/pendingApproval",
    icon: FiFolder,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  { 
    name: "Salary History",
    path: "/salaryHistory",
    icon: FiFolder,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  {
    name: "Initial Salary",
    path: "/initialSalaryConfig",
    icon: FiFolder,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  },
  {
    name: "Bed Management",
    path: "/bed-management",
    icon: FiFolder,
    activeBg: "#f9cc4820",
    activeIcon: "#f9cc48"
  }
  
];

const AdminHeader = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { userData, logout } = useContext(UserContext);
  const location = useLocation();

  return (
    <motion.div
      className="fixed top-0 left-0 h-screen z-50 shadow-xl"
      style={{ backgroundColor: COLORS.background }}
      animate={{ width: isSidebarOpen ? 250 : 80 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div className="h-full flex flex-col p-4 border-r" style={{ borderRight: `1px solid ${COLORS.primary}10` }}>
        {/* Toggle Button */}
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

        {/* Navigation Items */}
        <nav className="flex-1 mt-4 space-y-1">
          <h1 
            className="pl-2 pb-8 pt-2 font-bold text-[1.5rem] truncate"
            style={{ color: COLORS.primary, textShadow: `0 2px 4px ${COLORS.primary}10` }}
          >
            {isSidebarOpen ? "LifeEasy Admin" : "LE"}
          </h1>

          {SIDEBAR_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group relative flex items-center no-underline"
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
                      className="ml-3 text-sm font-medium"
                      style={{ color: "#14467c" }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!isSidebarOpen && (
                  <span 
                    className="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    style={{ backgroundColor: "#f9cc48", color: "#00000" }}
                  >
                    {item.name}
                  </span>
                )}
              </motion.div>
            </Link>
          ))}
        </nav>

        {/* Profile Section */}
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
                      {userData.name}
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

export default AdminHeader;