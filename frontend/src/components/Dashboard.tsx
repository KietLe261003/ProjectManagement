import React from 'react';
import { useProjectData } from '../hooks/useProjectData';
import { ProjectFilter } from './ProjectFilter';
import { ProjectOverview } from './ProjectOverview';
import { TaskManagement } from './TaskManagement';
import { LoadingSpinner } from './LoadingSpinner';
import { useFrappeGetDocList } from 'frappe-react-sdk';
interface Task {
  name: string;
  subject: string;
  status: string;
  project: string;
  priority: string;
}
export const Dashboard: React.FC = () => {
  const { 
    allProjects, 
    filteredData, 
    selectedProject, 
    setSelectedProject, 
    isLoading 
  } = useProjectData();
  const { data } = useFrappeGetDocList<Task>('Task', {
    fields: ['name', 'subject', 'status', 'project', 'priority'],
    limit: 20,
    orderBy: {
      field: 'creation',
      order: 'desc',
    },
    filters: [['status', '!=', 'Completed']], // ví dụ lọc task chưa hoàn thành
  });
  console.log(data?.map(task => (task.project)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Bảng điều khiển quản lý dự án
        </h1>

        <ProjectFilter
          projects={allProjects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
        />

        <ProjectOverview
          projects={filteredData.filteredProjects}
          selectedProject={selectedProject}
        />

        <TaskManagement
          projects={filteredData.filteredProjects}
          tasks={filteredData.filteredTasks}
        />

        {/* <TimeTracking
          timesheets={filteredData.filteredTimesheets}
        />

        <CostAnalysis
          projects={filteredData.filteredProjects}
        /> */}
      </div>
    </div>
  );
};
