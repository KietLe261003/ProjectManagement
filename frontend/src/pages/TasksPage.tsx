import React from 'react';
import { Plus, Search, Filter, Calendar, User, Flag } from 'lucide-react';

const tasks = [
  {
    id: 1,
    title: 'Design user interface mockups',
    description: 'Create wireframes and high-fidelity mockups for the new dashboard',
    project: 'E-commerce Platform',
    assignee: 'Jane Smith',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2024-03-10',
    labels: ['Design', 'UI/UX']
  },
  {
    id: 2,
    title: 'Implement authentication system',
    description: 'Set up JWT-based authentication with login and registration',
    project: 'E-commerce Platform',
    assignee: 'John Doe',
    status: 'Todo',
    priority: 'High',
    dueDate: '2024-03-12',
    labels: ['Backend', 'Security']
  },
  {
    id: 3,
    title: 'Write API documentation',
    description: 'Document all REST API endpoints with examples',
    project: 'Mobile App Redesign',
    assignee: 'Mike Johnson',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: '2024-03-15',
    labels: ['Documentation', 'API']
  },
  {
    id: 4,
    title: 'Set up testing environment',
    description: 'Configure Jest and React Testing Library for unit tests',
    project: 'Data Analytics Dashboard',
    assignee: 'Sarah Wilson',
    status: 'Done',
    priority: 'Low',
    dueDate: '2024-03-08',
    labels: ['Testing', 'Setup']
  },
  {
    id: 5,
    title: 'Optimize database queries',
    description: 'Improve performance of slow database queries',
    project: 'E-commerce Platform',
    assignee: 'Tom Brown',
    status: 'Todo',
    priority: 'Medium',
    dueDate: '2024-03-18',
    labels: ['Backend', 'Performance']
  }
];

const statusColors = {
  'Todo': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Done': 'bg-green-100 text-green-800',
  'Blocked': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-red-100 text-red-800'
};

export const TasksPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = React.useState<string>('All');
  const [selectedPriority, setSelectedPriority] = React.useState<string>('All');

  const filteredTasks = tasks.filter(task => {
    const statusMatch = selectedStatus === 'All' || task.status === selectedStatus;
    const priorityMatch = selectedPriority === 'All' || task.priority === selectedPriority;
    return statusMatch && priorityMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Tasks
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all your tasks across projects
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Search tasks..."
              />
            </div>

            {/* Status Filter */}
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Blocked">Blocked</option>
            </select>

            {/* Priority Filter */}
            <select 
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Tasks ({filteredTasks.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    checked={task.status === 'Done'}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    readOnly
                  />
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {task.description}
                      </p>
                      
                      {/* Labels */}
                      <div className="flex items-center space-x-2 mb-3">
                        {task.labels.map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {label}
                          </span>
                        ))}
                      </div>

                      {/* Task Meta */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {task.dueDate}
                        </div>
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {task.assignee}
                        </div>
                        <div className="flex items-center">
                          <span>{task.project}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Priority */}
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}>
                        {task.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                        <Flag className="mr-1 h-3 w-3" />
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'Todo').length}
            </div>
            <div className="text-sm text-gray-500">Todo</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'In Progress').length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'Done').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
        </div>
      </div>
    </div>
  );
};
