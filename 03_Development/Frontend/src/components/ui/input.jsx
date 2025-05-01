// components/ui/Input.jsx

import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, disabled = false, required = false, ...rest }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '1rem',
          outline: 'none',
        }}
        {...rest}
      />
    </div>
  );
};

export default Input;
