import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useTeams } from '../../../services';
import type { Project } from '../../../types';

interface ProjectFilterProps {
  projects: Project[];
  selectedProject: string;
  selectedTeam: string;
  onProjectChange: (projectName: string) => void;
  onTeamChange: (team: string) => void;
}

interface FilterState {
  selectedTeam: string;
  selectedProject: string;
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  projects,
  selectedProject,
  selectedTeam,
  onProjectChange,
  onTeamChange
}) => {
  const [filters, setFilters] = useState<FilterState>({
    selectedTeam: selectedTeam,
    selectedProject: selectedProject
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Lấy danh sách team từ DocType Team
  const { data: teamsData } = useTeams();

  // Handler để cập nhật filter
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Gọi callback tương ứng
    if (key === 'selectedTeam') {
      onTeamChange(value);
    } else if (key === 'selectedProject') {
      onProjectChange(value);
    }
  };

  // Team options
  const teamOptions = React.useMemo(() => {
    const options = [
      { value: 'all', label: 'Tất cả team' },
      ...(teamsData?.map(team => ({ 
        value: team.name, 
        label: team.team_name || team.name 
      })) || [])
    ];
    
    return [
      options[0], // Keep "All Teams" at top
      ...options.slice(1).sort((a, b) => a.label.localeCompare(b.label))
    ];
  }, [teamsData]);

  // Lọc projects dựa trên team đã chọn
  const filteredProjects = projects.filter(project => {
    // Filter by team
    if (filters.selectedTeam !== 'all' && filters.selectedTeam !== '') {
      if (project.team !== filters.selectedTeam) return false;
    }
    
    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      selectedTeam: 'all',
      selectedProject: 'all'
    });
    onTeamChange('all');
    onProjectChange('all');
  };

  const hasActiveFilters = filters.selectedTeam !== 'all' || filters.selectedProject !== 'all';

  // Sync with parent state
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      selectedTeam: selectedTeam,
      selectedProject: selectedProject
    }));
  }, [selectedTeam, selectedProject]);

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors ${
          hasActiveFilters 
            ? 'border-blue-500 text-blue-700 bg-blue-50' 
            : 'border-gray-300 text-gray-700'
        }`}
      >
        <Filter className="mr-2 h-4 w-4" />
        Bộ lọc
        {hasActiveFilters && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {[filters.selectedTeam !== 'all' ? 1 : 0, filters.selectedProject !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
          </span>
        )}
      </button>

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bộ lọc dự án</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team
                </label>
                <select
                  value={filters.selectedTeam}
                  onChange={(e) => handleFilterChange('selectedTeam', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!teamsData || teamsData.length === 0}
                >
                  {teamOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {(!teamsData || teamsData.length === 0) && (
                  <p className="text-xs text-gray-500 mt-1">Không có team nào</p>
                )}
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dự án
                </label>
                <select
                  value={filters.selectedProject}
                  onChange={(e) => handleFilterChange('selectedProject', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả dự án</option>
                  {filteredProjects.map((project) => (
                    <option key={project.name} value={project.project_name}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Đang áp dụng:</span>
                  <div className="flex flex-wrap gap-2">
                    {filters.selectedTeam !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Team: {teamOptions.find(t => t.value === filters.selectedTeam)?.label}
                        <button
                          onClick={() => handleFilterChange('selectedTeam', 'all')}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {filters.selectedProject !== 'all' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Dự án: {filteredProjects.find(p => p.project_name === filters.selectedProject)?.project_name}
                        <button
                          onClick={() => handleFilterChange('selectedProject', 'all')}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
