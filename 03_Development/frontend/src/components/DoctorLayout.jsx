// src/layouts/DoctorLayout.jsx
import { motion } from 'framer-motion';
import { useState, useEffect, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DoctorHeader from './DoctorHeader';
import TopHead from './TopHead';
import { UserContext } from '../UserContext';
import axios from 'axios';

const DoctorLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { userData } = useContext(UserContext);
    const [doctorId, setDoctorId] = useState('');
    const [loadingDoctorId, setLoadingDoctorId] = useState(true);

    useEffect(() => {
        const fetchDoctorId = async () => {
            if (!userData) return;
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

    // Map routes to page titles
    const getTitle = (pathname) => {
        switch (pathname) {
            case '/doctorDashboard': return 'Doctor Dashboard';
            case '/appointmentList': return 'My Appointments';
            case '/patientsList': return 'Patients';
            case '/manage-availability': return 'Availability';
            case '/medicalHistory': return 'Medical History';
            case `/doctors/${doctorId}/profile`: return 'Doctor Profile'; // Now doctorId is in scope
            case `/doctors/${doctorId}/edit-profile`: return 'Edit Doctor Profile'; // Add this case
            default: return 'Doctor Dashboard';
        }
    };

    return (
        <div className="flex min-h-screen">
            <DoctorHeader
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                doctorId={doctorId} // Pass doctorId as a prop
                loadingDoctorId={loadingDoctorId} // Optionally pass loading state
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

export default DoctorLayout;