import React, { useState } from 'react';
import { useDoctors } from '../../components/useDoctors';
import '../../style/initialSalaryConfig.css';
import moment from 'moment';

const InitialSalaryConfig = () => {
    const { doctors, loading, error } = useDoctors();
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [baseSalary, setBaseSalary] = useState('');
    const [paymentFrequency, setPaymentFrequency] = useState('monthly');
    const [standardDeductions, setStandardDeductions] = useState([{ name: '', value: '', type: 'fixed' }]);
    const [nextPaymentDate, setNextPaymentDate] = useState('');
    const [saveStatus, setSaveStatus] = useState(null);

    // Handler functions remain the same
    const handleDoctorChange = (event) => setSelectedDoctorId(event.target.value);
    const handleBaseSalaryChange = (event) => setBaseSalary(event.target.value);
    const handlePaymentFrequencyChange = (event) => setPaymentFrequency(event.target.value);
    const handleNextPaymentDateChange = (event) => setNextPaymentDate(event.target.value);

    const handleDeductionChange = (index, event) => {
        const { name, value } = event.target;
        const newDeductions = [...standardDeductions];
        
        // Numeric validation for value field
        if (name === 'value') {
          if (!/^\d*\.?\d*$/.test(value)) return; // Allow numbers and decimals only
          if (newDeductions[index].type === 'percentage' && parseFloat(value) > 100) return;
        }
      
        newDeductions[index][name] = value;
        setStandardDeductions(newDeductions);
      };

    const handleAddDeduction = () => {
        setStandardDeductions([...standardDeductions, { name: '', value: '', type: 'fixed' }]);
    };

    const handleRemoveDeduction = (index) => {
        const newDeductions = [...standardDeductions];
        newDeductions.splice(index, 1);
        setStandardDeductions(newDeductions);
    };

    const handleSaveConfig = async () => {
        // Validate required fields first
        if (!selectedDoctorId || !baseSalary || !paymentFrequency) {
            alert('Please select a doctor and fill all required fields');
            return;
        }

        // Validate deductions
        const deductionsValid = standardDeductions.every(d => 
            d.name.trim() && 
            !isNaN(d.value) && 
            ["fixed", "percentage"].includes(d.type) &&
            (d.type !== 'percentage' || (d.value >= 0 && d.value <= 100))
        );

        if (!deductionsValid) {
            alert("Invalid deduction format. Please check:\n- All deductions need a name\n- Valid numeric value\n- Percentage must be between 0-100");
            return;
        }

        // Validate date format
        if (nextPaymentDate && !moment(nextPaymentDate, 'YYYY-MM-DD', true).isValid()) {
            alert('Invalid date format. Please use YYYY-MM-DD format.');
            return;
        }

        setSaveStatus('loading');
        
        try {
            // Transform deductions to proper format
            const transformedDeductions = standardDeductions
            .filter(d => d.name.trim())
            .map(d => ({
              name: d.name.trim(),
              type: d.type,
              value: d.type === 'percentage' 
                ? parseFloat(d.value) / 100  // Convert percentage to decimal
                : parseFloat(d.value)
            }));

            const configData = {
      doctorId: selectedDoctorId,
      baseSalary: parseFloat(baseSalary),
      payment_frequency: paymentFrequency,
      standardDeductions: transformedDeductions, // Now an array
      nextPaymentDate: nextPaymentDate || moment()
        .add(paymentFrequency === 'monthly' ? 1 : 2, 'weeks')
        .format('YYYY-MM-DD')
    };

            const response = await fetch('/api/salaries/assign-initial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(configData),
            });

            const responseData = await response.json().catch(() => ({
                message: 'Invalid server response'
            }));

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to save configuration');
            }

            setSaveStatus('success');
            alert('Salary configuration saved successfully!');
            
            // Reset form with delay to show success status
            setTimeout(() => {
                setBaseSalary('');
                setPaymentFrequency('monthly');
                setStandardDeductions([{ name: '', value: '', type: 'fixed' }]);
                setNextPaymentDate('');
                setSelectedDoctorId('');
                setSaveStatus(null);
            }, 1500);

        } catch (error) {
            console.error('Save error:', error);
            setSaveStatus('error');
            alert(`Error: ${error.message || 'Failed to save configuration. Check your network connection.'}`);
        }
    };

    if (loading) {
        return (
            <div className="salary-config-container">
                <div className="salary-config-loading">
                    <div className="salary-config-spinner"></div>
                    <p className="salary-config-loading-text">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="salary-config-container">
                <div className="salary-config-error">
                    <p className="salary-config-error-text">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="salary-config-container">
            <h2 className="salary-config-title">Salary Configuration</h2>
            <div className="salary-config-card">
                <div className="form-group">
                    <label htmlFor="doctor" className="form-label required">Doctor</label>
                    <select
                        id="doctor"
                        value={selectedDoctorId}
                        onChange={handleDoctorChange}
                        className="form-select"
                        required
                    >
                        <option value="">Select Doctor</option>
                        {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>
                                {doctor.fullname}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedDoctorId && (
                    <div className="form-section">
                        <div className="form-group">
                            <label htmlFor="baseSalary" className="form-label required">Base Salary</label>
                            <input
                                type="number"
                                id="baseSalary"
                                value={baseSalary}
                                onChange={handleBaseSalaryChange}
                                className="form-input"
                                placeholder="Enter amount"
                                min="0"
                                step="100"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="paymentFrequency" className="form-label required">Payment Frequency</label>
                            <select
                                id="paymentFrequency"
                                value={paymentFrequency}
                                onChange={handlePaymentFrequencyChange}
                                className="form-select"
                                required
                            >
                                <option value="monthly">Monthly</option>
                                <option value="bi-weekly">Bi-Weekly</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <h3 className="form-subheading">Deductions</h3>
                            {standardDeductions.map((deduction, index) => (
                                <div key={index} className="deduction-row">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Name"
                                        value={deduction.name}
                                        onChange={(e) => handleDeductionChange(index, e)}
                                        className="form-input deduction-name"
                                        required
                                    />
                                    <input
  type="number"
  name="value"
  placeholder="Value"
  value={deduction.value}
  onChange={(e) => handleDeductionChange(index, e)}
  className="form-input deduction-value"
  min="0"
  max={deduction.type === 'percentage' ? "100" : undefined}
  step={deduction.type === 'percentage' ? "0.1" : "1"}
  required
/>
{deduction.type === 'percentage' && <span className="percentage-suffix">%</span>}
                                    <select
                                        name="type"
                                        value={deduction.type}
                                        onChange={(e) => handleDeductionChange(index, e)}
                                        className="form-select deduction-type"
                                        required
                                    >
                                        <option value="fixed">Fixed</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                    {standardDeductions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDeduction(index)}
                                            className="deduction-remove"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddDeduction}
                                className="deduction-add"
                            >
                                Add Deduction
                            </button>
                        </div>

                        <div className="form-group">
                            <label htmlFor="nextPaymentDate" className="form-label">Next Payment Date</label>
                            <input
                                type="date"
                                id="nextPaymentDate"
                                value={nextPaymentDate}
                                onChange={handleNextPaymentDateChange}
                                className="form-input"
                                min={moment().format('YYYY-MM-DD')}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={handleSaveConfig}
                                className="save-button"
                                disabled={saveStatus === 'loading'}
                            >
                                {saveStatus === 'loading' ? 'Saving...' : 'Save'}
                            </button>
                            {saveStatus === 'success' && <p className="status-text success">Saved successfully!</p>}
                            {saveStatus === 'error' && <p className="status-text error">Error saving configuration</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialSalaryConfig;