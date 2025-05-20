import React from "react";

export function Avatar({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
