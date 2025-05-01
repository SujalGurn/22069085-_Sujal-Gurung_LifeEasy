import React from "react";

export function Badge({ children, className = "" }) {
  return (
    <span className={`bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded ${className}`}>
      {children}
    </span>
  );
}
