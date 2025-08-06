import React from 'react';
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
  const inProgressTasks = tasks.filter(t => t.status === 'Đang thực hiện').length;
  const completedTasks = tasks.filter(t => t.status === 'Hoàn thành').length;

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
  const renderTaskItem = (task: Task, level: number) => {
    const indentClass = level > 0 ? `pl-${level * 6}` : '';
    let icon = '';
    
    if (task.is_group) {
      icon = '▶️'; // Mũi tên phải cho giai đoạn
    } else if (task.parent_task_name) {
      icon = '•'; // Dấu chấm cho nhiệm vụ con
    } else {
      icon = '●'; // Dấu chấm tròn cho nhiệm vụ chính
    }

    return (
      <div key={task.name} className={`flex items-center py-2 ${indentClass} border-b border-gray-100 last:border-b-0`}>
        <div className="flex-grow flex items-center">
          <span className="text-blue-600 mr-2">{icon}</span>
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

  const buildTaskTree = (allTasks: Task[], parentSubject: string | null = null, level: number = 0): React.ReactNode[] => {
    const children = allTasks.filter(task => task.parent_task_name === parentSubject);
    const sortedChildren = children.sort((a, b) => {
      if (a.is_group && !b.is_group) return -1;
      if (!a.is_group && b.is_group) return 1;
      return a.subject.localeCompare(b.subject);
    });

    const result: React.ReactNode[] = [];
    sortedChildren.forEach(childTask => {
      result.push(renderTaskItem(childTask, level));
      result.push(...buildTaskTree(allTasks, childTask.subject, level + 1));
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
          const tasksForProject = tasks.filter(t => t.project === project.project_name);
          
          if (tasksForProject.length === 0) return null;
          
          return (
            <div key={project.name}>
              <div className="bg-blue-500 text-white p-3 rounded-t-lg font-semibold text-lg">
                Dự án: {project.project_name} ({project.status})
              </div>
              <div className="bg-white rounded-b-lg border border-gray-200 p-4">
                {buildTaskTree(tasksForProject)}
                {tasksForProject.length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    Chưa có nhiệm vụ nào cho dự án này.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
