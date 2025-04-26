import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageAvailability = () => {
  const token = localStorage.getItem('token'); // ✅ Fixed: token from localStorage
  const [availability, setAvailability] = useState([]);
  const [newDay, setNewDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editSlot, setEditSlot] = useState(null); // New state for editing

  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:3002/api/availability', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const handleAddAvailability = async () => {
    if (!newDay || !startTime || !endTime) {
      setMessage('All fields are required.');
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3002/api/availability',
        {
          days: [
            {
              day_of_week: newDay,
              start_time: startTime,
              end_time: endTime,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        setMessage(res.data.message);
        setNewDay('');
        setStartTime('');
        setEndTime('');
        fetchAvailability();
      } else {
        setMessage(res.data.message || 'Failed to add availability');
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      setMessage(error.response?.data?.message || 'Failed to add availability');
    }
  };

  const handleDelete = async (id) => {
    const updatedAvailability = availability.filter(slot => slot.id !== id);
    setAvailability(updatedAvailability);

    try {
      const res = await axios.delete(`http://localhost:3002/api/availability/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        setMessage('Availability deleted successfully');
      } else {
        setMessage('Failed to delete availability');
        fetchAvailability(); // Re-fetch if deletion fails
      }
    } catch (error) {
      console.error('Failed to delete availability', error);
      setMessage('Error deleting availability');
      fetchAvailability(); // Re-fetch if deletion fails
    }
  };

  const handleEdit = (slot) => {
    setEditSlot(slot); // Set the slot to edit
    setNewDay(slot.day_of_week);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
  };

  const handleUpdateAvailability = async () => {
    if (!newDay || !startTime || !endTime) {
      setMessage('All fields are required.');
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:3002/api/doctors/availability/${editSlot.id}`,
        {
          day_of_week: newDay,
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
        setEditSlot(null); // Clear edit state
        setNewDay('');
        setStartTime('');
        setEndTime('');
        fetchAvailability();
      } else {
        setMessage('Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      setMessage(error.response?.data?.message || 'Failed to update availability');
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Manage Availability</h2>

      {message && (
        <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <select
          className="border p-2 rounded"
          value={newDay}
          onChange={(e) => setNewDay(e.target.value)}
        >
          <option value="">Select Day</option>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (day) => (
              <option key={day} value={day}>
                {day}
              </option>
            )
          )}
        </select>
        <input
          type="time"
          className="border p-2 rounded"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <input
          type="time"
          className="border p-2 rounded"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <button
          onClick={editSlot ? handleUpdateAvailability : handleAddAvailability}
          className="bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
        >
          {editSlot ? 'Update' : 'Add'}
        </button>
      </div>

      {isLoading && <div>Loading...</div>}

      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-700">Your Schedule</h3>
        {availability.length === 0 ? (
          <p className="text-gray-500">No availability added yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {availability.map((slot) => (
              <li key={slot.id} className="flex justify-between py-2 items-center">
                <span>
                  {slot.day_of_week}: {slot.start_time} - {slot.end_time}
                </span>
                <button
                  onClick={() => handleEdit(slot)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManageAvailability;
