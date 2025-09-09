import React from 'react';

interface SimplePageProps {
  title: string;
  description: string;
}

export const SimplePage: React.FC<SimplePageProps> = ({ title, description }) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {description}
        </p>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12">
          <div className="text-gray-400 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🚧</span>
            </div>
            <p className="text-lg">This page is under construction</p>
            <p className="text-sm mt-2">More features coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
