import React, { useState, useMemo } from 'react';
import { Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { Project, Task } from '../../../types';
import { Card } from '../../../components/Card';

interface ProjectGanttChartProps {
  projects: Project[];
  tasks: Task[];
}

interface GanttTask {
  id: string;
  name: string;
  project: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: string;
  priority: string;
  isOverdue: boolean;
  isMilestone: boolean;
  dependencies: string[];
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ projects, tasks }) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [timeView, setTimeView] = useState<'week' | 'month' | 'quarter'>('month');

  // console.log('Gantt tasks:', tasks);
  // console.log('Gantt projects:', projects);

  // Chuyển đổi dữ liệu tasks thành định dạng Gantt
  const ganttTasks = useMemo((): GanttTask[] => {
    const filteredTasks = selectedProject === 'all' ? tasks : tasks.filter(t => t.project === selectedProject);
    
    // console.log('Filtered tasks:', filteredTasks);
    
    return filteredTasks.map(task => {
      // console.log('Processing task:', task);
      const startDate = new Date(task.exp_start_date || Date.now());
      const endDate = new Date(task.exp_end_date || Date.now());
      const today = new Date();
      
      return {
        id: task.name,
        name: task.subject,
        project: task.project || '',
        startDate,
        endDate,
        progress: task.progress || 0,
        status: task.status,
        priority: task.priority || 'Medium',
        isOverdue: endDate < today && task.status !== 'Completed',
        isMilestone: task.is_group || task.subject.toLowerCase().includes('milestone'),
        dependencies: [] // Trong thực tế sẽ lấy từ dữ liệu
      };
    });
  }, [tasks, selectedProject]);
  
  // Tính toán timeline
  const timelineRange = useMemo(() => {
    if (ganttTasks.length === 0) return { start: new Date(), end: new Date() };
    
    const dates = ganttTasks.flatMap(task => [task.startDate, task.endDate]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Thêm buffer
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    return { start: minDate, end: maxDate };
  }, [ganttTasks]);

  // Tạo các cột thời gian
  const timeColumns = useMemo(() => {
    const columns: Date[] = [];
    const current = new Date(timelineRange.start);
    
    while (current <= timelineRange.end) {
      columns.push(new Date(current));
      
      if (timeView === 'week') {
        current.setDate(current.getDate() + 7);
      } else if (timeView === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setMonth(current.getMonth() + 3);
      }
    }
    
    return columns;
  }, [timelineRange, timeView]);

  // Tính toán vị trí và độ rộng của task bar
  const getTaskBarStyle = (task: GanttTask) => {
    const totalDays = (timelineRange.end.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const taskStartDays = (task.startDate.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const taskDurationDays = (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const left = (taskStartDays / totalDays) * 100;
    const width = (taskDurationDays / totalDays) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  // Tìm tasks chồng chéo
  const findOverlappingTasks = () => {
    const overlapping: string[] = [];
    
    for (let i = 0; i < ganttTasks.length; i++) {
      for (let j = i + 1; j < ganttTasks.length; j++) {
        const task1 = ganttTasks[i];
        const task2 = ganttTasks[j];
        
        if (task1.project === task2.project) {
          const overlap = (
            task1.startDate <= task2.endDate && 
            task1.endDate >= task2.startDate
          );
          
          if (overlap) {
            if (!overlapping.includes(task1.id)) overlapping.push(task1.id);
            if (!overlapping.includes(task2.id)) overlapping.push(task2.id);
          }
        }
      }
    }
    
    return overlapping;
  };

  const overlappingTaskIds = findOverlappingTasks();
  const overdueTasks = ganttTasks.filter(t => t.isOverdue);

  const getStatusColor = (task: GanttTask) => {
    if (task.isOverdue) return 'bg-red-500';
    if (task.status === 'Hoàn thành') return 'bg-green-500';
    if (task.status === 'Đang thực hiện') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      year: timeView === 'quarter' ? 'numeric' : '2-digit'
    });
  };

  // Helper function để lấy tên project từ ID
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.name === projectId);
    return project ? project.project_name : projectId;
  };

  return (
    <Card title="Timeline / Gantt Chart">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4">
          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả dự án</option>
            {projects.map(project => (
              <option key={project.name} value={project.name}>
                {project.project_name}
              </option>
            ))}
          </select>

          {/* Time View */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['week', 'month', 'quarter'].map((view) => (
              <button
                key={view}
                onClick={() => setTimeView(view as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeView === view
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view === 'week' ? 'Tuần' : view === 'month' ? 'Tháng' : 'Quý'}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="flex items-center space-x-4 text-sm">
          {overdueTasks.length > 0 && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {overdueTasks.length} tasks quá hạn
            </div>
          )}
          {overlappingTaskIds.length > 0 && (
            <div className="flex items-center text-yellow-600">
              <Clock className="h-4 w-4 mr-1" />
              {overlappingTaskIds.length} tasks chồng chéo
            </div>
          )}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Timeline Header */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-80 px-4 py-3 font-semibold text-gray-700 border-r border-gray-200">
              Task / Milestone
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {timeColumns.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 text-center text-xs font-medium text-gray-600 border-r border-gray-200 min-w-20"
                  >
                    {formatDate(date)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="divide-y divide-gray-200">
            {ganttTasks.map((task) => (
              <div key={task.id} className="flex hover:bg-gray-50">
                {/* Task Info */}
                <div className="w-80 px-4 py-3 border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    {task.isMilestone ? (
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                    ) : task.isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Calendar className="h-4 w-4 text-blue-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {task.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getProjectName(task.project)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {task.progress}%
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 relative py-2">
                  <div className="relative h-8 mx-1">
                    {/* Task Bar */}
                    <div
                      className={`absolute top-1 h-6 rounded-md ${getStatusColor(task)} ${
                        overlappingTaskIds.includes(task.id) ? 'ring-2 ring-yellow-400' : ''
                      } shadow-sm`}
                      style={getTaskBarStyle(task)}
                    >
                      {/* Progress Bar */}
                      <div
                        className="h-full bg-white bg-opacity-30 rounded-md"
                        style={{ width: `${task.progress}%` }}
                      />
                      
                      {/* Task Label */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-xs text-white font-medium truncate">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Hoàn thành</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Đang thực hiện</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Quá hạn</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Chưa bắt đầu</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-yellow-400 rounded"></div>
          <span>Chồng chéo</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-purple-500" />
          <span>Milestone</span>
        </div>
      </div>
    </Card>
  );
};
