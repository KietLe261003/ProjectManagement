import type { Project } from '@/types/Projects/Project';
import { formatCurrency } from '@/utils/formatCurrency';
import React, { useState, useMemo } from 'react';
import { DetailProject } from './DetailProject';
import ProjectActions from './ProjectActions';
import { mutate as globalMutate } from 'swr';

interface ProjectListViewCardProps {
  projects: Project[];
  onProjectsChange?: () => void;
}

const ProjectListViewCard: React.FC<ProjectListViewCardProps> = ({ projects, onProjectsChange }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastUpdatedProject, setLastUpdatedProject] = useState<string | null>(null);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedProject(null);
  };

  const handleProjectUpdated = () => {
    if (selectedProject) {
      setLastUpdatedProject(selectedProject.name);
      // Clear the highlight after 5 seconds
      setTimeout(() => {
        setLastUpdatedProject(null);
      }, 5000);
    }
    
    console.log('handleProjectUpdated called, about to refresh data...');
    
    // Close the drawer immediately
    setIsDrawerOpen(false);
    setSelectedProject(null);
    
    // Force invalidate all Project cache
    globalMutate(
      (key) => typeof key === "string" && key.includes("Project"),
      undefined,
      { revalidate: true }
    );
    
    // Also force invalidate specific patterns
    globalMutate('/api/resource/Project');
    globalMutate('Project');
    
    // Immediately call refresh without delay
    if (onProjectsChange) {
      console.log('Calling onProjectsChange to refresh data immediately');
      onProjectsChange();
    } else {
      console.log('onProjectsChange is not available');
    }
    
    // Also try after small delay as backup
    setTimeout(() => {
      if (onProjectsChange) {
        console.log('Calling onProjectsChange again as backup');
        onProjectsChange();
      }
    }, 100);
  };

  const handleProjectDeleted = () => {
    setLastUpdatedProject(null);
    if (onProjectsChange) {
      onProjectsChange();
    }
  };

  // Projects are already sorted by modified date from the service
  // But let's add client-side sorting as backup to ensure proper ordering
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aDate = new Date(a.modified || a.creation || 0);
      const bDate = new Date(b.modified || b.creation || 0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [projects]);

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

  

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deadline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProjects.map((project) => (
              <tr 
                key={project.name} 
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  lastUpdatedProject === project.name ? 'bg-green-50 border-l-4 border-green-400' : ''
                }`}
                onClick={() => handleProjectClick(project)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">
                          {project.project_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4" style={{ maxWidth: '300px' }}>
                      <div 
                        className="text-sm font-medium text-gray-900 cursor-help"
                        title={project.project_name} // Always show full name on hover
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {project.project_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.project_type || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status || 'Open'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${project.percent_complete || 0}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{project.percent_complete || 0}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(project.estimated_costing)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(project.expected_end_date)}
                </td>
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  onClick={(e) => e.stopPropagation()} // Prevent row click when clicking actions
                >
                  <ProjectActions 
                    project={project}
                    onProjectUpdated={handleProjectUpdated}
                    onProjectDeleted={handleProjectDeleted}
                    onCloseDrawer={handleCloseDrawer}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* DetailProject Drawer */}
      <DetailProject 
        project={selectedProject}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default ProjectListViewCard;
