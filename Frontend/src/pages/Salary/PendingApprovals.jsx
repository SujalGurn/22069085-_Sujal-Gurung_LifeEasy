import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../UserContext'; // Ensure correct path to your UserContext

const PendingApprovals = () => {
    const { token } = useContext(UserContext); // Access the token from the context
    const [pendingSalaries, setPendingSalaries] = useState([]);
    const [edits, setEdits] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPending = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('/api/salaries/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`, // Include the token in the request headers
                },
            });
            setPendingSalaries(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch pending salaries:', error);
            setError(error.message || 'Failed to fetch pending salaries.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPending(); // Initial fetch

            // Set up polling interval (e.g., every 5 seconds = 5000 milliseconds)
            const intervalId = setInterval(fetchPending, 5000);

            // Clean up the interval when the component unmounts
            return () => clearInterval(intervalId);
        }
    }, [token]);

    const handleAdjustment = (salaryId, deductionName, value) => {
        setEdits(prev => ({
            ...prev,
            [salaryId]: {
                ...prev[salaryId],
                [deductionName]: parseFloat(value) || 0,
            },
        }));
    };

    const handleApprove = async (salaryId) => {
        try {
            const adjustments = Object.entries(edits[salaryId] || {}).map(([name, adjustment]) => ({
                name,
                adjustment,
            }));

            await axios.put(`/api/salaries/approve/${salaryId}`, { adjustments }, {
                headers: {
                    'Authorization': `Bearer ${token}`, // Include the token for approving
                },
            });
            setPendingSalaries(prev => prev.filter(s => s.id !== salaryId));
            alert('Salary approved successfully!');
        } catch (error) {
            console.error('Failed to approve salary:', error);
            alert('Approval failed');
        }
    };

    if (loading) {
        return <div>Loading pending salaries...</div>;
    }

    if (error) {
        return <div>Error loading pending salaries: {error}</div>;
    }

    return (
        <div className="pending-approvals">
            <h2>Pending Salary Approvals</h2>
            <div className="salary-list">
                {pendingSalaries.map(salary => (
                    <div key={salary.id} className="salary-card">
                        <div className="header">
                            <h3>{salary.doctor_name}</h3>
                            <span className="amount">
                                ₹{salary.gross_amount} (Gross)
                            </span>
                        </div>

                        <div className="deductions">
                            <h4>Deductions:</h4>
                            {JSON.parse(salary.deduction_details).map(deduction => (
                                <div key={deduction.name} className="deduction-item">
                                    <label>{deduction.name}:</label>
                                    <input
                                        type="number"
                                        value={edits[salary.id]?.[deduction.name] || deduction.calculated}
                                        onChange={(e) => handleAdjustment(salary.id, deduction.name, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="summary">
                            <p>Total Deductions: ₹{salary.total_deductions}</p>
                            <p>Net Salary: ₹{salary.net_amount}</p>
                        </div>

                        <button
                            className="approve-btn"
                            onClick={() => handleApprove(salary.id)}
                        >
                            Approve Salary
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingApprovals;