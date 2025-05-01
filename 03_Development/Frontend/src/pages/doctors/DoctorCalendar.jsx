import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const DoctorCalendar = ({ selectedDate, onDateChange, availableDays }) => {
  const daysMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  // Normalize the availableDays to ensure correct casing
  const allowedDays = new Set(availableDays.map(day => daysMap[day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()]));

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      // Disable days not in availableDays
      return !allowedDays.has(date.getDay());
    }
    return false;
  };

  return (
    <Calendar
      onChange={onDateChange}
      value={selectedDate}
      minDate={new Date()} // Ensure the calendar starts from today's date
      tileDisabled={tileDisabled}
    />
  );
};

export default DoctorCalendar;
