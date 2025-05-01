// src/components/Header.js
import React, { useContext } from 'react';
import { UserContext } from '../UserContext';
import UserHeader from './UserHeader';
import DoctorHeader from './DoctorHeader';
import AdminHeader from './AdminHeader';
import { useState } from 'react';

const Header = () => {
    const { userData } = useContext(UserContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

    if (!userData) {
        // Render a default header for non-logged-in users
        return <UserHeader />; // Or a different component
    }

    switch (userData.role) {
        case 'user':
            return <UserHeader />;
        case 'doctor':
            return <DoctorHeader />;
        case 'admin':
            return <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />;
        default:
            return <UserHeader />; // Default fallback
    }
};

export default Header;