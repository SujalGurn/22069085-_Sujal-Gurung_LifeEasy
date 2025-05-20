import React from "react";

export function Calendar({ children, className = "" }) {
  return (
    <div className={`border p-4 rounded-lg ${className}`}>
      {/* You can customize a real calendar later */}
      {children || "Calendar Placeholder"}
    </div>
  );
}
