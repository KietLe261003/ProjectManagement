import React from 'react';
import ProjectListViewGrid from './components/project/ProjectListViewGrid';
import ProjectListViewCard from './components/project/ProjectListViewCard';
import ProjectFilter from './components/ProjectFilter';
import { useUserProjects } from '@/services';
import CreateProject from './components/project/CreateProject';
import type { Project } from '@/types/Projects/Project';

export const ProjectsPage: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');
  const [filteredProjects, setFilteredProjects] = React.useState<Project[]>([]);
  
  // Use centralized project service
  const { data: projects = [], isLoading, error, mutate } = useUserProjects();

  // Update filtered projects when projects change
  React.useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  const handleProjectsChange = async () => {
    // Refresh projects list when a project is updated or deleted
    // console.log('handleProjectsChange called, mutate function exists:', !!mutate);
    if (mutate) {
      // console.log('Calling mutate to refresh projects data...');
      await mutate();
    }
  };

  const handleFilteredProjectsChange = React.useCallback((filtered: Project[]) => {
    setFilteredProjects(filtered);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <CreateProject onProjectCreated={handleProjectsChange} />
        </div>
      </div>

      {/* Filters and Search */}
      {!isLoading && !error && projects.length > 0 && (
        <ProjectFilter 
          projects={projects}
          onFilteredProjectsChange={handleFilteredProjectsChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* Projects Grid/List */}
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="text-gray-500">Loading projects...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-700 text-center">
            <p className="text-lg font-medium mb-2">Error loading projects</p>
            <p className="text-sm mb-2">{error.message}</p>
            {error.message.includes('PermissionError') && (
              <div className="text-sm text-red-600 bg-red-100 p-3 rounded mt-2">
                <p><strong>Permission Issue:</strong> You don't have access to view projects.</p>
                <p>Please contact your system administrator to:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Grant you "Read" permission for Project doctype</li>
                  <li>Add you to projects as a team member</li>
                  <li>Make you the owner of projects</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col justify-center items-center p-8 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-medium mb-2">No projects found</p>
            <p className="text-sm">You are not currently participating in any projects.</p>
            <p className="text-sm">Create a new project or ask to be added to an existing one.</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col justify-center items-center p-8 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-500 text-center">
            <p className="text-lg font-medium mb-2">No projects match your filters</p>
            <p className="text-sm">Try adjusting your search criteria or clear the filters.</p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ProjectListViewGrid projects={filteredProjects} onProjectsChange={handleProjectsChange} />
          ) : (
            <ProjectListViewCard projects={filteredProjects} onProjectsChange={handleProjectsChange} />
          )}
        </>
      )}
    </div>
  );
};
