import React from 'react';
import { Calendar } from 'lucide-react';
import type { Project } from '../../../../types';
import { Card } from '../../../../components/Card';

interface ProjectMilestonesTeamProps {
  projects: Project[];
}

interface Milestone {
  id: string;
  name: string;
  project: string;
  endDate: Date;
  priority: 'Khẩn cấp' | 'Cao' | 'Trung bình' | 'Thấp' ;
  status: 'completed' | 'in progress' | 'upcoming';
  progress: number;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  workload: number;
  taskCount: number;
}

export const ProjectMilestonesTeam: React.FC<ProjectMilestonesTeamProps> = ({ projects }) => {
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
        priority: project.priority as 'Khẩn cấp' | 'Cao' | 'Trung bình' | 'Thấp' ,
        status: project.percent_complete === 100 ? 'completed' as const : 
                project.percent_complete > 0 ? 'in progress' as const : 'upcoming' as const,
        progress: project.percent_complete
      }))
      .filter(milestone => {
        // Chỉ hiển thị các dự án chưa hoàn thành và trong vòng 60 ngày tới
        const endDate = new Date(milestone.endDate);
        endDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return milestone.status !== 'completed' && daysDiff >= -7 && daysDiff <= 60; // Từ 7 ngày quá hạn đến 60 ngày tới
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
        'High': 0,
        'Medium': 2,
        'Low': 3
      };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });
  }, [projects]);

  // Dữ liệu team members (giả)
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      initials: 'SC',
      role: 'Frontend Dev',
      workload: 85,
      taskCount: 8
    },
    {
      id: '2',
      name: 'Mike Johnson',
      initials: 'MJ',
      role: 'Backend Dev',
      workload: 70,
      taskCount: 6
    },
    {
      id: '3',
      name: 'Emma Davis',
      initials: 'ED',
      role: 'Designer',
      workload: 60,
      taskCount: 4
    },
    {
      id: '4',
      name: 'Alex Kim',
      initials: 'AK',
      role: 'QA Engineer',
      workload: 45,
      taskCount: 3
    }
  ];

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
      case 'High':
        return 'text-red-700 bg-red-100 border border-red-200';
      case 'Medium':
        return 'text-orange-700 bg-orange-100 border border-orange-200';
      // Fallback cho các giá trị cũ
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 80) return 'text-red-500';
    if (workload >= 60) return 'text-orange-500';
    if (workload >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left side - Key Milestones */}
      <Card title="Dự án sắp đến hạn">
        <div className="space-y-6 h-80 overflow-y-auto">
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
        </div>
      </Card>

      {/* Right side - Team Workload Distribution */}
      <Card title="Team Workload Distribution">
        <div className="space-y-6 h-80 overflow-y-auto">
          {teamMembers.map((member) => (
            <div key={member.id} className="space-y-3">
              {/* Team Member Header */}
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

              {/* Workload Progress Bar */}
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
    </div>
  );
};
