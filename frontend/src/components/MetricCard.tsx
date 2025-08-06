import React from 'react';

interface MetricCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ value, label, className = '' }) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-4xl font-bold text-blue-600 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-500">
        {label}
      </div>
    </div>
  );
};
