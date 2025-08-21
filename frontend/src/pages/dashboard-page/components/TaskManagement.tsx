import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Project, Phase, Task } from '../../../types';
import { Card } from '../../../components/Card';
import { MetricCard } from '../../../components/MetricCard';
import { StatusBadge } from '../../../components/StatusBadge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TaskManagementProps {
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ projects, phases, tasks }) => {
  // Initialize all projects as expanded by default
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map(p => p.name))
  );
  
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  
  const inProgressTasks = tasks.filter(t => t.status === 'Working').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  const toggleProject = (projectName: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName);
    } else {
      newExpanded.add(projectName);
    }
    setExpandedProjects(newExpanded);
  };

  const togglePhase = (phaseKey: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseKey)) {
      newExpanded.delete(phaseKey);
    } else {
      newExpanded.add(phaseKey);
    }
    setExpandedPhases(newExpanded);
  };

  // Dữ liệu cho biểu đồ trạng thái nhiệm vụ
  const taskStatusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Chuẩn hóa màu sắc theo ProjectOverview
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#3b82f6'; // Blue
      case 'Working': return '#f59e0b'; // Orange/Yellow
      case 'Completed': return '#22c55e'; // Green
      case 'Overdue': return '#ef4444'; // Red
      case 'Cancelled': return '#6b7280'; // Gray
      default: return '#3b82f6'; // Default blue
    }
  };

  const statusChartData = {
    labels: Object.keys(taskStatusCounts),
    datasets: [{
      data: Object.values(taskStatusCounts),
      backgroundColor: Object.keys(taskStatusCounts).map(status => getStatusColor(status)),
      borderColor: Object.keys(taskStatusCounts).map(status => getStatusColor(status)),
      borderWidth: 1
    }]
  };

  // Dữ liệu cho biểu đồ độ ưu tiên nhiệm vụ
  const taskPriorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Chuẩn hóa màu sắc priority theo ProjectOverview
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return '#dc2626'; // Red
      case 'High': return '#f97316'; // Orange
      case 'Medium': return '#eab308'; // Yellow - using orange for consistency
      case 'Low': return '#16a34a'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  // Lấy màu sắc cho status dự án theo ProjectOverview
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Hoàn thành':
        return '#22c55e'; // Green
      case 'Cancelled':
      case 'Canceled':
      case 'Hủy':
      case 'Đã hủy':
        return '#ef4444'; // Red
      default:
        return '#3b82f6'; // Blue (Open/Đang mở)
    }
  };

  const priorityChartData = {
    labels: Object.keys(taskPriorityCounts),
    datasets: [{
      data: Object.values(taskPriorityCounts),
      backgroundColor: Object.keys(taskPriorityCounts).map(priority => getPriorityColor(priority)),
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ẩn legend
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Độ ưu tiên nhiệm vụ',
        font: {
          size: 16
        }
      },
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  // Helper function to get tasks for a specific phase
  const getTasksForPhase = (phaseName: string): Task[] => {
    const phase = phases.find(p => p.name === phaseName);
    if (!phase || !phase.tasks) return [];
    
    const phaseTaskNames = phase.tasks.map(pt => pt.task);
    return tasks.filter(task => phaseTaskNames.includes(task.name));
  };

  // Helper function to get phases for a project
  const getPhasesForProject = (projectName: string): Phase[] => {
    return phases.filter(phase => phase.project === projectName);
  };

  // Render task item within a phase
  const renderTaskInPhase = (task: Task, level: number = 1): React.ReactNode => {
    const indentClass = level > 0 ? `pl-${level * 6}` : '';
    
    return (
      <div key={task.name} className={`flex items-center py-2 ${indentClass} border-b border-gray-100 last:border-b-0`}>
        <div className="flex-grow flex items-center">
          <span className="mr-2 text-blue-600">●</span>
          <span className="font-medium text-gray-800">{task.subject}</span>
        </div>
        <div className="w-32 text-sm text-gray-600">{task.assigned_to || 'Chưa giao'}</div>
        <div className="w-32 text-center">
          <StatusBadge status={task.status} type="status" />
        </div>
        <div className="w-24 text-center">
          <StatusBadge status={task.priority} type="priority" />
        </div>
        <div className="w-20 text-right text-sm text-gray-600">{task.progress}%</div>
      </div>
    );
  };

  // Render phase with its tasks
  const renderPhase = (phase: Phase, projectName: string): React.ReactNode => {
    const phaseKey = `${projectName}-${phase.name}`;
    const isPhaseExpanded = expandedPhases.has(phaseKey);
    const phaseTasks = getTasksForPhase(phase.name);
    
    return (
      <div key={phase.name} className="ml-4">
        <div 
          className="bg-green-500 text-white p-2 rounded-t-lg font-medium text-md cursor-pointer hover:bg-green-600 flex items-center justify-between"
          onClick={() => togglePhase(phaseKey)}
        >
          <span>Giai đoạn: {phase.phase_name} ({phase.status})</span>
          <span className="text-lg">
            {isPhaseExpanded ? '▼' : '▶️'}
          </span>
        </div>
        {isPhaseExpanded && (
          <div className="bg-white border-l-2 border-r-2 border-b-2 border-gray-200 p-3">
            {phaseTasks.length > 0 ? (
              phaseTasks.map(task => renderTaskInPhase(task))
            ) : (
              <div className="text-gray-500 text-center py-2 text-sm">
                Chưa có nhiệm vụ nào cho giai đoạn này.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card title="Quản lý nhiệm vụ (Task)">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MetricCard 
          value={inProgressTasks} 
          label="Tổng nhiệm vụ đang thực hiện" 
        />
        <MetricCard 
          value={completedTasks} 
          label="Tổng nhiệm vụ đã hoàn thành" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Trạng thái nhiệm vụ</h3>
          <div className="flex-1" style={{ height: '400px' }}>
            <Bar data={statusChartData} options={chartOptions} />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex-1" style={{ height: '400px' }}>
            <Doughnut data={priorityChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-700">Danh sách nhiệm vụ</h3>
      <div className="space-y-4">
        {projects.map(project => {
          const projectPhases = getPhasesForProject(project.name);
          const isProjectExpanded = expandedProjects.has(project.name);
          
          return (
            <div key={project.name}>
              <div 
                className="text-white p-3 rounded-t-lg font-semibold text-lg cursor-pointer hover:opacity-90 flex items-center justify-between transition-opacity"
                style={{ backgroundColor: getProjectStatusColor(project.status) }}
                onClick={() => toggleProject(project.name)}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Dự án: {project.project_name} ({project.status})</span>
                    <span className="text-xl">
                      {isProjectExpanded ? '▼' : '▶️'}
                    </span>
                  </div>
                  <div className="flex items-center mt-2 text-sm text-white space-x-6">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Priority:</span>
                      <span className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {project.priority}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Progress:</span>
                      <span className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {project.percent_complete}%
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Expected End:</span>
                      <span className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Department:</span>
                      <span className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {project.department}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Team:</span>
                      <span className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium">
                        {project.team}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {isProjectExpanded && (
                <div className="bg-white rounded-b-lg border border-gray-200 p-4">
                  {projectPhases.length > 0 ? (
                    projectPhases.map(phase => renderPhase(phase, project.name))
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      Chưa có giai đoạn nào cho dự án này.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
