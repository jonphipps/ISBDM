import React from 'react';
export default function TabItem({ label, children }) {
  return (
    <div data-testid={`tab-${label?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unknown'}`}>
      <div>{label}</div>
      <div>{children}</div>
    </div>
  );
} 