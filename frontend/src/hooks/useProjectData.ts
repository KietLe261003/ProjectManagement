import { useState, useMemo, useEffect } from 'react';
import { useFrappeGetDocList} from 'frappe-react-sdk';
import type { FilteredData, Project, Task, Timesheet } from '../types';

export const useProjectData = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  
  // State cho phases với tasks
  const [phasesWithTasks, setPhasesWithTasks] = useState<any[]>([]);
  const [phasesTasksLoading, setPhasesTasksLoading] = useState(false);

  // Fetch Projects from API
  const { 
    data: projectsData, 
    isLoading: projectsLoading,
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
  });

  // Fetch Phase list để lấy names
  const { 
    data: phasesListData, 
    isLoading: phasesLoading,
  } = useFrappeGetDocList<any>('project_phase', {
    fields: ['name'], // Chỉ cần name để fetch từng doc riêng
    limit: 0 // Get all phases
  });

  // Fetch từng Phase document riêng lẻ để lấy child tables
  useEffect(() => {
    const fetchPhasesWithTasks = async () => {
      if (!phasesListData || phasesListData.length === 0) {
        setPhasesWithTasks([]);
        return;
      }

      setPhasesTasksLoading(true);
      // console.log('🔄 Fetching individual phase documents for tasks...');

      try {
        const phasesWithTasksPromises = phasesListData.map(async (phaseItem: any) => {
          try {
            // Fetch full document với useFrappeGetDoc
            const response = await fetch(`/api/resource/project_phase/${phaseItem.name}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              }
            });

            if (!response.ok) {
              console.warn(`❌ Failed to fetch phase ${phaseItem.name}:`, response.status);
              return null;
            }

            const result = await response.json();
            const fullPhase = result.data || result;
            
            // console.log(`✅ Phase ${phaseItem.name} full data:`, fullPhase);
            // console.log(`📋 Phase ${phaseItem.name} tasks:`, fullPhase.tasks);
            
            return fullPhase;
          } catch (error) {
            console.error(`💥 Error fetching phase ${phaseItem.name}:`, error);
            return null;
          }
        });

        const results = await Promise.all(phasesWithTasksPromises);
        const validPhases = results.filter(phase => phase !== null);
        
        // console.log('🎉 All phases with tasks loaded:', validPhases);
        setPhasesWithTasks(validPhases);
      } catch (error) {
        console.error('💥 Error in fetchPhasesWithTasks:', error);
      } finally {
        setPhasesTasksLoading(false);
      }
    };

    fetchPhasesWithTasks();
  }, [phasesListData]);

  // Fetch Tasks from API
  const { 
    data: tasksData, 
    isLoading: tasksLoading,
  } = useFrappeGetDocList<Task>('Task', {
    fields: [
      'name', 
      'subject', 
      'status',
      'exp_end_date',
      "exp_start_date",
      'project',
      'progress',
      'priority','is_group',
    ],
    limit: 0 // Get all tasks
  });

  // Fetch Timesheets from API
  const { 
    data: timesheetsData, 
    isLoading: timesheetsLoading 
  } = useFrappeGetDocList<Timesheet>('Timesheet', {
    fields: ['name', 'total_hours'],
    limit: 0 // Get all timesheets
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

  // Process phases data từ phasesWithTasks (đã có full data including tasks)
  const allPhases = useMemo(() => {
    if (!phasesWithTasks || phasesWithTasks.length === 0) return [];
    
    return phasesWithTasks.map((phase: any) => {
      // Phase đã có full data bao gồm tasks
      const phaseTasks = phase.tasks || [];
      
      // console.log(`📊 Processing Phase ${phase.name} with ${phaseTasks.length} tasks:`, phaseTasks);
      
      return {
        ...phase,
        phase_name: phase.subject || phase.name || '',
        status: phase.status || 'Open',
        expected_start_date: phase.start_date || '',
        expected_end_date: phase.end_date || '',
        actual_start_date: phase.start_date || '',
        actual_end_date: null,
        progress: phase.progress || 0,
        description: phase.details || '',
        tasks: phaseTasks // Tasks từ full document fetch
      };
    });
  }, [phasesWithTasks]);

  // console.log('Final processed phases with tasks:', allPhases);

  const allTasks = (tasksData || []).map(task => ({
    ...task,
    project: task.project || '', 
    priority: task.priority || 'Medium', 
    type: task.type || '', 
    expected_time: task.expected_time || 0,
    actual_time: task.actual_time || 0,
    start_date: task.exp_start_date || '',
    end_date: task.exp_end_date || '',
    progress: task.progress || 0,
    assigned_to: task.assigned_to || null,
    is_group: task.is_group || false,
    parent_task_name: task.parent_task_name || null
  }));

  const allTimesheets = (timesheetsData || []).map(timesheet => ({
    name: timesheet.name,
    employee: timesheet.employee || '',
    project: '', 
    task: '', 
    start_date: timesheet.start_date || '',
    end_date: timesheet.end_date || '',
    total_hours: timesheet.total_hours || 0,
    billable: true,
    billing_hours: 0,
    billing_rate: 0,
    billing_amount: 0
  }));
  
  // Loading state - bao gồm cả phasesTasksLoading
  const isLoading = projectsLoading || phasesLoading || phasesTasksLoading || tasksLoading || timesheetsLoading;

  const filteredData: FilteredData = useMemo(() => {
    let projects = allProjects;
    
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
    
    // Filter phases based on selected projects
    const phases = allPhases.filter((phase: any) => {
      return projectCodes.includes(phase.project);
    });
    
    return {
      filteredProjects: projects,
      filteredPhases: phases,
      filteredTasks: allTasks.filter(t => {
        const taskProject = t.project || '';
        const isIncluded = projectCodes.includes(taskProject);
        return isIncluded;
      }),
      filteredTimesheets: allTimesheets.filter(ts => {
        return ts.project ? projectNames.includes(ts.project) : true;
      }),
    };
  }, [allProjects, allPhases, allTasks, allTimesheets, selectedProject, selectedTeam]);
  
  return {
    allProjects,
    allPhases,
    filteredData,
    selectedProject,
    selectedTeam,
    setSelectedProject,
    setSelectedTeam,
    isLoading,
  };
};
