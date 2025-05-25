import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../style/header.css';
import { UserContext } from '../UserContext';
import profileImage from '../assets/profile.png';
import axios from 'axios';

const UserHeader = () => {
    const location = useLocation();
    const { userData, logout, isDoctor, isAdmin } = useContext(UserContext);
    const [profilePicture, setProfilePicture] = useState(profileImage);

    // Fetch patient profile picture for users
    useEffect(() => {
        if (userData && userData.role === 'user') {
            const fetchProfilePicture = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get('http://localhost:3002/api/profile/patient', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.data.success && response.data.data && response.data.data.profile_picture) {
                        setProfilePicture(`http://localhost:3002/${response.data.data.profile_picture}`);
                    }
                } catch (error) {
                    console.error('Error fetching profile picture:', error.response?.data);
                    setProfilePicture(profileImage); // Fallback to default
                }
            };
            fetchProfilePicture();
        } else {
            setProfilePicture(profileImage); // Default for non-users
        }
    }, [userData]);

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <i className="fas fa-briefcase logo-icon"></i>
                <span className="logo-text">LifeEasy</span>
            </div>
            <ul className="navbar-links nav-list">
                <li>
                    <Link to="/homes" className={location.pathname === '/homes' ? 'active' : ''}>
                        Homes
                    </Link>
                </li>
                <li>
                    <Link to="/doctorSignup" className={location.pathname === '/doctorSignup' ? 'active' : ''}>
                        Doctor Register
                    </Link>
                </li>
                {userData && userData.role === 'user' && (
                    <>
                        <li>
                            <Link to="/patient-profile" className={location.pathname === '/patient-profile' ? 'active' : ''}>
                                View Profile
                            </Link>
                        </li>
                        <li>
                            <Link to="/my-medical-history" className={location.pathname === '/my-medical-history' ? 'active' : ''}>
                                My Medical History
                            </Link>
                        </li>
                    </>
                )}
                <li>
                    <Link to="/doctors" className={location.pathname === '/doctors' ? 'active' : ''}>
                        Doctors
                    </Link>
                </li>
                {userData && (userData.role === 'doctor' || userData.role === 'admin') && (
                    <li>
                        <Link to="/appointmentsl" className={location.pathname === '/appointmentsList' ? 'active' : ''}>
                            Appointments
                        </Link>
                    </li>
                )}
                {userData ? (
                    <>
                        <li className="navbar-profile nav-item">
                            <Link to="/homeScreen" className={location.pathname === '/homeScreen' ? 'active' : ''} style={{ display: 'flex', alignItems: 'center' }}>
                                <img src={profilePicture} alt="Profile" className="profile-photo-circle" />
                                <span className="username">
                                    {userData.username || userData.name}
                                    {(isDoctor || isAdmin) && ` (${isAdmin ? 'Admin' : 'Doctor'})`}
                                </span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <button aria-label="Logout" style={{ cursor: 'pointer' }} onClick={logout}>
                                Logout
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                                Login
                            </Link>
                        </li>
                        <li>
                            <Link to="/signup" className={location.pathname === '/signup' ? 'active' : ''}>
                                Sign Up
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default UserHeader;