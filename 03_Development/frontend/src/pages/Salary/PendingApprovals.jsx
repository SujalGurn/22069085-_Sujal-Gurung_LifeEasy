import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../UserContext';
import '../../style/pendingApproval.css';

const PendingApprovals = () => {
    const { token } = useContext(UserContext);
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
                    'Authorization': `Bearer ${token}`,
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
            fetchPending();
            const intervalId = setInterval(fetchPending, 5000);
            return () => clearInterval(intervalId);
        }
    }, [token]);

    const handleAdjustment = (salaryId, deductionName, value) => {
        const numValue = value === '' ? 0 : Number(value);
        
        if (!isNaN(numValue)) {
            setEdits(prev => ({
                ...prev,
                [salaryId]: {
                    ...prev[salaryId],
                    [deductionName]: numValue
                }
            }));
        }
    };

    const handleApprove = async (salaryId) => {
        try {
            const salary = pendingSalaries.find(s => s.id === salaryId);
            
            if (!salary?.deduction_details?.length) {
                throw new Error("No deductions found for this salary");
            }
    
            const adjustments = salary.deduction_details
                .filter(deduction => {
                    const editedValue = edits[salaryId]?.[deduction.name];
                    return typeof editedValue !== 'undefined';
                })
                .map(deduction => {
                    const adjustment = Number(edits[salaryId][deduction.name]) - deduction.calculated;
                    
                    if (isNaN(adjustment)) {
                        throw new Error(`Invalid value for ${deduction.name}`);
                    }
    
                    return {
                        name: deduction.name,
                        adjustment: Number(adjustment.toFixed(2))
                    };
                });
    
            await axios.put(`/api/salaries/approve/${salaryId}`, 
                { adjustments },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            setPendingSalaries(prev => prev.filter(s => s.id !== salaryId));
            alert('Salary approved successfully!');
            
        } catch (error) {
            console.error('Approval Failed:', {
                salaryId,
                error: error.response?.data || error.message
            });
            alert(error.response?.data?.message || error.message);
        }
    };

    if (loading) {
        return (
            <div className="pending-approvals-container">
                <div className="pending-approvals-loading">
                    <div className="pending-approvals-spinner"></div>
                    <p className="pending-approvals-loading-text">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pending-approvals-container">
                <div className="pending-approvals-error">
                    <p className="pending-approvals-error-text">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-approvals-container">
            <h2 className="pending-approvals-title">Pending Salary Approvals</h2>
            <div className="salary-list">
                {pendingSalaries.length === 0 ? (
                    <div className="salary-empty">
                        <p className="salary-empty-text">No pending salaries to approve.</p>
                    </div>
                ) : (
                    pendingSalaries.map(salary => (
                        <div key={salary.id} className="salary-card">
                            <div className="salary-header">
                                <h3 className="salary-doctor">{salary.doctor_name}</h3>
                                <span className="salary-amount">
                                    ₹{salary.gross_amount} <span className="amount-label">(Gross)</span>
                                </span>
                            </div>

                            <div className="salary-deductions">
                                <h4 className="deductions-heading">Deductions</h4>
                                <div className="deductions-grid">
                                    {salary.deduction_details.map(deduction => (
                                        <div key={deduction.name} className="deduction-item">
                                            <label className="deduction-label">{deduction.name}</label>
                                            <input
                                                type="number"
                                                value={edits[salary.id]?.[deduction.name] || deduction.calculated}
                                                onChange={(e) => handleAdjustment(salary.id, deduction.name, e.target.value)}
                                                className="deduction-input"
                                                placeholder="Enter amount"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="salary-summary">
                                <div className="summary-item">
                                    <span className="summary-label">Total Deductions:</span>
                                    <span className="summary-value">₹{salary.total_deductions}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Net Salary:</span>
                                    <span className="summary-value">₹{salary.net_amount}</span>
                                </div>
                            </div>

                            <div className="salary-actions">
                                <button
                                    className="approve-button"
                                    onClick={() => handleApprove(salary.id)}
                                >
                                    Approve Salary
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PendingApprovals;