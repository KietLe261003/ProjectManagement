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

  // Chuẩn hóa màu sắc theo ProjectOverview với màu đậm hơn
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#1e40af'; // Darker Blue
      case 'Working': return '#d97706'; // Darker Orange
      case 'Completed': return '#16a34a'; // Darker Green
      case 'Overdue': return '#dc2626'; // Darker Red
      case 'Cancelled': return '#4b5563'; // Darker Gray
      default: return '#1e40af'; // Default darker blue
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

  // Chuẩn hóa màu sắc priority theo ProjectOverview với màu đậm hơn
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return '#b91c1c'; // Darker Red
      case 'High': return '#ea580c'; // Darker Orange
      case 'Medium': return '#ca8a04'; // Darker Yellow
      case 'Low': return '#15803d'; // Darker Green
      default: return '#4b5563'; // Darker Gray
    }
  };

  // Lấy màu sắc cho status dự án theo ProjectOverview với màu đậm hơn
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Hoàn thành':
        return '#16a34a'; // Darker Green
      case 'Cancelled':
      case 'Canceled':
      case 'Hủy':
      case 'Đã hủy':
        return '#dc2626'; // Darker Red
      default:
        return '#1e40af'; // Darker Blue (Open/Đang mở)
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

  // Helper function to get standalone tasks for a project (tasks not belonging to any phase)
  const getStandaloneTasks = (projectName: string): Task[] => {
    const projectPhases = getPhasesForProject(projectName);
    const allPhaseTaskNames = new Set<string>();
    
    // Collect all task names that belong to phases
    projectPhases.forEach(phase => {
      if (phase.tasks) {
        phase.tasks.forEach(phaseTask => {
          if (phaseTask.task) {
            allPhaseTaskNames.add(phaseTask.task);
          }
        });
      }
    });

    // Return tasks that belong to the project but not to any phase
    return tasks.filter(task => 
      task.project === projectName && 
      !allPhaseTaskNames.has(task.name)
    );
  };

  // Render task item within a phase
  const renderTaskInPhase = (task: Task, level: number = 1): React.ReactNode => {
    const indentClass = level > 0 ? `pl-${level * 6}` : '';
    
    return (
      <div key={task.name} className={`flex items-center py-3 ${indentClass} border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors`}>
        <div className="flex-grow flex items-center">
          <span className="mr-3 text-blue-600 text-lg">●</span>
          <span className="font-medium text-gray-800">{task.subject}</span>
        </div>
        <div className="w-36 text-sm text-gray-600 font-medium">{task.assigned_to || 'Chưa giao'}</div>
        <div className="w-32 text-center">
          <StatusBadge status={task.status} type="status" />
        </div>
        <div className="w-28 text-center">
          <StatusBadge status={task.priority} type="priority" />
        </div>
        <div className="w-20 text-right text-sm font-semibold text-gray-700">{task.progress}%</div>
      </div>
    );
  };

  // Render phase with its tasks
  const renderPhase = (phase: Phase, projectName: string): React.ReactNode => {
    const phaseKey = `${projectName}-${phase.name}`;
    const isPhaseExpanded = expandedPhases.has(phaseKey);
    const phaseTasks = getTasksForPhase(phase.name);
    
    return (
      <div key={phase.name} className="mb-4">
        <div 
          className="bg-emerald-600 text-white p-3 rounded-lg font-semibold text-md cursor-pointer hover:bg-emerald-700 flex items-center justify-between transition-colors shadow-sm"
          onClick={() => togglePhase(phaseKey)}
        >
          <span>📋 Giai đoạn: {phase.phase_name} ({phase.status})</span>
          <span className="text-lg">
            {isPhaseExpanded ? '▼' : '▶'}
          </span>
        </div>
        {isPhaseExpanded && (
          <div className="bg-white border border-gray-200 rounded-b-lg mt-1 p-4 shadow-sm">
            {phaseTasks.length > 0 ? (
              phaseTasks.map(task => renderTaskInPhase(task))
            ) : (
              <div className="text-gray-500 text-center py-4 text-sm">
                Chưa có nhiệm vụ nào cho giai đoạn này.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render standalone tasks section
  const renderStandaloneTasks = (projectName: string): React.ReactNode => {
    const standaloneTasks = getStandaloneTasks(projectName);
    
    if (standaloneTasks.length === 0) {
      return null;
    }

    const standaloneKey = `${projectName}-standalone`;
    const isStandaloneExpanded = expandedPhases.has(standaloneKey);
    
    return (
      <div className="mb-4">
        <div 
          className="bg-indigo-600 text-white p-3 rounded-lg font-semibold text-md cursor-pointer hover:bg-indigo-700 flex items-center justify-between transition-colors shadow-sm"
          onClick={() => togglePhase(standaloneKey)}
        >
          <span>⚡ Nhiệm vụ độc lập ({standaloneTasks.length} task)</span>
          <span className="text-lg">
            {isStandaloneExpanded ? '▼' : '▶'}
          </span>
        </div>
        {isStandaloneExpanded && (
          <div className="bg-white border border-gray-200 rounded-b-lg mt-1 p-4 shadow-sm">
            {standaloneTasks.map(task => renderTaskInPhase(task))}
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

      <h3 className="text-xl font-semibold mt-8 mb-6 text-gray-800">Danh sách nhiệm vụ</h3>
      <div className="space-y-6">
        {projects.map(project => {
          const projectPhases = getPhasesForProject(project.name);
          const isProjectExpanded = expandedProjects.has(project.name);
          
          return (
            <div key={project.name} className="border border-gray-200 rounded-lg shadow-sm">
              <div 
                className="text-white p-4 rounded-t-lg font-semibold text-lg cursor-pointer hover:opacity-90 flex items-center justify-between transition-opacity"
                style={{ backgroundColor: getProjectStatusColor(project.status) }}
                onClick={() => toggleProject(project.name)}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">🏗️ Dự án: {project.project_name} ({project.status})</span>
                    <span className="text-xl">
                      {isProjectExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                  <div className="flex items-center mt-3 text-sm text-white space-x-6">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Priority:</span>
                      <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                        {project.priority}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Progress:</span>
                      <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                        {project.percent_complete}%
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Expected End:</span>
                      <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                        {project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Department:</span>
                      <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                        {project.department}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Team:</span>
                      <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                        {project.team}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {isProjectExpanded && (
                <div className="bg-gray-50 rounded-b-lg p-6">
                  {/* Render Phases */}
                  {projectPhases.map(phase => renderPhase(phase, project.name))}
                  
                  {/* Render Standalone Tasks */}
                  {renderStandaloneTasks(project.name)}
                  
                  {projectPhases.length === 0 && getStandaloneTasks(project.name).length === 0 && (
                    <div className="text-gray-500 text-center py-8 bg-white rounded-lg border border-gray-200">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-lg font-medium mb-1">Chưa có nhiệm vụ nào</p>
                      <p className="text-sm">Dự án này chưa có giai đoạn hoặc nhiệm vụ nào được tạo.</p>
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
