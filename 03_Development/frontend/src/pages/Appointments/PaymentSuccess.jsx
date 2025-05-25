import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/Loader';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import Lottie from 'lottie-react';
import checkmarkAnimation from "../../assets/animations/payment-success.json";// 🔥 your downloaded animation
import useWindowSize from 'react-use/lib/useWindowSize';
import '../../style/PaymentSuccess.css';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');
    const dataParam = searchParams.get('data');
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const navigate = useNavigate();
    const { width, height } = useWindowSize();

    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000;


<Lottie 
  animationData={checkmarkAnimation} 
  loop={false} 
  autoplay 
  style={{ height: 180, margin: "0 auto" }} 
/>


    const verifyPayment = async (effectiveAppointmentId) => {
        try {
            const { data } = await axios.get(
                `http://localhost:3002/api/appointments/${effectiveAppointmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    params: {
                        _: Date.now(),
                        fields: 'payment_status,updated_at,doctor_name,appointment_date,appointment_time,consultation_fee'
                    },
                    timeout: 10000
                }
            );

            if (data.success) {
                if (data.appointment.payment_status === 'paid') {
                    setReceipt(data.appointment);
                    setLoading(false);
                } else if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        verifyPayment(effectiveAppointmentId);
                    }, RETRY_DELAY);
                } else {
                    navigate('/payment-failure');
                }
            } else {
                navigate('/payment-failure');
            }
        } catch (error) {
            if (retryCount < MAX_RETRIES) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    verifyPayment(effectiveAppointmentId);
                }, RETRY_DELAY);
            } else {
                navigate('/payment-failure');
            }
        }
    };

    useEffect(() => {
        const processPayment = async () => {
            let effectiveAppointmentId = appointmentId;

            if (!effectiveAppointmentId && dataParam) {
                try {
                    const decodedData = JSON.parse(atob(dataParam));
                    const paymentResponse = await axios.get(
                        `http://localhost:3002/api/payments/transaction/${decodedData.transaction_uuid}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );

                    if (paymentResponse.data.success) {
                        effectiveAppointmentId = paymentResponse.data.payment.appointment_id;
                    }
                } catch (error) {
                    console.error('Data param error:', error);
                }
            }

            if (effectiveAppointmentId) {
                verifyPayment(effectiveAppointmentId);
            } else {
                navigate('/payment-failure');
            }
        };

        processPayment();
    }, [appointmentId, dataParam, navigate]);

    if (loading) return <Loader />;

    return (
        <div className="payment-success-container">
            <Confetti width={width} height={height} numberOfPieces={250} recycle={false} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="success-box"
            >
                <motion.div
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    style={{ width: 120, margin: '0 auto' }}
                >
                    <Lottie animationData={checkmarkAnimation} loop={false} />
                </motion.div>

                <motion.h2
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="success-heading"
                >
                    Payment Successful! 🎉
                </motion.h2>

                {receipt ? (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="receipt-details"
                    >
                        <p><strong>Appointment ID:</strong> {receipt.id}</p>
                        <p><strong>Doctor:</strong> {receipt.doctor_name}</p>
                        <p><strong>Date:</strong> {new Date(receipt.appointment_date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {receipt.appointment_time.slice(0, 5)}</p>
                        <p><strong>Amount:</strong> NPR {receipt.consultation_fee || 250.00}</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/appointments/patient')}
                            className="view-button"
                        >
                            View Appointments
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="loading-status">
                        <p>Finalizing payment confirmation...</p>
                        <p>Retry attempts: {retryCount}/{MAX_RETRIES}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
