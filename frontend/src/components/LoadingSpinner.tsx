import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = '' }) => {
  return (
    <div className={`inline-block animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 h-6 w-6 ${className}`}></div>
  );
};
