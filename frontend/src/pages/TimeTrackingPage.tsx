import React from 'react';
import { Clock, Play, Pause, Square } from 'lucide-react';

const timeEntries = [
  {
    id: 1,
    project: 'E-commerce Platform',
    task: 'Design user interface mockups',
    user: 'Jane Smith',
    startTime: '09:00 AM',
    endTime: '11:30 AM',
    duration: '2h 30m',
    date: '2024-03-08'
  },
  {
    id: 2,
    project: 'Mobile App Redesign',
    task: 'API documentation',
    user: 'Mike Johnson',
    startTime: '02:00 PM',
    endTime: '04:15 PM',
    duration: '2h 15m',
    date: '2024-03-08'
  },
  {
    id: 3,
    project: 'Data Analytics Dashboard',
    task: 'Testing setup',
    user: 'Sarah Wilson',
    startTime: '10:30 AM',
    endTime: '12:00 PM',
    duration: '1h 30m',
    date: '2024-03-07'
  }
];

export const TimeTrackingPage: React.FC = () => {
  const [isTracking, setIsTracking] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState('00:00:00');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Time Tracking
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track time spent on projects and tasks
          </p>
        </div>
      </div>

      {/* Time Tracker */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl font-mono font-bold text-gray-900">
            {currentTime}
          </div>
          <div className="flex items-center justify-center space-x-4">
            {!isTracking ? (
              <button 
                onClick={() => setIsTracking(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Timer
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsTracking(false)}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </button>
                <button 
                  onClick={() => {
                    setIsTracking(false);
                    setCurrentTime('00:00:00');
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop
                </button>
              </>
            )}
          </div>
          {isTracking && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>E-commerce Platform</option>
                  <option>Mobile App Redesign</option>
                  <option>Data Analytics Dashboard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Description
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="What are you working on?"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Entries */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Time Entries</h3>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.project}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.task}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.startTime} - {entry.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Clock className="mr-1 h-3 w-3" />
                      {entry.duration}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
