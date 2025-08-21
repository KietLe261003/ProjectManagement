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

  const statusChartData = {
    labels: Object.keys(taskStatusCounts),
    datasets: [{
      label: 'Số lượng nhiệm vụ',
      data: Object.values(taskStatusCounts),
      backgroundColor: [  '#3498db','#db3434ff','#2ecc71', '#f1c40f'],
      borderColor: ['#70767eff', '#3498db', '#2ecc71', '#f39c12'],
      borderWidth: 1
    }]
  };

  // Dữ liệu cho biểu đồ độ ưu tiên nhiệm vụ
  const taskPriorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityChartData = {
    labels: Object.keys(taskPriorityCounts),
    datasets: [{
      data: Object.values(taskPriorityCounts),
      backgroundColor: ['#1976d2', '#ef6c00', '#d84315', '#b71c1c'],
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
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
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Trạng thái nhiệm vụ</h3>
          <Bar data={statusChartData} options={chartOptions} />
        </div>
        <div>
          <Doughnut data={priorityChartData} options={doughnutOptions} />
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
                className="bg-blue-500 text-white p-3 rounded-t-lg font-semibold text-lg cursor-pointer hover:bg-blue-600 flex items-center justify-between"
                onClick={() => toggleProject(project.name)}
              >
                <span>Dự án: {project.project_name} ({project.status})</span>
                <span className="text-xl">
                  {isProjectExpanded ? '▼' : '▶️'}
                </span>
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
