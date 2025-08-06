import React from 'react';
import { getStatusClass, getPriorityClass } from '../utils/formatters';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium inline-block";
  const specificClass = type === 'status' ? getStatusClass(status) : getPriorityClass(status);
  
  return (
    <span className={`${baseClasses} ${specificClass}`}>
      {status}
    </span>
  );
};
