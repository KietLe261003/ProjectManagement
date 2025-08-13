import React, { useState } from 'react';
import type { Project } from '@/types/Projects/Project';
import { formatCurrency } from '@/utils/formatCurrency';
import { DetailProject } from './DetailProject';

interface ProjectListViewGridProps {
  projects: Project[];
}

const ProjectListViewGrid: React.FC<ProjectListViewGridProps> = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedProject(null);
  };

  const getStatusColor = (status?: "Open" | "Completed" | "Cancelled") => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div 
            key={project.name} 
            className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
            onClick={() => handleProjectClick(project)}
          >
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <div className="text-4xl font-bold text-gray-400">
                {project.project_name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {project.project_name}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {project.status || 'Open'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{project.project_type || 'N/A'}</p>
              
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">{project.percent_complete || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${project.percent_complete || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Customer and Budget */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{project.customer || 'N/A'}</span>
                <span>{formatCurrency(project.estimated_costing)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* DetailProject Drawer */}
      <DetailProject 
        project={selectedProject}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
};

export default ProjectListViewGrid;