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
import type { Project, Task } from '../types';
import { Card } from './Card';
import { MetricCard } from './MetricCard';
import { StatusBadge } from './StatusBadge';

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
  tasks: Task[];
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ projects, tasks }) => {
  // Initialize all projects as expanded by default
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map(p => p.name))
  );
  
  
  //console.log('projects1111', projects);

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
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

  const toggleTask = (taskKey: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskKey)) {
      newExpanded.delete(taskKey);
    } else {
      newExpanded.add(taskKey);
    }
    setExpandedTasks(newExpanded);
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
      backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f'],
      borderColor: ['#2980b9', '#27ae60', '#c0392b', '#f39c12'],
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

  // Render task tree
  const renderTaskItem = (task: Task, level: number, projectName: string, allTasks: Task[]) => {
    const indentClass = level > 0 ? `pl-${level * 6}` : '';
    const phaseKey = `${projectName}-${task.subject}`;
    const taskKey = `${projectName}-${task.subject}-task`;
    const isPhaseExpanded = expandedPhases.has(phaseKey);
    const isTaskExpanded = expandedTasks.has(taskKey);
    
    // Check if this task has children (subtasks)
    const hasChildren = allTasks.some(t => t.parent_task_name === task.subject);
    
    let icon = '';
    let isClickable = false;
    
    if (task.is_group) {
      icon = isPhaseExpanded ? '▼' : '▶️'; // Mũi tên xuống/phải cho giai đoạn
      isClickable = true;
    } else if (hasChildren && !task.parent_task_name) {
      // Nhiệm vụ chính có nhiệm vụ con
      icon = isTaskExpanded ? '▼' : '▶️';
      isClickable = true;
    } else if (task.parent_task_name) {
      icon = '•'; // Dấu chấm cho nhiệm vụ con
    } else {
      icon = '●'; // Dấu chấm tròn cho nhiệm vụ đơn lẻ
    }

    const handleClick = () => {
      if (task.is_group) {
        togglePhase(phaseKey);
      } else if (hasChildren && !task.parent_task_name) {
        toggleTask(taskKey);
      }
    };

    return (
      <div key={task.name} className={`flex items-center py-2 ${indentClass} border-b border-gray-100 last:border-b-0`}>
        <div className="flex-grow flex items-center">
          <span 
            className={`mr-2 ${isClickable ? 'text-blue-600 cursor-pointer hover:text-blue-800' : 'text-blue-600'}`}
            onClick={isClickable ? handleClick : undefined}
          >
            {icon}
          </span>
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

  const buildTaskTree = (allTasks: Task[], projectName: string, parentSubject: string | null = null, level: number = 0): React.ReactNode[] => {
    const children = allTasks.filter(task => task.parent_task_name === parentSubject);
    const sortedChildren = children.sort((a, b) => {
      if (a.is_group && !b.is_group) return -1;
      if (!a.is_group && b.is_group) return 1;
      return a.subject.localeCompare(b.subject);
    });

    const result: React.ReactNode[] = [];
    sortedChildren.forEach(childTask => {
      result.push(renderTaskItem(childTask, level, projectName, allTasks));
      
      // Determine what controls the expansion of children
      const phaseKey = `${projectName}-${childTask.subject}`;
      const taskKey = `${projectName}-${childTask.subject}-task`;
      
      let shouldShowChildren = false;
      
      if (childTask.is_group) {
        // For group tasks (phases), check phase expansion
        shouldShowChildren = expandedPhases.has(phaseKey);
      } else if (!childTask.parent_task_name) {
        // For main tasks that have children, check task expansion
        const hasChildren = allTasks.some(t => t.parent_task_name === childTask.subject);
        shouldShowChildren = hasChildren ? expandedTasks.has(taskKey) : false;
      } else {
        // For subtasks, always show if we reach this point
        shouldShowChildren = true;
      }
      
      if (shouldShowChildren) {
        result.push(...buildTaskTree(allTasks, projectName, childTask.subject, level + 1));
      }
    });
    
    return result;
  };

  return (
    <Card title="Quản lý nhiệm vụ">
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
          const tasksForProject = tasks.filter(t => t.project === project.name);
          
          if (tasksForProject.length === 0) return null;
          
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
                  {buildTaskTree(tasksForProject, project.name)}
                  {tasksForProject.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      Chưa có nhiệm vụ nào cho dự án này.
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
