import { useState, useMemo } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import type { FilteredData, Project,Task,Timesheet } from '../types';

export const useProjectData = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  // Fetch Projects from API - bỏ limit để lấy tất cả projects
  const { 
    data: projectsData, 
    isLoading: projectsLoading,
    error: projectsError
  } = useFrappeGetDocList<Project>('Project', {
    fields: [
      'name',
      'project_name',
      'status',
      'department',
      'team',
      'estimated_costing',
      'expected_end_date',
      'percent_complete',
    ]
    // Bỏ limit để lấy tất cả projects
  });
  // console.log('Projects data:', projectsData);
  // console.log('Projects error:', projectsError);

  // Fetch Tasks from API - bỏ limit để lấy tất cả tasks
  const { 
    data: tasksData, 
    isLoading: tasksLoading,
    error: tasksError
  } = useFrappeGetDocList<Task>('Task', {
    fields: ['name', 'subject', 'status','exp_end_date',"exp_start_date",'project',
      'progress','priority','is_group',
    ]
  });

  // Log để debug
  console.log('Tasks data:', tasksData);
  // console.log('Tasks error:', tasksError);

  // Fetch Timesheets from API - bỏ limit
  const { 
    data: timesheetsData, 
    isLoading: timesheetsLoading 
  } = useFrappeGetDocList<Timesheet>('Timesheet', {
    fields: ['name', 'total_hours']
  });
  // Process API data with default values
  const allProjects = (projectsData || []).map(project => ({
    ...project,
    project_type: project.project_type || '', 
    customer: project.customer || '',
    company: project.company || '',
    department: project.department || '',
    team: project.team || '',
    expected_start_date: project.expected_start_date || '',
    expected_end_date: project.expected_end_date || '',
    actual_start_date: project.actual_start_date || '',
    actual_end_date: project.actual_end_date || null,
    percent_complete: project.percent_complete || 0,
    priority: project.priority || 'Medium',
    estimated_costing: project.estimated_costing || 0,
    total_billable_amount: project.total_billable_amount || 0,
    total_billed_amount: project.total_billed_amount || 0,
    gross_margin: project.gross_margin || 0,
    estimated_hours: project.estimated_hours || 0,
    total_hours: project.total_hours || 0,
    is_active: project.is_active ?? true
  }));

  const allTasks = (tasksData || []).map(task => ({
    ...task,
    project: task.project || '', // Set default for missing field
    priority: task.priority || 'Medium', // Set default for missing field
    type: task.type || '', // Set default for missing field
    expected_time: task.expected_time || 0,
    actual_time: task.actual_time || 0,
    start_date: task.exp_start_date || '',
    end_date: task.exp_end_date || '',
    progress: task.progress || 0,
    assigned_to: task.assigned_to || null,
    is_group: task.is_group || false,
    parent_task_name: task.parent_task_name || null
  }));

  console.log('All tasks after processing:', allTasks);

  const allTimesheets = (timesheetsData || []).map(timesheet => ({
    name: timesheet.name,
    employee: timesheet.employee || '',
    project: '', // Set empty for now
    task: '', // Set empty for now
    start_date: timesheet.start_date || '',
    end_date: timesheet.end_date || '',
    total_hours: timesheet.total_hours || 0,
    billable: true,
    billing_hours: 0,
    billing_rate: 0,
    billing_amount: 0
  }));
  
  // Loading state - true if any API call is still loading
  const isLoading = projectsLoading || tasksLoading || timesheetsLoading;

  const filteredData: FilteredData = useMemo(() => {
    let projects = allProjects;
    
    // Filter theo department
    if (selectedDepartment !== 'all' && selectedDepartment !== '') {
      projects = projects.filter(p => p.department === selectedDepartment);
    }
    
    // Filter theo team
    if (selectedTeam !== 'all' && selectedTeam !== '') {
      projects = projects.filter(p => p.team === selectedTeam);
    }
    
    // Filter theo project
    if (selectedProject !== 'all' && selectedProject !== '') {
      projects = projects.filter(p => p.project_name === selectedProject);
    }
    
    const projectNames = projects.map(p => p.project_name);
    const projectCodes = projects.map(p => p.name); // PROJ-0001, PROJ-0002, etc.
    
    console.log('Project names for filtering:', projectNames);
    console.log('Project codes for filtering:', projectCodes);
    console.log('All tasks before filtering:', allTasks);
    console.log('Tasks projects:', allTasks.map(t => t.project));
    
    return {
      filteredProjects: projects,
      filteredTasks: allTasks.filter(t => {
        const taskProject = t.project || '';
        // Filter theo project code (PROJ-0001) thay vì project name
        const isIncluded = projectCodes.includes(taskProject);
        console.log(`Task ${t.name} project "${taskProject}" included:`, isIncluded);
        return isIncluded;
      }),
      filteredTimesheets: allTimesheets.filter(ts => {
        // For now, include all timesheets since project field may not be directly available
        // In a real implementation, you might need to fetch project from time_logs child table
        return ts.project ? projectNames.includes(ts.project) : true;
      }),
    };
  }, [allProjects, allTasks, allTimesheets, selectedProject, selectedDepartment, selectedTeam]);
  return {
    allProjects,
    filteredData,
    selectedProject,
    selectedDepartment,
    selectedTeam,
    setSelectedProject,
    setSelectedDepartment,
    setSelectedTeam,
    isLoading,
  };
};
