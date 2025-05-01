import './App.css'
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Home from "./pages/Home";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import UserHomeScreen from "./pages/UserHomeScreen";
import { UserProvider} from "./UserContext";
import { UserContext } from './UserContext';
import AppLayout from "./components/AppLayout";
import DoctorLayout from "./components/DoctorLayout";
import UserAppointments from './pages/Appointments/PatientsAppointments';

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OptVerify = lazy(() => import("./pages/OTPverification"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const Patients = lazy(() => import("./pages/admin/PatientsManagement.jsx"))
const DoctorSignup = lazy(() => import("./pages/doctors/DoctorSignup"))
const DoctorDashboard = lazy(() => import("./pages/doctors/DoctorDashboard"))
const VerificationPending = lazy(() => import("./components/VerificationPending"))
const DoctorList = lazy(() => import("./pages/Appointments/DoctorsList"))
const AppointmentDetails = lazy(() => import("./pages/Appointments/AppointmentDetails"))
const DoctorDetails = lazy(() => import("./pages/Appointments/DoctorDetails"))
const Confirmation = lazy(() => import("./components/Confirmation"))
const AddAvailability = lazy(() => import("./pages/docAvailability/AddAvailability"))
const ManageAvailability = lazy(() => import("./pages/docAvailability/ManageAvailability"))
const AppointmentList = lazy(() => import("./pages/doctors/AppointmentList"))
const QrScanner = lazy(() => import("./pages/Appointments/QrScanner"))
const Doctors = lazy(() => import("./pages/admin/Doctors"))
const AdminManageAvailability = lazy(() => import("./pages/admin/AdminManageAvailability.jsx"))
const PatientsManagement = lazy(() => import("./pages/admin/PatientsManagement.jsx"))
const BookingDetail = lazy(() => import("./pages/Appointments/BookingDetail"))
const StaffManagement = lazy(() => import("./pages/admin/StaffManagement.jsx"))
const AddMedicalHistory = lazy(() => import("./pages/Patient/AddMedicalHistory.jsx"))
const EditMedicalHistory = lazy(() => import("./pages/Patient/EditMedicalHistory.jsx"))
const PatientProfile = lazy(() => import("./pages/Patient/ViewPatientProfile.jsx"))
const EditPatientProfile = lazy(() => import("./pages/Patient/EditPatientProfile.jsx"))
const ViewPatientMedicalHistory = lazy(() => import("./pages/Patient/ViewPatientMedicalHistory.jsx")) // Assuming you'll create this
const MedicalHistory = lazy(() => import("./pages/Patient/MedicalHistory.jsx")) // Assuming you'll create this
const DoctorPatientList = lazy(() => import("./pages/doctors/DoctorPatientList.jsx"))
const SalaryConfig = lazy(() => import("./pages/Salary/SalaryConfig.jsx"))
const SalaryHistory = lazy(() => import("./pages/Salary/SalaryHistory.jsx"))
const PendingApprovals = lazy(() => import("./pages/Salary/PendingApprovals.jsx"))
const InitialSalaryConfig = lazy(() => import("./pages/Salary/InitialSalaryConfig.jsx")) // Assuming you'll create this
const DoctorProfile = lazy(() => import("./pages/doctors/DoctorProfile.jsx")) // Assuming you'll create this
const EditDoctorProfile = lazy(() => import("./pages/doctors/EditDoctorProfile.jsx")) // Assuming you'll create this
const Loader = lazy(() => import("./components/Loader.jsx")) // Assuming you'll create this
const ErrorMessage = lazy(() => import("./components/ErrorMessage.jsx")) // Assuming you'll create this
const Homes = lazy(() => import("./pages/HomePage/Homes.jsx")) // Assuming you'll create this
const PatientsAppointments = lazy(() => import("./pages/Appointments/PatientsAppointments.jsx")) // Assuming you'll create this

const App = () => {
    return (
        <UserProvider>
            <Router>
                <Header/>
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/Verification" element={<OptVerify />} />
                        <Route path="/doctorSignup" element={<DoctorSignup />} />
                        <Route path="/doctors/:id/profile" element={<DoctorProfile />} />
                        <Route path="/homes" element={<Homes />} />
                        <Route path="/booking-details/:id" element={<BookingDetail />} />

                        {/* Admin routes with layout */}
                        <Route element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AppLayout />
                            </ProtectedRoute>
                        }>
                            <Route path="/adminDashboard" element={<AdminDashboard />} />
                            <Route path="/admin-manage-patients" element={<PatientsManagement />} />
                            <Route path="/admin-manage-availability" element={<AdminManageAvailability />} />
                            <Route path="/doctorAd" element={<Doctors />} />
                            <Route path="/qr-scanner" element={<QrScanner />} />
                            <Route path="/salaryForm" element={<SalaryConfig />} />
                            <Route path="/salaryHistory" element={<SalaryHistory />} />
                            <Route path="/initialSalaryConfig" element={<InitialSalaryConfig />} />
                            <Route path="/pendingApproval" element={<PendingApprovals />} />
                            <Route path="/staff-management" element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                        <StaffManagement />
                            </ProtectedRoute>
                            

                                } />
                        </Route>

                        {/* Doctor routes with layout */}
                        <Route element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <DoctorLayout />
                            </ProtectedRoute>
                        }>
                            <Route path="/doctorDashboard" element={<DoctorDashboard />} />
                            <Route path="/add-availability" element={<AddAvailability />} />
                            <Route path="/manage-availability" element={<ManageAvailability />} />
                            <Route path="/appointmentList" element={<AppointmentList />} />
                            <Route path="/patients" element={<Patients />} /> 
                            <Route path="/add-medicalHistory" element={<AddMedicalHistory />} />
                            <Route path="/patients/:patientId/medical-history" element={<ViewPatientMedicalHistory />} />
                            <Route path="/patients/:patientId/add-medical-history" element={<AddMedicalHistory />} />
                            <Route path="/patientsList" element={<DoctorPatientList />} />
                            <Route path="/doctors/:id/edit-profile" element={<EditDoctorProfile />} />
                            <Route path="/Loader" element={<Loader />} />
                            <Route path="/ErrorMessage" element={<ErrorMessage />} />
                            <Route path="/edit-medicalHistory" element={<EditMedicalHistory />} />
                            <Route path="/medicalHistory" element={<MedicalHistory />} />
                        </Route>
                        <Route path="/doctor/:id" element={<DoctorDetails />} />
                        <Route path="/doctors" element={<DoctorList />} />

                        {/* User routes */}
                        <Route path="/homeScreen" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <UserHomeScreen />
                            </ProtectedRoute>}
                        />
                        {/* User can view their patient profile */}
                        <Route path="/patient-profile" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <PatientProfile />
                            </ProtectedRoute>}
                        />
                        {/* User can edit their patient profile */}
                        <Route path="/edit-patient-profile" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <EditPatientProfile />
                            </ProtectedRoute>}
                        />
                        {/* User can view their own medical history */}
                        <Route path="/my-medical-history" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <ViewPatientMedicalHistory isOwnProfile={true} /> {/* Passing a prop to differentiate */}
                            </ProtectedRoute>}
                        />

                        {/* Common routes */}
                        
                        <Route path="/appointments" element={<PatientsAppointments/>} />                        <Route path="/doctors" element={<DoctorList />} />
                        <Route path="/doctor/:id" element={<DoctorDetails />} />
                        <Route path="/appointment-details" element={<AppointmentDetails />} />
                        <Route path="/appointment-confirmation" element={<Confirmation />} />
                        <Route path="/verifyPending" element={
                            <UserContext.Consumer>
                                {({ loaded }) => loaded ? <VerificationPending /> : <div>Loading...</div>}
                            </UserContext.Consumer>}
                        />

                        {/* 404 route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>

                <ToastContainer
                    position="top-center"
                    autoClose={1000}
                    hideProgressBar={true}
                    closeOnClick
                    theme="colored"
                />
            </Router>
        </UserProvider>
    );
};

export default App;