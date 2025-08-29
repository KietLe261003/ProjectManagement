import { useAllTaskOfTeam } from '@/services';
import { getStatusColor } from '@/utils/color';
import React from 'react';

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

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cột danh sách thành viên */}
          <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 px-2">Thành viên nhóm ({teamMembersData.length})</h3>
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
                    <img className="h-10 w-10 rounded-full" src={member.avatar} alt={member.name} />
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
                const member = teamMembersData.find((m) => m.id === selectedMember);
                if (!member)
                  return (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p>Không tìm thấy thành viên.</p>
                    </div>
                  );

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
                            member.tasks.map((task: any) => (
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
                                <td className="px-4 py-3">{task.project}</td>
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
                                <td className="px-4 py-3">{formatDate(task.dueDate).display}</td>
                                <td className="px-4 py-3">
                                  <span className={`status-badge ${getStatusColor(task.status)}`}>{task.status}</span>
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
  );
};

export default LeaderTasksView;