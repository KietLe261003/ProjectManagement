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
  const [currentPage, setCurrentPage] = React.useState(1);
  const projectsPerPage = 10;
  
  // Use centralized project service
  const { data: projects = [], isLoading, error, mutate } = useUserProjects();

  // Update filtered projects when projects change
  React.useEffect(() => {
    setFilteredProjects(projects);
    setCurrentPage(1); // Reset to first page when projects change
  }, [projects]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

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
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects (Total: {projects.length})
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
            <ProjectListViewGrid projects={currentProjects} onProjectsChange={handleProjectsChange} />
          ) : (
            <ProjectListViewCard projects={currentProjects} onProjectsChange={handleProjectsChange} />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredProjects.length)}</span> of{' '}
                    <span className="font-medium">{filteredProjects.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
