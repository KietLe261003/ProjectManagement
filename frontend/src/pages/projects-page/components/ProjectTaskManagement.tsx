import React, { useState, useEffect } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectPhase } from './phase/CreateProjectPhase';
import { CreateStandaloneTask } from './task';
import type { SubTask } from '@/types/Todo/SubTask';
import { usePhaseProgressAutoUpdate } from '@/hooks/usePhaseProgressAutoUpdate';

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
  const [phasesWithTasks, setPhasesWithTasks] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  }>({ visible: false, text: '', x: 0, y: 0 });

  // Fetch project phases list first
  const { data: phasesList, isLoading: phasesLoading, mutate: mutatePhases } = useFrappeGetDocList('project_phase', {
    fields: ['name', 'subject', 'status', 'priority', 'start_date', 'end_date', 'progress', 'details', 'costing'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'start_date', order: 'asc' },
    limit: 0 // Get all phases
  });

  // Use auto-update hook for realtime phase progress updates
  usePhaseProgressAutoUpdate(projectName, () => {
    mutatePhases();
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
                'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
              },
              credentials: 'include'
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
    } else {
      setPhasesWithTasks([]);
    }
  }, [phasesList?.length, phasesList?.map(p => p.name).join(',')]);  // More stable dependencies

  // Fetch all tasks for this project
  const { data: tasks, isLoading: tasksLoading, mutate: mutateTasks } = useFrappeGetDocList('Task', {
    fields: ['name', 'subject', 'status', 'priority', 'project', 'exp_start_date', 'exp_end_date', 'progress'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'exp_start_date', order: 'asc' },
    limit: 0 // Get all tasks
  });

  // Get task names for filtering subtasks and ToDos
  const taskNames = tasks?.map((task: any) => task.name) || [];

  // Fetch ToDo assignments for tasks (similar to EditTask approach)
  const { data: taskToDos, isLoading: toDosLoading, mutate: mutateTaskToDos } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'allocated_to', 'reference_name', 'reference_type'],
    filters: [
      ['reference_type', '=', 'Task'],
      ['reference_name', 'in', taskNames.length > 0 ? taskNames : ['dummy-non-existent-task']]
    ],
    limit: 0
  });

  // Get unique user IDs from task assignments
  const taskUserIds = Array.from(new Set(taskToDos?.map((todo: any) => todo.allocated_to).filter(Boolean))) || [];

  // Fetch user details for task assignments
  const { data: taskUsers, isLoading: taskUsersLoading } = useFrappeGetDocList('User', {
    fields: ['name', 'full_name', 'email'],
    filters: taskUserIds.length > 0 ? [['name', 'in', taskUserIds]] : [['name', '=', 'dummy-non-existent-user']],
    limit: 0
  });

  // Fetch all subtasks for tasks in this project
  const { data: subtasks, isLoading: subtasksLoading, mutate: mutateSubtasks } = useFrappeGetDocList('SubTask', {
    fields: ['name', 'subject', 'task', 'status', 'progress', 'start_date', 'end_date', 'description'],
    filters: taskNames.length > 0 ? [['task', 'in', taskNames]] : [['task', '=', 'dummy-non-existent-task']],
    orderBy: { field: 'start_date', order: 'asc' },
    limit: 0 // Get all subtasks
  });

  // Get subtask names for fetching their ToDos
  const subtaskNames = subtasks?.map((subtask: any) => subtask.name) || [];

  // Fetch ToDo assignments for subtasks
  const { data: subtaskToDos, isLoading: subtaskToDosLoading, mutate: mutateSubtaskToDos } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'allocated_to', 'reference_name', 'reference_type'],
    filters: [
      ['reference_type', '=', 'SubTask'],
      ['reference_name', 'in', subtaskNames.length > 0 ? subtaskNames : ['dummy-non-existent-subtask']]
    ],
    limit: 0
  });

  // Get unique user IDs from subtask assignments
  const subtaskUserIds = Array.from(new Set(subtaskToDos?.map((todo: any) => todo.allocated_to).filter(Boolean))) || [];

  // Fetch user details for subtask assignments
  const { data: subtaskUsers, isLoading: subtaskUsersLoading } = useFrappeGetDocList('User', {
    fields: ['name', 'full_name', 'email'],
    filters: subtaskUserIds.length > 0 ? [['name', 'in', subtaskUserIds]] : [['name', '=', 'dummy-non-existent-user']],
    limit: 0
  });

  // Tooltip functions
  const showTooltip = (text: string, event: React.MouseEvent) => {
    // Simple tooltip implementation using React state
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      x: rect.left,
      y: rect.top - 35, // Position above the element
    });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  // Helper function to get assigned user for a task
  const getTaskAssignment = (taskName: string) => {
    const assignment = taskToDos?.find((todo: any) => todo.reference_name === taskName);
    if (!assignment?.allocated_to) return null;
    
    // Find user details
    const userDetails = taskUsers?.find((user: any) => user.name === assignment.allocated_to);
    return userDetails?.full_name || assignment.allocated_to; // Fallback to ID if full_name not found
  };

  // Helper function to get assigned user for a subtask
  const getSubtaskAssignment = (subtaskName: string) => {
    const assignment = subtaskToDos?.find((todo: any) => todo.reference_name === subtaskName);
    if (!assignment?.allocated_to) return null;
    
    // Find user details
    const userDetails = subtaskUsers?.find((user: any) => user.name === assignment.allocated_to);
    return userDetails?.full_name || assignment.allocated_to; // Fallback to ID if full_name not found
  };

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

  // Reload data when user switches back to this tab/window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        mutatePhases();
        mutateTasks();
        mutateSubtasks();
        mutateTaskToDos();
        mutateSubtaskToDos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mutatePhases, mutateTasks, mutateSubtasks, mutateTaskToDos, mutateSubtaskToDos]);

  // Removed status icons for cleaner UI
  const getStatusIcon = (_status: string) => {
    return null; // No icons displayed
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
    // Create consistent indentation for name column
    let paddingLeft = '0.75rem'; // Base padding for phases
    
    if (type === 'phase-task' || (type === 'task' && level === 1)) {
      paddingLeft = '2rem'; // All tasks (both in phases and standalone) at same level
    } else if (type === 'subtask') {
      paddingLeft = '3.5rem'; // Subtasks indented further
    }
    
    // Simplified expand/collapse icon logic - removed prefix emojis for cleaner UI
    const hasExpandButton = type === 'phase' || (type === 'task' && hasChildren) || (type === 'phase-task' && hasChildren);
    
    const displayName = item.subject || item.name;
    const status = item.status || 'Open';
    const progress = item.progress || 0;

    const handleExpandClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onToggle) {
        onToggle();
      }
    };

    // Handle click for view details (changed from double click)
    const handleViewDetailsClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (type === 'phase' && onViewPhaseDetails) {
        onViewPhaseDetails(item);
      } else if ((type === 'task' || type === 'phase-task') && onViewTaskDetails) {
        onViewTaskDetails(item);
      } else if (type === 'subtask' && onViewSubTaskDetails) {
        onViewSubTaskDetails(item);
      }
    };

    // Handle single click for toggle (only for expandable items)
    const handleSingleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (hasChildren && onToggle) {
        onToggle();
      }
    };

    // Handle double click for view details
    const handleDoubleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleViewDetailsClick(e);
    };

    // Create background color based on type for better visual hierarchy
    let backgroundClass = 'hover:bg-gray-50';
    let borderClass = '';
    
    if (type === 'phase') {
      // Phase có màu nền trắng, chỉ có hover effect
      backgroundClass = 'bg-white hover:bg-gray-50';
      borderClass = '';
    } else if (type === 'task') {
      // Task standalone có màu nền trắng, chỉ có hover effect
      backgroundClass = 'bg-white hover:bg-gray-50';
      borderClass = '';
    } else if (type === 'phase-task') {
      backgroundClass = 'bg-green-50/20 hover:bg-green-50';
      borderClass = 'border-l-2 border-l-green-200';
    } else if (type === 'subtask') {
      backgroundClass = 'bg-yellow-50/20 hover:bg-yellow-50';
      borderClass = 'border-l-2 border-l-yellow-200';
    }

    return (
      <div 
        key={`${type}-${item.name}`} 
        className={`${backgroundClass} ${borderClass} transition-colors`}
      >
        <div 
          className="grid grid-cols-12 gap-4 py-3 px-6 border-b border-gray-100 items-center cursor-pointer"
          onClick={handleSingleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Task/Phase Name Column - Only this column gets indented */}
          <div className="col-span-4 flex items-center" style={{ paddingLeft }}>
            {/* Expand/Collapse Button */}
            {hasExpandButton && (
              <button
                className="mr-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                onClick={handleExpandClick}
                type="button"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
            {/* Add placeholder space for items without expand button to align text */}
            {!hasExpandButton && (
              <div className="mr-2 p-1 flex-shrink-0 w-6 h-6"></div>
            )}
            {/* Status Icon (now removed for cleaner UI) */}
            {getStatusIcon(status)}
            <div className="ml-1 flex-1 min-w-0">
              <div 
                className={`font-medium truncate ${type === 'phase' ? 'text-blue-900 text-lg' : type === 'task' ? 'text-orange-900' : type === 'phase-task' ? 'text-green-900' : 'text-gray-700'}`}
                onMouseEnter={(e) => showTooltip(displayName, e)}
                onMouseLeave={hideTooltip}
                title={displayName.length > 30 ? displayName : undefined}
              >
                {displayName}
              </div>
              {item.description && type === 'subtask' && (
                <p 
                  className="text-sm text-gray-500 mt-1 truncate"
                  onMouseEnter={(e) => showTooltip(item.description, e)}
                  onMouseLeave={hideTooltip}
                  title={item.description.length > 50 ? item.description : undefined}
                >
                  {item.description}
                </p>
              )}
              {item.details && type === 'phase' && (
                <p 
                  className="text-sm text-gray-600 mt-1 truncate"
                  onMouseEnter={(e) => showTooltip(item.details, e)}
                  onMouseLeave={hideTooltip}
                  title={item.details.length > 50 ? item.details : undefined}
                >
                  {item.details}
                </p>
              )}
            </div>
          </div>
          
          {/* Status Column - Always aligned */}
          <div className="col-span-2 text-center">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          
          {/* Priority Column - Always aligned */}
          <div className="col-span-2 text-center">
            {item.priority && (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </span>
            )}
          </div>
          
          {/* Assign to Column - Only show for tasks and subtasks */}
          <div className="col-span-2 text-center">
            {(type === 'task' || type === 'phase-task') && (
              (() => {
                const assignedUser = getTaskAssignment(item.name);
                return assignedUser ? (
                  <span 
                    className="text-sm text-gray-700 truncate inline-block max-w-full"
                    title={assignedUser.length > 15 ? assignedUser : undefined}
                    onMouseEnter={(e) => assignedUser.length > 15 && showTooltip(assignedUser, e)}
                    onMouseLeave={hideTooltip}
                  >
                    {assignedUser.length > 15 ? `${assignedUser.substring(0, 15)}...` : assignedUser}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Unassigned</span>
                );
              })()
            )}
            {type === 'subtask' && (
              (() => {
                const assignedUser = getSubtaskAssignment(item.name);
                return assignedUser ? (
                  <span 
                    className="text-sm text-gray-700 truncate inline-block max-w-full"
                    title={assignedUser.length > 15 ? assignedUser : undefined}
                    onMouseEnter={(e) => assignedUser.length > 15 && showTooltip(assignedUser, e)}
                    onMouseLeave={hideTooltip}
                  >
                    {assignedUser.length > 15 ? `${assignedUser.substring(0, 15)}...` : assignedUser}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Unassigned</span>
                );
              })()
            )}
            {type === 'phase' && (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
          
          {/* Progress Column - Always aligned, hidden for subtasks */}
          <div className="col-span-1 flex items-center justify-start space-x-2">
            {type !== 'subtask' && (
              <>
                <div className={`${type === 'phase' ? 'w-16' : 'w-12'} bg-gray-200 rounded-full h-2`}>
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-10 text-left flex-shrink-0">{progress}%</span>
              </>
            )}
          </div>
          
          {/* Actions Column */}
          <div className="col-span-1 text-center">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetailsClick(e);
              }}
              className="text-xs px-2 py-1 h-6"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (phasesLoading || tasksLoading || subtasksLoading || toDosLoading || subtaskToDosLoading || taskUsersLoading || subtaskUsersLoading) {
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
          <div className="col-span-4">Task / Phase</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Priority</div>
          <div className="col-span-2 text-center">Assign to</div>
          <div className="col-span-1 text-left">Progress</div>
          <div className="col-span-1 text-center">Actions</div>
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
                {/* Standalone Task Row - Set level to 1 to match phase-task level */}
                {renderTaskItem(
                  task,
                  1,
                  'task',
                  hasSubtasks,
                  isTaskExpanded,
                  hasSubtasks ? () => {
                    toggleTask(task.name);
                  } : undefined
                )}

                {/* Subtasks for standalone task */}
                {isTaskExpanded && hasSubtasks && taskSubtasks.map((subtask: any, subIndex: number) => (
                  <div key={`standalone-subtask-${subIndex}`}>
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
      </div>

      {/* Empty State */}
      {projectPhases.length === 0 && projectTasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No phases or tasks yet</h3>
            <p className="text-gray-600 mb-6">Start organizing your project by creating phases and tasks.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setIsCreatePhaseModalOpen(true)}>Create First Phase</Button>
              <Button variant="outline" onClick={() => setIsCreateTaskModalOpen(true)}>Create Task</Button>
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

      {/* Create Standalone Task Modal */}
      <CreateStandaloneTask
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectName={projectName}
        onSuccess={() => {
          mutateTasks(); // Refresh tasks data
        }}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="fixed z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl pointer-events-none border border-gray-700"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: 'translateY(-100%)',
            maxWidth: '400px', // Reasonable max width
            minWidth: '200px',
            wordWrap: 'break-word'
          }}
        >
          <div className="font-medium leading-relaxed">{tooltip.text}</div>
          {/* Small arrow pointing down, positioned at the start */}
          <div 
            className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            style={{ left: '20px' }}
          ></div>
        </div>
      )}
    </div>
  );
};
