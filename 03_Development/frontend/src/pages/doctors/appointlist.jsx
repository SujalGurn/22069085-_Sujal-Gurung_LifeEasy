import React from 'react';

const AppointList = ({ appointments = [] }) => {
  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <p className="text-gray-500">No pending appointments</p>
      ) : (
        appointments.map(appointment => (
<div key={appointment.id} className="p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold">{appointment.patient}</p>
            <p className="text-sm text-gray-600">Date: {appointment.date || 'N/A'}</p>
            <p className="text-sm text-gray-600">Time: {appointment.time}</p>
            <p className="text-sm text-gray-600">Condition: {appointment.condition}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default AppointList;