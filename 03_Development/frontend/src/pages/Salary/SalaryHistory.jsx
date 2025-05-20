// File: src/components/Salary/SalaryHistory.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const SalaryHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/salaries/history?doctorId=${selectedDoctor}`);
        setHistory(res.data.data);
      } catch (error) {
        console.error('Failed to fetch salary history:', error);
      }
    };

    if (selectedDoctor) fetchHistory();
  }, [selectedDoctor]);

  return (
    <div className="salary-history">
      <h2>Salary Payment History</h2>
      <div className="filters">
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
        >
          <option value="">All Doctors</option>
          {/* Populate with doctors from context or API */}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Doctor</th>
            <th>Gross</th>
            <th>Deductions</th>
            <th>Net</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map(payment => (
            <tr key={payment.id}>
              <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
              <td>{payment.doctor_name}</td>
              <td>₹{payment.gross_amount}</td>
              <td>
                <ul className="deduction-list">
                  {JSON.parse(payment.deduction_details).map(d => (
                    <li key={d.name}>
                      {d.name}: ₹{d.calculated}
                    </li>
                  ))}
                </ul>
              </td>
              <td>₹{payment.net_amount}</td>
              <td className={`status ${payment.status}`}>
                {payment.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalaryHistory;