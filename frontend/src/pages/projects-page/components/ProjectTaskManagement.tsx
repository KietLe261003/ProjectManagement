import React, { useState } from 'react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { CheckCircle2, Circle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectPhase } from './CreateProjectPhase';
import type { project_phase } from '@/types/Todo/project_phase';
import type { SubTask } from '@/types/Todo/SubTask';

interface ProjectTaskManagementProps {
  projectName: string;
}

export const ProjectTaskManagement: React.FC<ProjectTaskManagementProps> = ({ projectName }) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isCreatePhaseModalOpen, setIsCreatePhaseModalOpen] = useState(false);

  // Fetch project phases
  const { data: phases, isLoading: phasesLoading, mutate: mutatePhases } = useFrappeGetDocList('project_phase', {
    fields: ['name', 'subject', 'status', 'priority', 'start_date', 'end_date', 'progress', 'details', 'costing', 'tasks'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'start_date', order: 'asc' }
  });

  // Fetch all tasks for this project
  const { data: tasks, isLoading: tasksLoading } = useFrappeGetDocList('Task', {
    fields: ['name', 'subject', 'status', 'priority', 'project', 'exp_start_date', 'exp_end_date', 'progress'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'exp_start_date', order: 'asc' }
  });

  // Fetch all subtasks for this project
  const { data: subtasks, isLoading: subtasksLoading } = useFrappeGetDocList('SubTask', {
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
    
    if (type === 'phase' || (type === 'task' && hasChildren)) {
      icon = isExpanded ? '▼' : '▶️';
      iconClass += ' text-blue-600 cursor-pointer hover:text-blue-800 transition-colors';
    } else if (type === 'phase-task') {
      icon = '•';
      iconClass += ' text-gray-400';
    } else if (type === 'subtask') {
      icon = '◦';
      iconClass += ' text-gray-400';
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
            {getStatusIcon(status)}
            <div className="ml-3 flex-1">
              <div className={`font-medium ${type === 'phase' ? 'text-blue-900 text-lg' : type === 'task' ? 'text-gray-900' : 'text-gray-700'}`}>
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
                className={`${type === 'phase' ? 'bg-blue-600' : type === 'task' ? 'bg-green-600' : 'bg-purple-600'} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 w-8 text-right">{progress}%</span>
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

  const projectPhases = phases as project_phase[] || [];
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
        <Button 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => setIsCreatePhaseModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Phase
        </Button>
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
          {projectPhases.map((phase) => {
            const isPhaseExpanded = expandedPhases.has(phase.name);
            const phaseTasks = phase.tasks || [];

            return (
              <div key={phase.name}>
                {/* Phase Row */}
                {renderTaskItem(
                  phase,
                  0,
                  'phase',
                  phaseTasks.length > 0,
                  isPhaseExpanded,
                  () => {
                    console.log('Phase toggle clicked:', phase.name);
                    togglePhase(phase.name);
                  }
                )}

                {/* Phase Tasks */}
                {isPhaseExpanded && phaseTasks.map((phaseTask) => (
                  renderTaskItem(
                    phaseTask,
                    1,
                    'phase-task',
                    false,
                    false
                  )
                ))}
              </div>
            );
          })}

          {/* Standalone Project Tasks */}
          {projectTasks.map((task) => {
            const isTaskExpanded = expandedTasks.has(task.name);
            const taskSubtasks = getTaskSubtasks(task.name);
            const hasSubtasks = taskSubtasks.length > 0;

            return (
              <div key={task.name}>
                {/* Task Row */}
                {renderTaskItem(
                  task,
                  0,
                  'task',
                  hasSubtasks,
                  isTaskExpanded,
                  hasSubtasks ? () => {
                    console.log('Task toggle clicked:', task.name);
                    toggleTask(task.name);
                  } : undefined
                )}

                {/* Subtasks */}
                {isTaskExpanded && taskSubtasks.map((subtask) => (
                  renderTaskItem(
                    subtask,
                    1,
                    'subtask',
                    false,
                    false
                  )
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
    </div>
  );
};
