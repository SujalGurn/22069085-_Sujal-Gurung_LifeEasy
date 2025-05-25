import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentFailure = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const transactionUuid = query.get('transaction_uuid');

        if (transactionUuid) {
            alert('Payment failed. Please try again.');
            navigate('/appointments/patient');
        } else {
            navigate('/appointments/patient');
        }
    }, [location, navigate]);

    return <div>Payment Failed...</div>;
};

export default PaymentFailure;