import React from 'react';

interface CardProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 mb-6 ${className}`}>
      {title && (
        <div className="text-xl font-semibold text-gray-800 mb-4">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};
