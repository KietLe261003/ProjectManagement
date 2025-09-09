import { useFrappeAuth } from 'frappe-react-sdk';
import React from 'react';

interface HeaderTaskProps {
  role: string | null | undefined;
  currentView: 'user' | 'leader' | 'admin';
  setCurrentView: (view: 'user' | 'leader' | 'admin') => void;
}

const HeaderTask: React.FC<HeaderTaskProps> = ({ role, currentView, setCurrentView }) => {
  const isAdmin = useFrappeAuth().currentUser === "Administrator";
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trình Quản Lý Công Việc</h1>
        </div>
        {(role === 'Leader' || isAdmin) && (
          <div className="inline-flex bg-slate-200 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('user')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                currentView === 'user'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              User
            </button>
            {role === 'Leader' && (
              <button
                onClick={() => setCurrentView('leader')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  currentView === 'leader'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Leader
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  currentView === 'admin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderTask;