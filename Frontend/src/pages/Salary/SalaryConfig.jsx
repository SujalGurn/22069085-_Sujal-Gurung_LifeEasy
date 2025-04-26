import { useState, useEffect } from 'react';
import axios from 'axios';

const SalaryConfig = () => {
  const [doctors, setDoctors] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    baseSalary: '',
    frequency: 'monthly',
    deductions: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorsRes, deductionsRes] = await Promise.all([
          axios.get('/api/doctors/approved'),
          axios.get('/api/salaries/deduction-types')
        ]);
        
        setDoctors(doctorsRes.data.data);
        setDeductionTypes(deductionsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleDeductionChange = (deduction, checked) => {
    setFormData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        [deduction.name]: {
          type: deduction.calculation_type,
          value: checked ? deduction.default_value : 0
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/salaries/configure', formData);
      alert('Salary configuration saved successfully!');
      setFormData({
        doctorId: '',
        baseSalary: '',
        frequency: 'monthly',
        deductions: {}
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save configuration');
    }
  };

  return (
    <div className="salary-config">
      <h2>Doctor Salary Configuration</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Doctor:</label>
          <select
            value={formData.doctorId}
            onChange={e => setFormData({...formData, doctorId: e.target.value})}
            required
          >
            <option value="">Choose Approved Doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.fullname} ({doctor.specialization})
              </option>
            ))}
          </select>
        
        </div>

        <div className="form-group">
          <label>Base Salary:</label>
          <input
            type="number"
            value={formData.baseSalary}
            onChange={e => setFormData({...formData, baseSalary: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Payment Frequency:</label>
          <select
            value={formData.frequency}
            onChange={e => setFormData({...formData, frequency: e.target.value})}
          >
            <option value="monthly">Monthly</option>
            <option value="bi-weekly">Bi-Weekly</option>
          </select>
        </div>

        <div className="deductions-section">
          <h3>Standard Deductions</h3>
          {deductionTypes.map(deduction => (
            <label key={deduction.id} className="deduction-item">
              <input
                type="checkbox"
                checked={!!formData.deductions[deduction.name]}
                onChange={(e) => handleDeductionChange(deduction, e.target.checked)}
              />
              {deduction.name} (
              {deduction.calculation_type === 'percentage' 
                ? `${deduction.default_value}%`
                : `₹${deduction.default_value}`}
              )
            </label>
          ))}
        </div>

        <button type="submit" className="submit-btn">
          Save Configuration
        </button>
      </form>
    </div>
  );
};

export default SalaryConfig;