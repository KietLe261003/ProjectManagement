import React from 'react';
import type { Project } from '../types';
import { Card } from './Card';

interface ProjectFilterProps {
  projects: Project[];
  selectedProject: string;
  onProjectChange: (projectName: string) => void;
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  projects,
  selectedProject,
  onProjectChange
}) => {
  return (
    <Card title="Chọn dự án">
      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Tất cả dự án</option>
        {projects.map((project) => (
          <option key={project.name} value={project.project_name}>
            {project.project_name}
          </option>
        ))}
      </select>
    </Card>
  );
};
