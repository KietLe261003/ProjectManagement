import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import type { Project } from '../types';
import { Card } from './Card';

interface ProjectFilterProps {
  projects: Project[];
  selectedProject: string;
  selectedDepartment: string;
  selectedTeam: string;
  onProjectChange: (projectName: string) => void;
  onDepartmentChange: (department: string) => void;
  onTeamChange: (team: string) => void;
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  projects,
  selectedProject,
  selectedDepartment,
  selectedTeam,
  onProjectChange,
  onDepartmentChange,
  onTeamChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Lấy danh sách phòng ban duy nhất
  const departments = Array.from(new Set(projects.map(p => p.department).filter(Boolean)));
  
  // Lấy danh sách team dựa trên phòng ban đã chọn
  const teams = (selectedDepartment === 'all' || selectedDepartment === '') ? [] : 
    Array.from(new Set(projects
      .filter(p => p.department === selectedDepartment)
      .map(p => p.team)
      .filter(Boolean)
    ));

  // Lọc projects dựa trên department và team đã chọn
  const filteredProjects = projects.filter(project => {
    // Nếu không chọn department cụ thể, hiển thị tất cả
    if (selectedDepartment === 'all' || selectedDepartment === '') {
      return true;
    }
    
    // Nếu đã chọn department
    if (project.department !== selectedDepartment) {
      return false;
    }
    
    // Nếu không chọn team cụ thể, hiển thị tất cả projects của department
    if (selectedTeam === 'all' || selectedTeam === '') {
      return true;
    }
    
    // Kiểm tra team
    return project.team === selectedTeam;
  });

  // Hiển thị thông tin filter đang được áp dụng
  const getFilterSummary = () => {
    const filters = [];
    if (selectedDepartment !== 'all') filters.push(`Phòng ban: ${selectedDepartment}`);
    if (selectedTeam !== 'all') filters.push(`Team: ${selectedTeam}`);
    if (selectedProject !== 'all') filters.push(`Dự án: ${selectedProject}`);
    
    return filters.length > 0 ? filters.join(' | ') : 'Tất cả dự án';
  };

  return (
    <Card 
      title={
        <div 
          className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-md transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            <span>Bộ lọc dự án</span>
            {!isExpanded && (
              <span className="ml-3 text-sm text-gray-600 font-normal">
                - {getFilterSummary()}
              </span>
            )}
          </div>
          <button
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-50"
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            onClick={(e) => {
              e.stopPropagation(); // Ngăn trigger click của parent
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      }
    >
      {/* Form filter khi mở rộng */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter theo phòng ban */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phòng ban
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                onDepartmentChange(e.target.value);
                onTeamChange('all'); // Reset team khi chọn phòng ban mới
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Filter theo team - chỉ hiện khi đã chọn phòng ban cụ thể */}
          {selectedDepartment !== 'all' && selectedDepartment !== '' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => onTeamChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả team</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter theo dự án cụ thể */}
          <div className={(selectedDepartment !== 'all' && selectedDepartment !== '') ? 'md:col-span-2' : 'md:col-span-3'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dự án
            </label>
            <select
              value={selectedProject}
              onChange={(e) => onProjectChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả dự án</option>
              {filteredProjects.map((project) => (
                <option key={project.name} value={project.project_name}>
                  {project.project_name} ({project.department} - {project.team})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </Card>
  );
};
