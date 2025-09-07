import React from 'react';

interface HeaderTaskProps {
  role: string | null | undefined;
  currentView: 'user' | 'leader';
  setCurrentView: (view: 'user' | 'leader') => void;
}

const HeaderTask: React.FC<HeaderTaskProps> = ({ role, currentView, setCurrentView }) => {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trình Quản Lý Công Việc</h1>
          <p className="text-slate-500 mt-1">
            Quản lý công việc và dự án một cách hiệu quả • Role: {role || 'Member'}
          </p>
        </div>
        {role === 'Leader' && (
          <div className="inline-flex bg-slate-200 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('user')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                currentView === 'user'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Giao diện User
            </button>
            <button
              onClick={() => setCurrentView('leader')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                currentView === 'leader'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Giao diện Leader
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderTask;