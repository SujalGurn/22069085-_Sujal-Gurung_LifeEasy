import React from 'react';
import { motion } from "framer-motion";
import '../../style/Homes.css';
import i2 from '../../assets/i2.svg';
import i1 from '../../assets/i1.svg';
import i3 from '../../assets/i3.svg';
import i4 from '../../assets/i4.svg';
import i5 from '../../assets/i5.svg';
import g1 from '../../assets/image 12.svg';
import d from '../../assets/d.svg';
import Footer from "../../components/Footer";
import {
  FaAmbulance,
  FaSyringe,
  FaBaby,
  FaXRay,
  FaStethoscope,
  FaChild,
  FaHeartbeat,
  FaClinicMedical
} from "react-icons/fa";

// Animation variants
const scrollVariants = {
  offscreen: {
    opacity: 0,
    y: 50
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 1
    }
  }
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const Homes = () => {
  const hospitalServices = [
    { name: "Emergency Care", icon: <FaAmbulance /> },
    { name: "Surgery Services", icon: <FaSyringe /> },
    { name: "Maternity Care", icon: <FaBaby /> },
    { name: "Diagnostic Imaging", icon: <FaXRay /> },
    { name: "Outpatient Services", icon: <FaStethoscope /> },
    { name: "Pediatric Care", icon: <FaChild /> },
    { name: "Cardiology Services", icon: <FaHeartbeat /> },
    { name: "Physical Therapy", icon: <FaClinicMedical /> }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <motion.section 
        className="hero"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Our bodies are our gardens<br />– our wills are our gardeners.
        </motion.h1>
        <motion.div 
          className="hero-icons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <img src={i3} alt="Doctors" />
          <img src={i2} alt="Doctors" />
          <img src={i1} alt="Health" />
          <img src={d} alt="doca" />
        </motion.div>
      </motion.section>

      {/* About Section */}
      <motion.section 
        className="about"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.2 }}
        variants={scrollVariants}
      >
        <div className="about-content">
          <motion.img 
            src={g1} 
            alt="Doctors" 
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div className="about-text">
            <h2>Who we are</h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              We are a trusted healthcare provider, dedicated to delivering high-quality care through our advanced hospital management system. Our skilled medical professionals use state-of-the-art facilities and technology to treat patients of all ages, both in-person and online.
              <br /><br />
              We focus on prevention, proper care, and patient education to ensure the well-being of our patients and help them maintain a healthy life.
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Care Section */}
      <motion.section 
        className="care"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.2 }}
        variants={scrollVariants}
      >
        <h2>Caring for your health is our top concern</h2>
        <motion.div 
          className="care-cards"
          variants={staggerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[i4, i5].map((img, index) => (
            <motion.div 
              key={index}
              className="care-card"
              variants={scrollVariants}
              whileHover={{ scale: 1.03 }}
            >
              <img src={img} alt={index === 0 ? "Doctor" : "Schedule"} />
              <p>
                {index === 0 
                  ? "Our doctors are dedicated to providing expert care and personalized treatment."
                  : "Get help when & where you need it — within 7 days of scheduling."
                }
              </p>
            </motion.div>
          ))}
        </motion.div>
        <motion.button 
          className="appointment-btn"
          whileTap={{ scale: 0.95 }}
        >
          Request Appointment
        </motion.button>
      </motion.section>

      {/* Services Section */}
      <motion.section 
        className="services"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.1 }}
        variants={scrollVariants}
      >
        <h2>Our Services</h2>
        <motion.div 
          className="services-grid"
          variants={staggerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {hospitalServices.map((service, index) => (
            <motion.div 
              key={index}
              className="service-card"
              variants={scrollVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="service-icon">
                {React.cloneElement(service.icon, { className: "icon" })}
              </div>
              <h3>{service.name}</h3>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Homes;