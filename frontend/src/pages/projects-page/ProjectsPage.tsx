import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import ProjectListViewGrid from './components/project/ProjectListViewGrid';
import ProjectListViewCard from './components/project/ProjectListViewCard';
import { useUserProjects } from '@/services';
import CreateProject from './components/project/CreateProject';

export const ProjectsPage: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');
  
  // Use centralized project service
  const { data: projects = [], isLoading, error, mutate } = useUserProjects();

  const handleProjectsChange = async () => {
    // Refresh projects list when a project is updated or deleted
    console.log('handleProjectsChange called, mutate function exists:', !!mutate);
    if (mutate) {
      console.log('Calling mutate to refresh projects data...');
      await mutate();
    }
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
            Showing projects you have access to ({projects.length} projects)
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <CreateProject onProjectCreated={handleProjectsChange} />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Search projects..."
              />
            </div>

            {/* Filter */}
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ProjectListViewGrid projects={projects} onProjectsChange={handleProjectsChange} />
          ) : (
            <ProjectListViewCard projects={projects} onProjectsChange={handleProjectsChange} />
          )}
        </>
      )}
    </div>
  );
};
