import { useAllTaskOfTeam } from '@/services';
import { getStatusColor } from '@/utils/color';
import React, { useState, useMemo } from 'react';

interface LeaderTasksViewProps {
  teamDataError: any;
  teamMembersData: any[];
  selectedMember: string | null;
  setSelectedMember: (id: string | null) => void;
  formatDate: (dateString: string) => { formatted: string; isOverdue: boolean; display: string };
  handleTaskClick: (task: any) => void;
}

const LeaderTasksView: React.FC<LeaderTasksViewProps> = ({
  teamDataError,
  teamMembersData,
  selectedMember,
  setSelectedMember,
  formatDate,
  handleTaskClick,
}) => {
  const status = useAllTaskOfTeam();
  
  // States for user search and pagination
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [usersPerPage] = useState(5);
  
  // States for task search and filtering
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const [tasksPerPage] = useState(10);
  
  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    return teamMembersData.filter(member =>
      member.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      member.id.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [teamMembersData, userSearchTerm]);
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentUserPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentUserPage, usersPerPage]);
  
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  // Filter and paginate tasks for selected member
  const filteredTasks = useMemo(() => {
    if (!selectedMember) return [];
    
    const member = teamMembersData.find((m) => m.id === selectedMember);
    if (!member) return [];
    
    return member.tasks.filter((task: any) => {
      const matchesSearch = task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                           task.project.toLowerCase().includes(taskSearchTerm.toLowerCase());
      
      const matchesStatus = taskStatusFilter === '' || task.status === taskStatusFilter;
      const matchesType = taskTypeFilter === '' || task.type === taskTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [selectedMember, teamMembersData, taskSearchTerm, taskStatusFilter, taskTypeFilter]);
  
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentTaskPage - 1) * tasksPerPage;
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [filteredTasks, currentTaskPage, tasksPerPage]);
  
  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage);
  
  // Reset task pagination when filters change
  React.useEffect(() => {
    setCurrentTaskPage(1);
  }, [taskSearchTerm, taskStatusFilter, taskTypeFilter, selectedMember]);
  
  // Reset user pagination when search changes
  React.useEffect(() => {
    setCurrentUserPage(1);
  }, [userSearchTerm]);
  
  // Helper function to set current user page
  const setCurrentUserPageSafe = (page: number) => {
    setCurrentUserPage(Math.max(1, Math.min(page, totalUserPages)));
  };
  
  // Helper function to set current task page
  const setCurrentTaskPageSafe = (page: number) => {
    setCurrentTaskPage(Math.max(1, Math.min(page, totalTaskPages)));
  };
  return (
    <div className="space-y-8">
      {/* Dashboard tổng quan */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Tổng Quan</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Tổng công việc</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{status.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Đang thực hiện</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">{status.working}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Hoàn thành</p>
            <p className="text-3xl font-bold text-emerald-500 mt-1">{status.completed}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Trễ hạn</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{status.overdue}</p>
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

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          {/* Cột danh sách thành viên */}
          <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Thành viên nhóm ({filteredUsers.length})</h3>
            </div>
            
            {/* User Search */}
            <div className="mb-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm thành viên..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            
            {/* User List */}
            <ul className="space-y-2 mb-4">
              {paginatedUsers.map((member) => (
                <li
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className={`member-item p-3 border rounded-lg hover:bg-slate-100 cursor-pointer transition-all ${
                    selectedMember === member.id ? 'active border-indigo-500 bg-indigo-50' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover" src={member.avatar} alt={member.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.taskCount} công việc</p>
                      <p className="text-xs text-slate-400">{member.role}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* User Pagination */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentUserPageSafe(currentUserPage - 1)}
                  disabled={currentUserPage === 1}
                  className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-xs text-slate-500">
                  Trang {currentUserPage} / {totalUserPages}
                </span>
                <button
                  onClick={() => setCurrentUserPageSafe(currentUserPage + 1)}
                  disabled={currentUserPage === totalUserPages}
                  className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>

          {/* Cột chi tiết công việc của thành viên */}
          <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[300px]">
            {selectedMember ? (
              (() => {
                const member = teamMembersData.find((m) => m.id === selectedMember);
                if (!member)
                  return (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p>Không tìm thấy thành viên.</p>
                    </div>
                  );

                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">Công việc của {member.name}</h3>
                      <span className="text-sm text-slate-500">({filteredTasks.length} công việc)</span>
                    </div>
                    
                    {/* Task Search and Filters */}
                    <div className="mb-6 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Tìm kiếm công việc..."
                          value={taskSearchTerm}
                          onChange={(e) => setTaskSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                      
                      {/* Filters */}
                      <div className="flex gap-4">
                        <select
                          value={taskStatusFilter}
                          onChange={(e) => setTaskStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                          <option value="">Tất cả trạng thái</option>
                          <option value="Open">Mở</option>
                          <option value="Working">Đang làm</option>
                          <option value="Pending Review">Chờ duyệt</option>
                          <option value="Completed">Hoàn thành</option>
                          <option value="Cancelled">Đã hủy</option>
                        </select>
                        
                        <select
                          value={taskTypeFilter}
                          onChange={(e) => setTaskTypeFilter(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                          <option value="">Tất cả loại</option>
                          <option value="Task">Task</option>
                          <option value="SubTask">SubTask</option>
                        </select>
                        
                        {(taskSearchTerm || taskStatusFilter || taskTypeFilter) && (
                          <button
                            onClick={() => {
                              setTaskSearchTerm('');
                              setTaskStatusFilter('');
                              setTaskTypeFilter('');
                            }}
                            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 underline"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </div>
                    </div>
                    
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
                          {paginatedTasks.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-500">
                                {filteredTasks.length === 0 && member.tasks.length > 0 
                                  ? "Không tìm thấy công việc phù hợp với bộ lọc."
                                  : "Thành viên này chưa có công việc nào."
                                }
                              </td>
                            </tr>
                          ) : (
                            paginatedTasks.map((task: any) => (
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
                                    <span className="truncate">{task.title}</span>
                                  </div>
                                  {task.parentTask && (
                                    <div className="text-xs text-slate-500 mt-1">↳ Subtask của: {task.parentTask}</div>
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
                                <td className="px-4 py-3 truncate">{task.project}</td>
                                <td className="px-4 py-3">
                                  {task.taskProgress !== undefined ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 min-w-[60px]">
                                        <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${task.taskProgress}%` }}></div>
                                      </div>
                                      <span className="text-xs text-slate-600 font-medium min-w-[2.5rem]">{task.taskProgress}%</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">N/A</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(task.dueDate).display}</td>
                                <td className="px-4 py-3">
                                  <span className={`status-badge ${getStatusColor(task.status)}`}>{task.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Task Pagination */}
                    {totalTaskPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                          Hiển thị {((currentTaskPage - 1) * tasksPerPage) + 1} - {Math.min(currentTaskPage * tasksPerPage, filteredTasks.length)} trong số {filteredTasks.length} công việc
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentTaskPageSafe(currentTaskPage - 1)}
                            disabled={currentTaskPage === 1}
                            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Trước
                          </button>
                          <span className="text-sm text-slate-600">
                            {currentTaskPage} / {totalTaskPages}
                          </span>
                          <button
                            onClick={() => setCurrentTaskPageSafe(currentTaskPage + 1)}
                            disabled={currentTaskPage === totalTaskPages}
                            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p>Chọn một thành viên để xem công việc của họ.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LeaderTasksView;