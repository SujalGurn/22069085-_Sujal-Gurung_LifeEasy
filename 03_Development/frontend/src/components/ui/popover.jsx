import React, { useState } from "react";

export function Popover({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>
      {isOpen && (
        <div className="absolute z-10 bg-white border rounded-md shadow-lg mt-2 p-4">
          Popover Content
        </div>
      )}
    </div>
  );
}

export function PopoverTrigger({ children }) {
  return <>{children}</>;
}

export function PopoverContent({ children }) {
  return <div>{children}</div>;
}
