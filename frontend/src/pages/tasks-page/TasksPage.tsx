import React from 'react';
import { useUserAssignedTasks, useUserRoleOfTeam } from '../../services';
import { useTeamData } from '../../hooks/useTeamData';
import type { TaskItem } from '@/types';
import EditTaskModal from './components/EditTaskModal';
import './TasksPage.css';

export const TasksPage: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<'user' | 'leader'>('user');
  const [activeTab, setActiveTab] = React.useState<'list' | 'kanban' | 'calendar'>('list');
  const [selectedMember, setSelectedMember] = React.useState<string | null>(null);
  
  // Modal state for editing tasks/subtasks
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = React.useState<TaskItem | null>(null);

  // Fetch user's assigned tasks and subtasks
  const { tasks, subTasks, isLoading, error, mutate, currentUser } = useUserAssignedTasks();
  const role = useUserRoleOfTeam();
  console.log("User role: ", role);
  // Set initial view based on user role
  React.useEffect(() => {
    if (role === 'Leader') {
      setCurrentView('leader');
    }
  }, [role]);
  // Transform tasks and subtasks to match the expected TaskItem structure
  const transformedTasks = React.useMemo((): TaskItem[] => {
    const taskItems: TaskItem[] = [];

    // Transform Tasks
    tasks.forEach((task) => {
      taskItems.push({
        id: task.name,
        title: task.subject || 'Untitled Task',
        description: task.description || 'No description available',
        project: task.project_name || task.project || 'Unknown Project',
        assignee: currentUser || 'Unknown',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        dueDate: task.exp_end_date || new Date().toISOString().split('T')[0],
        labels: [task.type || 'Task'],
        todoId: task.assignedTodo?.name || '',
        referenceName: task.name,
        referenceType: 'Task',
        type: 'Task',
        taskProgress: task.progress,
        expectedTime: task.expected_time,
        actualTime: task.actual_time,
        startDate: task.exp_start_date,
        endDate: task.exp_end_date
      });
    });

    // Transform SubTasks
    subTasks.forEach((subTask) => {
      taskItems.push({
        id: subTask.name,
        title: subTask.subject || 'Untitled SubTask',
        description: subTask.description || 'No description available',
        project: subTask.project_name || 'Unknown Project',
        assignee: currentUser || 'Unknown',
        status: subTask.status || 'Open',
        priority: 'Medium', // SubTasks don't have priority field
        dueDate: subTask.end_date || new Date().toISOString().split('T')[0],
        labels: ['SubTask'],
        todoId: subTask.assignedTodo?.name || '',
        referenceName: subTask.name,
        referenceType: 'SubTask',
        type: 'SubTask',
        parentTask: subTask.task_subject,
        startDate: subTask.start_date,
        endDate: subTask.end_date
      });
    });

    return taskItems.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [tasks, subTasks, currentUser]);

  // Use team data hook
  const { teamMembersData, allTransformedTasks, error: teamDataError } = useTeamData();
  console.log("Team member data nek: ", teamMembersData);

  // Calculate statistics from all team tasks for leader view, user tasks for user view
  const statistics = React.useMemo(() => {
    const tasksToAnalyze = currentView === 'leader' ? allTransformedTasks : transformedTasks;
    const total = tasksToAnalyze.length;
    const inProgress = tasksToAnalyze.filter(task => task.status === 'Working').length;
    const completed = tasksToAnalyze.filter(task => task.status === 'Completed').length;
    const overdue = tasksToAnalyze.filter(task => {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate < today && task.status !== 'Completed';
    }).length;

    return { total, inProgress, completed, overdue };
  }, [transformedTasks, allTransformedTasks, currentView]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Working': return 'text-orange-800 bg-orange-100';
      case 'Open': return 'text-sky-800 bg-sky-100';
      case 'Completed': return 'text-emerald-800 bg-emerald-100';
      case 'Cancelled': return 'text-red-800 bg-red-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-800 bg-red-100';
      case 'Medium': return 'text-amber-800 bg-amber-100';
      case 'Low': return 'text-green-800 bg-green-100';
      default: return 'text-slate-800 bg-slate-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isOverdue = date < today;
    const formatted = date.toLocaleDateString('vi-VN');
    
    return {
      formatted,
      isOverdue,
      display: isOverdue ? `${formatted} (Trễ)` : formatted
    };
  };

  const handleRefresh = () => {
    mutate();
  };

  // Handle task click for editing
  const handleTaskClick = (task: TaskItem) => {
    setSelectedTaskForEdit(task);
    setEditModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedTaskForEdit(null);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    mutate(); // Refresh data
    if (currentView === 'leader') {
      // Refresh team data if needed
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header và Nút chuyển đổi Role */}
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

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message || 'Failed to load your tasks. Please try again.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nội dung chính */}
        <main>
          {/* GIAO DIỆN USER */}
          {currentView === 'user' && (
            <div className="space-y-8">
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Việc của tôi</h2>
                  <button 
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="mt-4 sm:mt-0 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    )}
                    {isLoading ? 'Đang tải...' : 'Làm mới'}
                  </button>
                </div>

                {/* Chế độ xem: List, Board, Calendar */}
                <div className="mt-4 border-b border-slate-200">
                  <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('list')}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'list'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Danh sách
                    </button>
                    <button
                      onClick={() => setActiveTab('kanban')}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'kanban'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Bảng Kanban
                    </button>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'calendar'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Lịch
                    </button>
                  </nav>
                </div>

                {/* Bảng danh sách công việc */}
                {activeTab === 'list' && (
                  <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-100 rounded-t-lg">
                          <tr>
                            <th scope="col" className="px-6 py-3">Tên công việc</th>
                            <th scope="col" className="px-6 py-3">Loại</th>
                            <th scope="col" className="px-6 py-3">Dự án</th>
                            <th scope="col" className="px-6 py-3">Tiến độ</th>
                            <th scope="col" className="px-6 py-3">Ngày hết hạn</th>
                            <th scope="col" className="px-6 py-3">Ưu tiên</th>
                            <th scope="col" className="px-6 py-3">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transformedTasks.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                {isLoading ? 'Đang tải...' : 'Không có công việc nào'}
                              </td>
                            </tr>
                          ) : (
                            transformedTasks.map((task) => {
                              const dateInfo = formatDate(task.dueDate);
                              return (
                                <tr 
                                  key={task.id} 
                                  className="bg-white border-b border-slate-200 hover:bg-slate-50 table-row transition-all cursor-pointer"
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      {task.type === 'SubTask' && (
                                        <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      {task.title}
                                    </div>
                                    {task.parentTask && (
                                      <div className="text-xs text-slate-500 mt-1">
                                        ↳ Subtask của: {task.parentTask}
                                      </div>
                                    )}
                                  </th>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      task.type === 'Task' 
                                        ? 'text-blue-800 bg-blue-100' 
                                        : 'text-purple-800 bg-purple-100'
                                    }`}>
                                      {task.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">{task.project}</td>
                                  <td className="px-6 py-4">
                                    {task.taskProgress !== undefined ? (
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                                          <div 
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                            style={{ width: `${task.taskProgress}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium min-w-[3rem]">
                                          {task.taskProgress}%
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">N/A</span>
                                    )}
                                  </td>
                                  <td className={`px-6 py-4 ${dateInfo.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                    {dateInfo.display}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`status-badge ${getStatusColor(task.status)}`}>
                                      {task.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bảng Kanban */}
                {activeTab === 'kanban' && (
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Cần làm */}
                      <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          Cần làm ({transformedTasks.filter(t => t.status === 'Open').length})
                        </h3>
                        <div className="space-y-4">
                          {transformedTasks.filter(t => t.status === 'Open').map(task => (
                            <div 
                              key={task.id} 
                              className="kanban-card bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer"
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-slate-900 flex-1">{task.title}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                                  task.type === 'Task' 
                                    ? 'text-blue-800 bg-blue-100' 
                                    : 'text-purple-800 bg-purple-100'
                                }`}>
                                  {task.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mb-3">{task.project}</p>
                              
                              {/* Progress bar */}
                              {task.taskProgress !== undefined && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Tiến độ</span>
                                    <span className="text-xs text-slate-600 font-medium">{task.taskProgress}%</span>
                                  </div>
                                  <div className="bg-slate-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                                      style={{ width: `${task.taskProgress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="text-xs text-slate-500">{formatDate(task.dueDate).formatted}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Đang làm */}
                      <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Đang làm ({transformedTasks.filter(t => t.status === 'Working').length})
                        </h3>
                        <div className="space-y-4">
                          {transformedTasks.filter(t => t.status === 'Working').map(task => (
                            <div 
                              key={task.id} 
                              className="kanban-card bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer"
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-slate-900 flex-1">{task.title}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                                  task.type === 'Task' 
                                    ? 'text-blue-800 bg-blue-100' 
                                    : 'text-purple-800 bg-purple-100'
                                }`}>
                                  {task.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mb-3">{task.project}</p>
                              
                              {/* Progress bar */}
                              {task.taskProgress !== undefined && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Tiến độ</span>
                                    <span className="text-xs text-slate-600 font-medium">{task.taskProgress}%</span>
                                  </div>
                                  <div className="bg-slate-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" 
                                      style={{ width: `${task.taskProgress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="text-xs text-slate-500">{formatDate(task.dueDate).formatted}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hoàn thành */}
                      <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Hoàn thành ({transformedTasks.filter(t => t.status === 'Completed').length})
                        </h3>
                        <div className="space-y-4">
                          {transformedTasks.filter(t => t.status === 'Completed').map(task => (
                            <div 
                              key={task.id} 
                              className="kanban-card bg-white p-4 rounded-lg shadow-sm border border-slate-200 opacity-70 cursor-pointer"
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-slate-900 line-through flex-1">{task.title}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                                  task.type === 'Task' 
                                    ? 'text-blue-800 bg-blue-100' 
                                    : 'text-purple-800 bg-purple-100'
                                }`}>
                                  {task.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mb-3">{task.project}</p>
                              
                              {/* Progress bar - should be 100% for completed */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-600">Tiến độ</span>
                                  <span className="text-xs text-slate-600 font-medium">100%</span>
                                </div>
                                <div className="bg-slate-200 rounded-full h-1.5">
                                  <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className="text-xs text-slate-500">{formatDate(task.dueDate).formatted}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendar placeholder */}
                {activeTab === 'calendar' && (
                  <div className="mt-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-center text-slate-500">
                      <p>Giao diện lịch sẽ được phát triển trong tương lai</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* GIAO DIỆN LEADER */}
          {currentView === 'leader' && role === 'Leader' && (
            <div className="space-y-8">
              {/* Dashboard tổng quan */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard Tổng Quan</h2>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Tổng công việc</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{statistics.total}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Đang thực hiện</p>
                    <p className="text-3xl font-bold text-orange-500 mt-1">{statistics.inProgress}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Hoàn thành</p>
                    <p className="text-3xl font-bold text-emerald-500 mt-1">{statistics.completed}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Trễ hạn</p>
                    <p className="text-3xl font-bold text-red-500 mt-1">{statistics.overdue}</p>
                  </div>
                </div>
              </section>

              {/* Quản lý Nhóm & Khối lượng công việc */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900">Quản lý Nhóm</h2>
                
                {/* Warning message for permission issues */}
                {teamDataError?.message?.includes('PermissionError') && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Quyền truy cập hạn chế</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>Không thể truy cập đầy đủ dữ liệu team members. Hiển thị dữ liệu cơ bản từ danh sách users.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Cột danh sách thành viên */}
                  <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 px-2">
                      Thành viên nhóm ({teamMembersData.length})
                    </h3>
                    <ul className="space-y-2">
                      {teamMembersData.map((member) => (
                        <li
                          key={member.id}
                          onClick={() => setSelectedMember(member.id)}
                          className={`member-item p-3 border rounded-lg hover:bg-slate-100 cursor-pointer transition-all ${
                            selectedMember === member.id ? 'active' : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={member.avatar}
                              alt={member.name}
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{member.name}</p>
                              <p className="text-sm text-slate-500">{member.taskCount} công việc</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cột chi tiết công việc của thành viên */}
                  <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[300px]">
                    {selectedMember ? (
                      (() => {
                        const member = teamMembersData.find(m => m.id === selectedMember);
                        if (!member) return <div className="flex items-center justify-center h-full text-slate-500"><p>Không tìm thấy thành viên.</p></div>;
                        
                        return (
                          <div>
                            <h3 className="font-bold text-slate-800 mb-4">Công việc của {member.name}</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                                  <tr>
                                    <th className="px-4 py-2">Tên công việc</th>
                                    <th className="px-4 py-2">Loại</th>
                                    <th className="px-4 py-2">Dự án</th>
                                    <th className="px-4 py-2">Tiến độ</th>
                                    <th className="px-4 py-2">Hạn chót</th>
                                    <th className="px-4 py-2">Trạng thái</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {member.tasks.length === 0 ? (
                                    <tr>
                                      <td colSpan={6} className="text-center py-4 text-slate-500">
                                        Thành viên này chưa có công việc nào.
                                      </td>
                                    </tr>
                                  ) : (
                                    member.tasks.map((task) => (
                                      <tr 
                                        key={task.id} 
                                        className="border-b border-slate-200 cursor-pointer hover:bg-slate-50"
                                        onClick={() => handleTaskClick(task)}
                                      >
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                          <div className="flex items-center gap-2">
                                            {task.type === 'SubTask' && (
                                              <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                            {task.title}
                                          </div>
                                          {task.parentTask && (
                                            <div className="text-xs text-slate-500 mt-1">
                                              ↳ Subtask của: {task.parentTask}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            task.type === 'Task' 
                                              ? 'text-blue-800 bg-blue-100' 
                                              : 'text-purple-800 bg-purple-100'
                                          }`}>
                                            {task.type}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">{task.project}</td>
                                        <td className="px-4 py-3">
                                          {task.taskProgress !== undefined ? (
                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 bg-slate-200 rounded-full h-1.5 min-w-[60px]">
                                                <div 
                                                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                                                  style={{ width: `${task.taskProgress}%` }}
                                                ></div>
                                              </div>
                                              <span className="text-xs text-slate-600 font-medium min-w-[2.5rem]">
                                                {task.taskProgress}%
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-slate-400">N/A</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3">{formatDate(task.dueDate).display}</td>
                                        <td className="px-4 py-3">
                                          <span className={`status-badge ${getStatusColor(task.status)}`}>
                                            {task.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <p>Chọn một thành viên để xem công việc của họ.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
      
      {/* Edit Task Modal */}
      <EditTaskModal
        task={selectedTaskForEdit}
        isOpen={editModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};
