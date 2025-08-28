import React from 'react';
import { Calendar } from 'lucide-react';
import type { Project,Task } from '../../../types';
import { Card } from '../../../components/Card';

interface ProjectMilestonesTeamProps {
  projects: Project[];
  tasks: Task[];
  selectedProject?: string | null;
}

interface Milestone {
  id: string;
  name: string;
  project: string;
  endDate: Date;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'completed' | 'in progress' | 'upcoming';
  progress: number;
}

// Interface tạm thời comment - sẽ được sử dụng sau cho Team Workload
/*
interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  workload: number;
  taskCount: number;
}
*/

export const ProjectMilestonesTeam: React.FC<ProjectMilestonesTeamProps> = ({ projects, tasks, selectedProject }) => {
  // Kiểm tra xem có đang filter theo dự án cụ thể không
  const isProjectSpecific = selectedProject && selectedProject !== 'all';
  
  // Dữ liệu milestones dựa trên projects - chỉ hiển thị các dự án sắp đến hạn
  const milestones: Milestone[] = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset giờ để so sánh chính xác theo ngày
    
    const projectMilestones = projects
      .map((project, index) => ({
        id: `milestone-${index}`,
        name: project.project_name,
        project: project.project_name,
        endDate: new Date(project.expected_end_date),
        priority: project.priority as 'Urgent' | 'High' | 'Medium' | 'Low' ,
        status: project.percent_complete === 100 ? 'completed' as const : 
                project.percent_complete > 0 ? 'in progress' as const : 'upcoming' as const,
        progress: project.percent_complete
      }))
      .filter(milestone => {
        // Chỉ hiển thị các dự án chưa hoàn thành và sắp đến hạn (không bao gồm quá hạn)
        const endDate = new Date(milestone.endDate);
        endDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return milestone.status !== 'completed' && daysDiff >= 0 && daysDiff <= 15; // Chỉ từ hôm nay đến 15 ngày tới
      });

    // Sắp xếp theo độ gần với ngày hiện tại (ngày đến hạn gần nhất lên đầu)
    return projectMilestones.sort((a, b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const aEndDate = new Date(a.endDate);
      aEndDate.setHours(0, 0, 0, 0);
      const bEndDate = new Date(b.endDate);
      bEndDate.setHours(0, 0, 0, 0);
      
      const aDaysDiff = Math.abs(aEndDate.getTime() - today.getTime());
      const bDaysDiff = Math.abs(bEndDate.getTime() - today.getTime());
      
      // Sắp xếp theo ngày gần nhất trước
      const dateCompare = aDaysDiff - bDaysDiff;
      if (dateCompare !== 0) return dateCompare;
      
      // Nếu trùng ngày, sắp xếp theo mức độ ưu tiên
      const priorityOrder: Record<string, number> = { 
        'Khẩn cấp': 0, 
        'Cao': 1, 
        'Trung bình': 2, 
        'Thấp': 3,
        'Urgent': 0,
        'High':1,
        'Medium': 2,
        'Low': 3
      };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });
  }, [projects]);

  // Dữ liệu tasks gần đến hạn (khi filter theo dự án cụ thể)
  const upcomingTasks = React.useMemo(() => {
    if (!isProjectSpecific) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks
      .filter(task => {
        // Chỉ hiển thị tasks chưa hoàn thành và có exp_end_date
        if (!task.exp_end_date || task.status === 'Completed') return false;
        
        const endDate = new Date(task.exp_end_date);
        endDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Tasks sắp đến hạn trong vòng 2 ngày tới (không bao gồm quá hạn)
        return daysDiff >= 0 && daysDiff <= 2;
      })
      .sort((a, b) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const aEndDate = new Date(a.exp_end_date);
        aEndDate.setHours(0, 0, 0, 0);
        const bEndDate = new Date(b.exp_end_date);
        bEndDate.setHours(0, 0, 0, 0);
        
        const aDaysDiff = Math.abs(aEndDate.getTime() - today.getTime());
        const bDaysDiff = Math.abs(bEndDate.getTime() - today.getTime());
        
        // Sắp xếp theo ngày gần nhất trước
        const dateCompare = aDaysDiff - bDaysDiff;
        if (dateCompare !== 0) return dateCompare;
        
        // Nếu trùng ngày, sắp xếp theo mức độ ưu tiên
        const priorityOrder: Record<string, number> = { 
          'Urgent': 0, 
          'High': 1, 
          'Medium': 2, 
          'Low': 3
        };
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      });
  }, [tasks, isProjectSpecific]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in progress':
        return 'bg-blue-500';
      case 'upcoming':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Functions tạm thời comment - sẽ được sử dụng sau
  /*
  const getWorkloadColor = (workload: number) => {
    if (workload >= 80) return 'text-red-500';
    if (workload >= 60) return 'text-orange-500';
    if (workload >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };
  */

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (endDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      return { text: `Quá hạn ${Math.abs(daysDiff)} ngày`, color: 'text-red-600', urgent: true };
    } else if (daysDiff === 0) {
      return { text: 'Hôm nay', color: 'text-red-600', urgent: true };
    } else if (daysDiff <= 3) {
      return { text: `${daysDiff} ngày nữa`, color: 'text-red-600', urgent: true };
    } else if (daysDiff <= 7) {
      return { text: `${daysDiff} ngày nữa`, color: 'text-orange-600', urgent: true };
    } else if (daysDiff <= 14) {
      return { text: `${daysDiff} ngày nữa`, color: 'text-yellow-600', urgent: false };
    } else {
      return { text: `${daysDiff} ngày nữa`, color: 'text-gray-600', urgent: false };
    }
  };

  // Helper function tạm thời comment - sẽ được sử dụng sau
  /*
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.name === projectId);
    return project ? project.project_name : projectId;
  };
  */

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Left side - Key Milestones */}
      <Card title={isProjectSpecific ? (
          <>
            <span className="font-bold bg-yellow-200 px-1 rounded">Tasks</span>{" "}
            gần <span className="text-red-600 font-semibold">đến hạn </span> (&lt;2 ngày)
          </>
        ) : (
          <>
            <span className="font-bold bg-yellow-200 px-1 rounded">Dự án</span>{" "}
            sắp <span className="text-red-600 font-semibold">đến hạn</span> (&lt;15 ngày)
          </>
        )}>
        <div className={`space-y-6 ${
          isProjectSpecific 
            ? (upcomingTasks.length >= 3 ? 'h-80 overflow-y-auto' : 'overflow-visible')
            : (milestones.length >= 3 ? 'h-80 overflow-y-auto' : 'overflow-visible')
        }`}>
          {isProjectSpecific ? (
            // Hiển thị Tasks gần đến hạn
            <>
              {upcomingTasks.map((task, index) => {
                const deadlineInfo = getDaysUntilDeadline(new Date(task.exp_end_date));
                return (
                  <div key={`task-${index}`} className="space-y-3">
                    {/* Task Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{task.subject}</h4>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {/* <div className="mt-1 text-xs text-gray-500">
                            Project: {getProjectName(task.project)}
                          </div> */}
                          <div className="mt-1">
                            <span className={`text-xs font-medium ${deadlineInfo.color}`}>
                              {deadlineInfo.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(new Date(task.exp_end_date))}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{task.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 
                                                       task.status === 'Working' ? 'bg-blue-500' : 'bg-gray-300'}`}
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Không có task nào sắp đến hạn</p>
                </div>
              )}
            </>
          ) : (
            // Hiển thị Milestones của dự án
            <>
              {milestones.map((milestone) => {
                const deadlineInfo = getDaysUntilDeadline(milestone.endDate);
                return (
                  <div key={milestone.id} className="space-y-3">
                    {/* Milestone Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(milestone.priority)}`}>
                              {milestone.priority}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className={`text-xs font-medium ${deadlineInfo.color}`}>
                              {deadlineInfo.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(milestone.endDate)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(milestone.status)}`}
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {milestones.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Không có dự án nào sắp đến hạn</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Right side - Team Workload Distribution - Commented out for future use */}
      {/* 
      <Card title="Team Workload Distribution">
        <div className="space-y-6 h-80 overflow-y-auto">
          {teamMembers.map((member) => (
            <div key={member.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                    {member.initials}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getWorkloadColor(member.workload)}`}>
                    {member.workload}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.taskCount} tasks
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gray-800"
                  style={{ width: `${member.workload}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      */}
    </div>
  );
};
