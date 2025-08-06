import { useState, useEffect, useMemo } from 'react';
import type { Project, Task, Timesheet, FilteredData } from '../types';
import { generateFakeData } from '../utils/dataGenerator';

export const useProjectData = () => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allTimesheets, setAllTimesheets] = useState<Timesheet[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = generateFakeData();
    setAllProjects(data.projects);
    setAllTasks(data.tasks);
    setAllTimesheets(data.timesheets);
    setIsLoading(false);
  }, []);

  const filteredData: FilteredData = useMemo(() => {
    if (selectedProject === 'all') {
      return {
        filteredProjects: allProjects,
        filteredTasks: allTasks,
        filteredTimesheets: allTimesheets,
      };
    }
    
    return {
      filteredProjects: allProjects.filter(p => p.project_name === selectedProject),
      filteredTasks: allTasks.filter(t => t.project === selectedProject),
      filteredTimesheets: allTimesheets.filter(ts => ts.project === selectedProject),
    };
  }, [allProjects, allTasks, allTimesheets, selectedProject]);

  return {
    allProjects,
    filteredData,
    selectedProject,
    setSelectedProject,
    isLoading,
  };
};
