import React, { useState, useEffect } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { CheckCircle2, Circle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectPhase } from './CreateProjectPhase';
import { CreateTask } from './CreateTask';
import { CreateSubTask } from './CreateSubTask';
import type { SubTask } from '@/types/Todo/SubTask';

interface ProjectTaskManagementProps {
  projectName: string;
  onViewPhaseDetails?: (phase: any) => void;
  onViewTaskDetails?: (task: any) => void;
  onViewSubTaskDetails?: (subtask: any) => void;
}

export const ProjectTaskManagement: React.FC<ProjectTaskManagementProps> = ({ 
  projectName, 
  onViewPhaseDetails,
  onViewTaskDetails,
  onViewSubTaskDetails
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isCreatePhaseModalOpen, setIsCreatePhaseModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreateSubTaskModalOpen, setIsCreateSubTaskModalOpen] = useState(false);
  const [phasesWithTasks, setPhasesWithTasks] = useState<any[]>([]);

  // Fetch project phases list first
  const { data: phasesList, isLoading: phasesLoading, mutate: mutatePhases } = useFrappeGetDocList('project_phase', {
    fields: ['name', 'subject', 'status', 'priority', 'start_date', 'end_date', 'progress', 'details', 'costing'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'start_date', order: 'asc' }
  });

  // Fetch individual phase documents to get child table data
  useEffect(() => {
    if (phasesList && phasesList.length > 0) {
      const fetchPhasesWithTasks = async () => {
        const results = [];
        for (const phase of phasesList) {
          try {
            // Use frappe.client.get to get full document with child tables
            const response = await fetch(`/api/resource/project_phase/${phase.name}`, {
              headers: {
                'Accept': 'application/json',
              }
            });
            
            if (response.ok) {
              const phaseDoc = await response.json();
              results.push(phaseDoc.data);
            } else {
              console.warn('Failed to fetch phase:', phase.name);
              // Fallback to the basic phase data
              results.push(phase);
            }
          } catch (error) {
            console.error('Error fetching phase:', phase.name, error);
            // Fallback to the basic phase data
            results.push(phase);
          }
        }
        setPhasesWithTasks(results);
      };
      
      fetchPhasesWithTasks();
    }
  }, [phasesList]);

  console.log('Phases List:', phasesList);
  console.log('Phases With Tasks:', phasesWithTasks);

  // Fetch all tasks for this project
  const { data: tasks, isLoading: tasksLoading, mutate: mutateTasks } = useFrappeGetDocList('Task', {
    fields: ['name', 'subject', 'status', 'priority', 'project', 'exp_start_date', 'exp_end_date', 'progress'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'exp_start_date', order: 'asc' }
  });

  // Fetch all subtasks for this project
  const { data: subtasks, isLoading: subtasksLoading, mutate: mutateSubtasks } = useFrappeGetDocList('SubTask', {
    fields: ['name', 'subject', 'task', 'status', 'progress', 'start_date', 'end_date', 'description'],
    orderBy: { field: 'start_date', order: 'asc' }
  });

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Working':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Working':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Render individual task/subtask item
  const renderTaskItem = (
    item: any, 
    level: number, 
    type: 'phase' | 'phase-task' | 'task' | 'subtask',
    hasChildren: boolean = false,
    isExpanded: boolean = false,
    onToggle?: () => void
  ) => {
    const indentClass = level > 0 ? `pl-${level * 6}` : 'pl-6';
    
    let icon = '';
    let iconClass = 'mr-3 text-lg';
    let prefixIcon = '';
    
    // Add prefix icons to distinguish phases from tasks
    if (type === 'phase') {
      prefixIcon = '📋';
    } else if (type === 'task') {
      prefixIcon = '📝';
    } else if (type === 'phase-task') {
      prefixIcon = '📄';
    } else if (type === 'subtask') {
      prefixIcon = '📌';
    }
    
    if (type === 'phase' || (type === 'task' && hasChildren) || (type === 'phase-task' && hasChildren)) {
      icon = isExpanded ? '▼' : '▶️';
      iconClass += ' text-blue-600 cursor-pointer hover:text-blue-800 transition-colors';
    } else if (type === 'phase-task') {
      icon = '•';
      iconClass += ' text-green-500';
    } else if (type === 'subtask') {
      icon = '◦';
      iconClass += ' text-gray-400';
    } else if (type === 'task') {
      icon = '●';
      iconClass += ' text-orange-500';
    } else {
      icon = '●';
      iconClass += ' text-gray-400';
    }

    const displayName = item.subject || item.name;
    const status = item.status || 'Open';
    const progress = item.progress || 0;

    const handleIconClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onToggle) {
        onToggle();
      }
    };

    return (
      <div 
        key={`${type}-${item.name}`} 
        className="hover:bg-gray-50 transition-colors"
      >
        <div className={`grid grid-cols-12 gap-4 py-3 px-6 border-b border-gray-100 items-center ${indentClass}`}>
          {/* Task/Phase Name Column */}
          <div className="col-span-6 flex items-center">
            <span 
              className={iconClass}
              onClick={handleIconClick}
              role={onToggle ? "button" : undefined}
              tabIndex={onToggle ? 0 : undefined}
            >
              {icon}
            </span>
            <span className="mr-2 text-lg">{prefixIcon}</span>
            {getStatusIcon(status)}
            <div className="ml-3 flex-1">
              <div className={`font-medium ${type === 'phase' ? 'text-blue-900 text-lg' : type === 'task' ? 'text-orange-900' : type === 'phase-task' ? 'text-green-900' : 'text-gray-700'}`}>
                {displayName}
              </div>
              {item.description && type === 'subtask' && (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              )}
              {item.details && type === 'phase' && (
                <p className="text-sm text-gray-600 mt-1">{item.details}</p>
              )}
            </div>
          </div>
          
          {/* Status Column */}
          <div className="col-span-2 text-center">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          
          {/* Priority Column */}
          <div className="col-span-2 text-center">
            {item.priority && (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </span>
            )}
          </div>
          
          {/* Progress Column */}
          <div className="col-span-2 flex items-center justify-center space-x-2">
            <div className={`${type === 'phase' ? 'w-20' : 'w-16'} bg-gray-200 rounded-full h-2`}>
              <div
                className={`${
                  type === 'phase' ? 'bg-blue-600' : 
                  type === 'task' ? 'bg-orange-600' : 
                  type === 'phase-task' ? 'bg-green-600' : 
                  'bg-purple-600'
                } h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 w-8 text-right">{progress}%</span>
            {type === 'phase' && onViewPhaseDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewPhaseDetails(item);
                }}
                className="ml-2 h-7 px-2 text-xs"
              >
                View Details
              </Button>
            )}
            {(type === 'task' || type === 'phase-task') && onViewTaskDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewTaskDetails(item);
                }}
                className="ml-2 h-7 px-2 text-xs"
              >
                View Details
              </Button>
            )}
            {type === 'subtask' && onViewSubTaskDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewSubTaskDetails(item);
                }}
                className="ml-2 h-7 px-2 text-xs"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (phasesLoading || tasksLoading || subtasksLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
      </div>
    );
  }

  const projectPhases = phasesWithTasks.length > 0 ? phasesWithTasks : phasesList || [];
  const projectTasks = tasks as any[] || [];
  const projectSubtasks = subtasks as SubTask[] || [];

  // Debug logging
  console.log('ProjectTaskManagement render:', {
    projectName,
    phases: projectPhases.length,
    tasks: projectTasks.length,
    subtasks: projectSubtasks.length,
    expandedPhases: Array.from(expandedPhases),
    expandedTasks: Array.from(expandedTasks),
    phasesData: projectPhases
  });

  // Helper function to get subtasks for a task
  const getTaskSubtasks = (taskName: string) => {
    return projectSubtasks.filter(sub => sub.task === taskName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Project Tasks & Phases</h3>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsCreateSubTaskModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add SubTask
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsCreateTaskModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
          <Button 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setIsCreatePhaseModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Phase
          </Button>
        </div>
      </div>

      {/* Task Tree */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Header Row */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-6">Task / Phase</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Priority</div>
          <div className="col-span-2 text-center">Progress</div>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Phases */}
          {projectPhases.map((phase: any) => {
            const isPhaseExpanded = expandedPhases.has(phase.name);
            // Get tasks from the phase's tasks child table
            const phaseTaskList = phase.tasks || [];

            return (
              <div key={phase.name}>
                {/* Phase Row */}
                {renderTaskItem(
                  phase,
                  0,
                  'phase',
                  phaseTaskList.length > 0,
                  isPhaseExpanded,
                  () => {
                    console.log('Phase toggle clicked:', phase.name, 'Tasks:', phaseTaskList.length, 'Tasks data:', phaseTaskList);
                    togglePhase(phase.name);
                  }
                )}

                {/* Phase Tasks */}
                {isPhaseExpanded && phaseTaskList.map((phaseTask: any, index: number) => {
                  // Find the actual task data
                  const taskData = projectTasks.find((t: any) => t.name === phaseTask.task);
                  const taskSubtasks = getTaskSubtasks(phaseTask.task);
                  const hasSubtasks = taskSubtasks.length > 0;
                  const isTaskExpanded = expandedTasks.has(phaseTask.task);
                  
                  if (!taskData) {
                    // If task data not found, create a minimal display object
                    const minimalTask = { name: phaseTask.task, subject: phaseTask.task, status: 'Open' };
                    
                    return (
                      <div key={`phase-task-${index}`}>
                        {renderTaskItem(
                          minimalTask,
                          1,
                          'phase-task',
                          hasSubtasks,
                          isTaskExpanded,
                          hasSubtasks ? () => {
                            console.log('Phase task toggle clicked:', phaseTask.task, 'Subtasks:', taskSubtasks.length);
                            toggleTask(phaseTask.task);
                          } : undefined
                        )}
                        
                        {/* Subtasks for this phase task */}
                        {isTaskExpanded && hasSubtasks && taskSubtasks.map((subtask: any, subIndex: number) => (
                          <div key={`subtask-${subIndex}`}>
                            {renderTaskItem(
                              subtask,
                              2,
                              'subtask',
                              false,
                              false
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={`phase-task-${index}`}>
                      {renderTaskItem(
                        taskData,
                        1,
                        'phase-task',
                        hasSubtasks,
                        isTaskExpanded,
                        hasSubtasks ? () => {
                          console.log('Phase task toggle clicked:', taskData.name, 'Subtasks:', taskSubtasks.length);
                          toggleTask(taskData.name);
                        } : undefined
                      )}
                      
                      {/* Subtasks for this phase task */}
                      {isTaskExpanded && hasSubtasks && taskSubtasks.map((subtask: any, subIndex: number) => (
                        <div key={`subtask-${subIndex}`}>
                          {renderTaskItem(
                            subtask,
                            2,
                            'subtask',
                            false,
                            false
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Separator if there are both phases and standalone tasks */}
          {projectPhases.length > 0 && projectTasks.filter((task: any) => {
            const isInPhase = projectPhases.some((phase: any) => 
              phase.tasks?.some((phaseTask: any) => phaseTask.task === task.name)
            );
            return !isInPhase;
          }).length > 0 && (
            <div className="bg-gray-100 px-6 py-2 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-600 flex items-center">
                <span className="mr-2">📝</span>
                Standalone Tasks
              </div>
            </div>
          )}

          {/* Standalone Project Tasks (not in any phase) */}
          {projectTasks.filter((task: any) => {
            // Filter out tasks that are already in phases
            const isInPhase = projectPhases.some((phase: any) => 
              phase.tasks?.some((phaseTask: any) => phaseTask.task === task.name)
            );
            return !isInPhase;
          }).map((task: any) => {
            const isTaskExpanded = expandedTasks.has(task.name);
            const taskSubtasks = getTaskSubtasks(task.name);
            const hasSubtasks = taskSubtasks.length > 0;

            return (
              <div key={task.name}>
                {/* Standalone Task Row */}
                {renderTaskItem(
                  task,
                  0,
                  'task',
                  hasSubtasks,
                  isTaskExpanded,
                  hasSubtasks ? () => {
                    console.log('Standalone task toggle clicked:', task.name, 'Subtasks:', taskSubtasks.length);
                    toggleTask(task.name);
                  } : undefined
                )}

                {/* Subtasks for standalone task */}
                {isTaskExpanded && hasSubtasks && taskSubtasks.map((subtask: any, subIndex: number) => (
                  <div key={`standalone-subtask-${subIndex}`}>
                    {renderTaskItem(
                      subtask,
                      1,
                      'subtask',
                      false,
                      false
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {projectPhases.length === 0 && projectTasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No phases or tasks yet</h3>
            <p className="text-gray-600 mb-6">Start organizing your project by creating phases and tasks.</p>
            <div className="flex gap-3 justify-center">
              <Button>Create First Phase</Button>
              <Button variant="outline">Create Task</Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{projectPhases.length}</div>
          <div className="text-sm text-blue-600">Total Phases</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{projectTasks.length}</div>
          <div className="text-sm text-green-600">Total Tasks</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{projectSubtasks.length}</div>
          <div className="text-sm text-purple-600">Total Subtasks</div>
        </div>
      </div>

      {/* Create Project Phase Modal */}
      <CreateProjectPhase
        isOpen={isCreatePhaseModalOpen}
        onClose={() => setIsCreatePhaseModalOpen(false)}
        projectName={projectName}
        onSuccess={() => {
          mutatePhases(); // Refresh phases data
        }}
      />

      {/* Create Task Modal */}
      <CreateTask
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectName={projectName}
        onSuccess={() => {
          mutateTasks(); // Refresh tasks data
        }}
      />

      {/* Create SubTask Modal */}
      <CreateSubTask
        isOpen={isCreateSubTaskModalOpen}
        onClose={() => setIsCreateSubTaskModalOpen(false)}
        projectName={projectName}
        onSuccess={() => {
          mutateSubtasks(); // Refresh subtasks data
        }}
      />
    </div>
  );
};
