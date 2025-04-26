import { pool } from "../config/db.js";

const userTableQuery = `
CREATE TABLE IF NOT EXISTS users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    dateofbirth DATE NOT NULL,
    contact VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,    
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'doctor') NOT NULL DEFAULT 'user',
    otp VARCHAR(6),
    otpExpires DATETIME, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const doctorTableQuery = `
CREATE TABLE IF NOT EXISTS doctors(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_number VARCHAR(255) NOT NULL UNIQUE,
    specialization VARCHAR(255) NOT NULL,
    certification_path VARCHAR(255) NOT NULL,
    id_proof_path VARCHAR(255) NOT NULL,
    Total_income DECIMAL(12,2) DEFAULT 0.00,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verification_notes TEXT,
    verification_date DATETIME,
    profile_picture VARCHAR(255),
    about TEXT,
    opd_schedule JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) 
)`;

const doctor_availabilityTableQuery = `
CREATE TABLE IF NOT EXISTS doctor_availability(
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    day_of_week VARCHAR(9) NOT NULL,
    start_time TIME NOT NULL, 
    end_time TIME NOT NULL,
    slot_duration INT DEFAULT 10 COMMENT 'minutes',
    is_available BOOLEAN DEFAULT 1,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,  
    UNIQUE KEY unique_doctor_day (doctor_id, day_of_week),
    INDEX idx_doctor (doctor_id),
    INDEX idx_availability (doctor_id, day_of_week, start_time, end_time)
)`;

const appointmentsTableQuery = `
CREATE TABLE IF NOT EXISTS appointments(
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL, 
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(255),    
  notes TEXT, 
  token_number VARCHAR(25) UNIQUE DEFAULT NULL,
  expires_at DATETIME DEFAULT NULL,
  is_used BOOLEAN DEFAULT false,
  qr_token VARCHAR(512) UNIQUE,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,  
  INDEX idx_doctor_date_status (doctor_id, appointment_date, status),  
  INDEX idx_patient (patient_id) ,
  INDEX idx_appointment_slot (doctor_id, appointment_date, appointment_time),
  INDEX idx_appointment_verification (qr_token, expires_at, status),
  UNIQUE INDEX idx_token_unique (doctor_id, appointment_date, token_number)
)`;

const token_logsTableQuery = `
CREATE TABLE IF NOT EXISTS token_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    token_number VARCHAR(25) NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    INDEX idx_token (token_number) 
)`;


const staffTableQuery = `
CREATE TABLE IF NOT EXISTS staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('staff', 'nurse') NOT NULL,
    department VARCHAR(50) NOT NULL,
    shift VARCHAR(20) NOT NULL,
    specialization VARCHAR(100),
    contact_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const patientTableQuery = `
CREATE TABLE IF NOT EXISTS patient (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    patient_code VARCHAR(255) UNIQUE NOT NULL,
    gender ENUM('male', 'female', 'other'),
    blood_group VARCHAR(10),
    address VARCHAR(255),
    contact_number VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)`;

const medicalHistoryTableQuery = `
CREATE TABLE IF NOT EXISTS medicalHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    recorded_by_user_id INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blood_pressure VARCHAR(20),
    medication TEXT,
    allergies TEXT,
    weight DECIMAL(5, 2),
    height DECIMAL(5, 2),
    medical_condition TEXT,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    report_name VARCHAR(255),
    report_path VARCHAR(255),
    report_date VARCHAR(255),
    report_type VARCHAR(255),
    report_notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient(id),
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
)`;

const auto_salaryTableQuery = `
CREATE TABLE IF NOT EXISTS auto_salary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT UNIQUE NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    auto_generate BOOLEAN DEFAULT TRUE,
    payment_frequency ENUM('monthly', 'bi-weekly') DEFAULT 'monthly',
    standard_deductions JSON,
    next_payment_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
)`;

const salaryPaymentTableQuery = `
CREATE TABLE IF NOT EXISTS salary_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    gross_amount DECIMAL(12,2) NOT NULL,
    total_deductions DECIMAL(12,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) AS (gross_amount - total_deductions),
    payment_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
    deduction_details JSON,
    auto_generated BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
)`;

const deductionTableQuery = `
CREATE TABLE IF NOT EXISTS deduction_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    calculation_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
    default_value DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const qualitficationTableQuery = `
CREATE TABLE qualifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    year VARCHAR(4) NOT NULL,  -- Changed from YEAR to VARCHAR(4)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_qualification (doctor_id)
)`;

const experienceTableQuery = `
CREATE TABLE experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    position VARCHAR(255) NOT NULL,
    institute VARCHAR(255) NOT NULL,
    duration VARCHAR(50) NOT NULL,  -- Added NOT NULL constraint
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_experience (doctor_id)
)`;


const createTable = async (tableName, query) => {
    try {
        await pool.query(query);
        console.log(`${tableName} table created or already exists`);
    } catch (error) {
        console.log(`Error creating ${tableName}`, error);
    }
};

const createAllTable = async () => {
    try {
        await createTable("Users", userTableQuery);
        await createTable("Doctors", doctorTableQuery);
        await createTable("Qualifications", qualitficationTableQuery);
        await createTable("Experience", experienceTableQuery);
        await createTable("Doctor_availability", doctor_availabilityTableQuery);
        await createTable("Appointments", appointmentsTableQuery);
        await createTable("Token_logs", token_logsTableQuery);
        await createTable("Staff", staffTableQuery);
        await createTable("Patient", patientTableQuery);
        await createTable("MedicalHistory" ,medicalHistoryTableQuery);
        await createTable("Auto_salary", auto_salaryTableQuery);
        await createTable("salaryPayment", salaryPaymentTableQuery);
        await createTable("Deduction", deductionTableQuery);

        console.log("All tables created successfully!!");
    } catch (error) {
        console.log("Error creating tables", error);
        throw error;
    }
};

export default createAllTable;
