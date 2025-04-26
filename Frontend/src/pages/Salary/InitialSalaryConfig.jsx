// src/components/InitialSalaryConfig.jsx
import React, { useState } from 'react';
import { useDoctors } from '../../components/useDoctors';

const InitialSalaryConfig = () => {
    const { doctors, loading, error } = useDoctors();
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [baseSalary, setBaseSalary] = useState('');
    const [paymentFrequency, setPaymentFrequency] = useState('monthly');
    const [standardDeductions, setStandardDeductions] = useState([{ name: '', value: '', type: 'fixed' }]);
    const [nextPaymentDate, setNextPaymentDate] = useState('');
    const [saveStatus, setSaveStatus] = useState(null);

    const handleDoctorChange = (event) => setSelectedDoctorId(event.target.value);
    const handleBaseSalaryChange = (event) => setBaseSalary(event.target.value);
    const handlePaymentFrequencyChange = (event) => setPaymentFrequency(event.target.value);
    const handleNextPaymentDateChange = (event) => setNextPaymentDate(event.target.value);

    const handleDeductionChange = (index, event) => {
        const newDeductions = [...standardDeductions];
        newDeductions[index][event.target.name] = event.target.value;
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
        setSaveStatus('loading');
        try {
            const configData = {
                doctorId: selectedDoctorId,
                baseSalary: parseFloat(baseSalary),
                paymentFrequency,
                standardDeductions,
                nextPaymentDate,
            };

            const response = await fetch('/api/salary/initial-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configData),
            });

            if (response.ok) {
                setSaveStatus('success');
                alert('Salary configuration saved successfully!');
                setBaseSalary('');
                setPaymentFrequency('monthly');
                setStandardDeductions([{ name: '', value: '', type: 'fixed' }]);
                setNextPaymentDate('');
                setSelectedDoctorId('');
            } else {
                const errorData = await response.json();
                setSaveStatus('error');
                alert(`Failed: ${errorData.message || 'Internal Server Error'}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveStatus('error');
            alert('Failed to save configuration. Check your network.');
        }
    };

    if (loading) return <p className="text-center">Loading doctors...</p>;
    if (error) return <p className="text-red-500 text-center">Error loading doctors: {error}</p>;

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Initial Salary Configuration</h2>

            <div className="mb-4">
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Doctor
                </label>
                <select
                    id="doctor"
                    value={selectedDoctorId}
                    onChange={handleDoctorChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                    <option value="">-- Select a Doctor --</option>
                    {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                            {doctor.fullname}
                        </option>
                    ))}
                </select>
            </div>

            {selectedDoctorId && (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700 mb-1">
                            Base Salary
                        </label>
                        <input
                            type="number"
                            id="baseSalary"
                            value={baseSalary}
                            onChange={handleBaseSalaryChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>

                    <div>
                        <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Frequency
                        </label>
                        <select
                            id="paymentFrequency"
                            value={paymentFrequency}
                            onChange={handlePaymentFrequencyChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                        </select>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Standard Deductions</h3>
                        {standardDeductions.map((deduction, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Deduction Name"
                                    value={deduction.name}
                                    onChange={(e) => handleDeductionChange(index, e)}
                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                                />
                                <input
                                    type="number"
                                    name="value"
                                    placeholder="Value"
                                    value={deduction.value}
                                    onChange={(e) => handleDeductionChange(index, e)}
                                    className="w-24 border border-gray-300 rounded-md px-3 py-2"
                                />
                                <select
                                    name="type"
                                    value={deduction.type}
                                    onChange={(e) => handleDeductionChange(index, e)}
                                    className="w-32 border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="fixed">Fixed</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                                {standardDeductions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDeduction(index)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddDeduction}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            + Add Deduction
                        </button>
                    </div>

                    <div>
                        <label htmlFor="nextPaymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Next Payment Date
                        </label>
                        <input
                            type="date"
                            id="nextPaymentDate"
                            value={nextPaymentDate}
                            onChange={handleNextPaymentDateChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={handleSaveConfig}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md"
                        >
                            Save Configuration
                        </button>
                        {saveStatus === 'loading' && <p className="text-sm mt-2 text-gray-600">Saving...</p>}
                        {saveStatus === 'success' && <p className="text-sm mt-2 text-green-600">Configuration saved!</p>}
                        {saveStatus === 'error' && <p className="text-sm mt-2 text-red-600">Failed to save.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InitialSalaryConfig;
