import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminManageAvailability = () => {
  const token = localStorage.getItem('token');
  const [availability, setAvailability] = useState([]);
  const [editSlot, setEditSlot] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:3002/api/availability', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAvailability(res.data.availability);
      } else {
        setMessage(res.data.message || 'Failed to fetch availability');
      }
    } catch (error) {
      console.error('Failed to fetch availability', error);
      setMessage('Error fetching availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (slot) => {
    setEditSlot(slot);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setMessage('');
  };

  const handleSaveEdit = async () => {
    if (!editSlot || !startTime || !endTime) {
      setMessage('Please fill in all fields');
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:3002/api/availability/${editSlot.id}`,
        {
          start_time: startTime,
          end_time: endTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setMessage('Availability updated successfully');
        setEditSlot(null);
        fetchAvailability();
      } else {
        setMessage(res.data.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      setMessage('Error updating availability');
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 shadow-sm rounded-lg"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Doctor Availability</h1>

          {message && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
              {message}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading availability...</div>
          ) : availability.length === 0 ? (
            <p className="text-gray-500">No availability data available.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {availability.map((slot) => (
                <li
                  key={slot.id}
                  className="py-4 flex flex-col sm:flex-row justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">
                    <span className="font-medium text-gray-700">
                      {slot.doctor_name || `Doctor #${slot.doctor_id}`}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {slot.day_of_week}:{' '}
                      {editSlot?.id === slot.id ? (
                        <>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 mx-1"
                          />
                          to
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 mx-1"
                          />
                        </>
                      ) : (
                        <span className="text-gray-800">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    {editSlot?.id === slot.id ? (
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mx-1 transition-colors"
                      >
                        Save Changes
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditClick(slot)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mx-1 transition-colors"
                      >
                        Edit Slot
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminManageAvailability;
