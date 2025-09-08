import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { useTeams } from '@/services';
import type { Project } from '@/types/Projects/Project';

interface ProjectFilterProps {
  projects: Project[];
  onFilteredProjectsChange: (filteredProjects: Project[]) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

interface FilterState {
  searchText: string;
  selectedTeam: string;
  selectedStatus: string;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({ 
  projects, 
  onFilteredProjectsChange,
  viewMode,
  onViewModeChange
}) => {
  const [filters, setFilters] = React.useState<FilterState>({
    searchText: '',
    selectedTeam: '',
    selectedStatus: ''
  });
  const [showFilterDropdown, setShowFilterDropdown] = React.useState(false);

  // Get teams for filter dropdown
  const { data: teams = [] } = useTeams();

  // Status options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Open', label: 'Open' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

    // Team options - show all available teams from DocType Team
  const teamOptions = React.useMemo(() => {
    // Create options from all available teams
    const options = [
      { value: '', label: 'All Teams' },
      ...teams.map(team => ({ 
        value: team.name, 
        label: team.team || team.name 
      }))
    ];
    
    // Sort by label for better UX
    return [
      options[0], // Keep "All Teams" at top
      ...options.slice(1).sort((a, b) => a.label.localeCompare(b.label))
    ];
  }, [teams]);

  // Apply filters whenever filter state changes
  React.useEffect(() => {
    let filtered = [...projects];

    // Filter by search text (project name)
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(project =>
        project.project_name.toLowerCase().includes(searchLower) ||
        project.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by team (with safe comparison)
    if (filters.selectedTeam) {
      filtered = filtered.filter(project => {
        const projectTeam = project.team || '';
        return projectTeam === filters.selectedTeam;
      });
    }

    // Filter by status
    if (filters.selectedStatus) {
      filtered = filtered.filter(project => project.status === filters.selectedStatus);
    }

    onFilteredProjectsChange(filtered);
  }, [filters.searchText, filters.selectedTeam, filters.selectedStatus, projects]); // More specific dependencies

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchText: '',
      selectedTeam: '',
      selectedStatus: ''
    });
  };

  const hasActiveFilters = filters.searchText || filters.selectedTeam || filters.selectedStatus;

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Search projects by name..."
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 ${
                hasActiveFilters 
                  ? 'border-blue-500 text-blue-700 bg-blue-50' 
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              <Filter className="mr-2 h-4 w-4" />
              Bộ lọc
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {[filters.selectedTeam, filters.selectedStatus].filter(Boolean).length}
                </span>
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Team Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team
                    </label>
                    <select
                      value={filters.selectedTeam}
                      onChange={(e) => handleFilterChange('selectedTeam', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={teams.length === 0}
                    >
                      {teamOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {teams.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No teams available</p>
                    )}
                    {teams.length > 0 && projects.filter(p => p.team).length === 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Projects haven't been assigned to teams yet
                      </p>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.selectedStatus}
                      onChange={(e) => handleFilterChange('selectedStatus', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Active filters:</span>
            <div className="flex space-x-1">
              {filters.selectedTeam && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Team: {teamOptions.find(t => t.value === filters.selectedTeam)?.label}
                  <button
                    onClick={() => handleFilterChange('selectedTeam', '')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.selectedStatus && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Status: {filters.selectedStatus}
                  <button
                    onClick={() => handleFilterChange('selectedStatus', '')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close filter dropdown */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  );
};

export default ProjectFilter;
