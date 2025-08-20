import React from 'react';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import ProjectListViewGrid from './components/ProjectListViewGrid';
import ProjectListViewCard from './components/ProjectListViewCard';
import type { Project } from '@/types/Projects/Project';
import { useFrappeGetDocList } from 'frappe-react-sdk';

export const ProjectsPage: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  
  const { data, isLoading, error } = useFrappeGetDocList('Project', {
    fields: [
      'name', 
      'project_name', 
      'project_type', 
      'status', 
      'customer', 
      'expected_end_date', 
      'percent_complete',
      'priority',
      'estimated_costing',
      'total_billable_amount',
      'company'
    ],
  });
  
  console.log("", data);
  
  // Sử dụng data từ API nếu có, ngược lại sử dụng array rỗng
  const projects: Project[] = (data as Project[]) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage all your projects in one place
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </button>
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
        <div className="flex justify-center items-center p-8">
          <div className="text-red-500">Error loading projects: {error.message}</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex justify-center items-center p-8">
          <div className="text-gray-500">No projects found</div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ProjectListViewGrid projects={projects} />
          ) : (
            <ProjectListViewCard projects={projects} />
          )}
        </>
      )}
    </div>
  );
};
