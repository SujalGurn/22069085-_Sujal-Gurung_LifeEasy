import React from 'react';

const TimeSlots = ({ slots, selectedSlot, onSelectSlot }) => {
  if (!slots || slots.length === 0) {
    return <p className="text-gray-500 mt-4">No available slots for this day.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {slots.map((slot, index) => (
        <button
          key={index}
          onClick={() => onSelectSlot(slot)}
          className={`py-2 px-4 rounded-md border transition-all ${
            selectedSlot === slot
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-100'
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
};

export default TimeSlots;
