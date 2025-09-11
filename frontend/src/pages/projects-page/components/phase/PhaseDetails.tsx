import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, DollarSign, Target, AlertCircle, CheckCircle2, Clock, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTask } from '../task/CreateTask';
import { useFrappeGetDocList, useFrappeGetDoc } from 'frappe-react-sdk';
import EditPhase from './EditPhase';
import DeletePhase from './DeletePhase';
import { usePhaseProgressCalculation } from '@/services/phaseProgressService';
import { FileAttachments } from '@/components/FileAttachments';

interface PhaseDetailsProps {
  phase: any;
  projectName: string;
  onBack: () => void;
  onViewTaskDetails?: (task: any) => void;
  onPhaseUpdated?: () => void;
  onPhaseDeleted?: () => void;
  onTaskCreated?: () => void;
}

export const PhaseDetails: React.FC<PhaseDetailsProps> = ({ 
  phase, 
  projectName, 
  onBack, 
  onViewTaskDetails,
  onPhaseUpdated,
  onPhaseDeleted,
  onTaskCreated
}) => {

  
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditPhaseOpen, setIsEditPhaseOpen] = useState(false);
  const [isDeletePhaseOpen, setIsDeletePhaseOpen] = useState(false);
  const [isCalculatingProgress, setIsCalculatingProgress] = useState(false);
  const [isRefreshingAfterEdit, setIsRefreshingAfterEdit] = useState(false);

  // Hook for phase progress calculation
  const { calculateAndUpdatePhaseProgress } = usePhaseProgressCalculation();

  // Fetch current phase data to get updated phase.tasks
  const { data: currentPhase, mutate: mutatePhase } = useFrappeGetDoc(
    'project_phase',
    phase.name,
    'project_phase'
  );

  // Use currentPhase if available, otherwise fallback to phase prop
  const activePhase = currentPhase || phase;

  // Fetch tasks for this phase
  const { data: allTasks, isLoading: tasksLoading, mutate: mutateTasks } = useFrappeGetDocList('Task', {
    fields: ['name', 'subject', 'status', 'priority', 'project', 'exp_start_date', 'exp_end_date', 'progress'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'exp_start_date', order: 'asc' },
    limit: 0 // Get all tasks
  });

  // Filter tasks that belong to this phase (from phase.tasks child table)
  const phaseTasks = React.useMemo(() => {
    if (!allTasks) return [];
    
    // Use activePhase.tasks (which could be updated from server)
    if (activePhase.tasks && activePhase.tasks.length > 0) {
      const phaseTaskNames = activePhase.tasks.map((phaseTask: any) => phaseTask.task);
      return allTasks.filter((task: any) => phaseTaskNames.includes(task.name));
    }
    
    return [];
  }, [allTasks, activePhase.tasks]);

  // Get unique task names for ToDo fetching
  const taskNames = phaseTasks?.map((task: any) => task.name) || [];

  // Fetch ToDo assignments for tasks
  const { data: taskToDos } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'reference_type', 'reference_name', 'allocated_to', 'status'],
    filters: taskNames.length > 0 ? [
      ['reference_type', '=', 'Task'],
      ['reference_name', 'in', taskNames]
    ] : [['name', '=', 'dummy-non-existent-todo']],
    limit: 0
  });

  // Get unique user IDs from task assignments
  const taskUserIds = Array.from(new Set(taskToDos?.map((todo: any) => todo.allocated_to).filter(Boolean))) || [];

  // Fetch user details for task assignments
  const { data: taskUsers } = useFrappeGetDocList('User', {
    fields: ['name', 'full_name', 'email'],
    filters: taskUserIds.length > 0 ? [['name', 'in', taskUserIds]] : [['name', '=', 'dummy-non-existent-user']],
    limit: 0
  });

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  }>({ visible: false, text: '', x: 0, y: 0 });

  // Tooltip functions
  const showTooltip = (text: string, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      x: rect.left,
      y: rect.top - 35,
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
    return userDetails?.full_name || assignment.allocated_to;
  };

  // Calculate phase progress based on task progress
  const calculatedPhaseProgress = React.useMemo(() => {
    if (!phaseTasks || phaseTasks.length === 0) return 0;
    
    const totalProgress = phaseTasks.reduce((sum: number, task: any) => {
      return sum + (task.progress || 0);
    }, 0);
    
    return Math.round(totalProgress / phaseTasks.length);
  }, [phaseTasks]);

  // Auto-update phase progress when tasks change
  useEffect(() => {
    if (phaseTasks.length > 0 && calculatedPhaseProgress !== (activePhase.progress || 0)) {
      handleRecalculateProgress();
    }
  }, [calculatedPhaseProgress, phaseTasks.length]);

  // Function to manually recalculate progress
  const handleRecalculateProgress = async () => {
    setIsCalculatingProgress(true);
    try {
      await calculateAndUpdatePhaseProgress(phase.name);
      // Refresh phase data
      await mutatePhase();
      if (onPhaseUpdated) {
        onPhaseUpdated();
      }
    } catch (error) {
      console.error('Error recalculating phase progress:', error);
    } finally {
      setIsCalculatingProgress(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'Working':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Open':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Working':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditSuccess = async () => {
    setIsRefreshingAfterEdit(true);
    
    try {
      // Refresh the phase data locally
      await mutatePhase();
      
      // Also refresh tasks data in case any task-related changes
      await mutateTasks();
      
      // Call parent callback to refresh parent component data
      if (onPhaseUpdated) {
        await onPhaseUpdated();
      }
      
      // Recalculate phase progress after a short delay to ensure data is updated
      setTimeout(async () => {
        setIsCalculatingProgress(true);
        try {
          await calculateAndUpdatePhaseProgress(activePhase.name);
          
          // Refresh again to get the updated progress
          setTimeout(async () => {
            await mutatePhase();
          }, 500);
          
        } catch (error) {
          console.error('Error recalculating phase progress:', error);
        } finally {
          setIsCalculatingProgress(false);
        }
      }, 500);
    } finally {
      setIsRefreshingAfterEdit(false);
    }
  };

  const handleDeleteSuccess = () => {
    if (onPhaseDeleted) {
      onPhaseDeleted();
    }
    onBack(); // Navigate back after deletion
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
        
        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditPhaseOpen(true)}
            disabled={isRefreshingAfterEdit || isCalculatingProgress}
            className="flex items-center gap-2"
          >
            <Edit className={`h-4 w-4 ${isRefreshingAfterEdit ? 'animate-pulse' : ''}`} />
            {isRefreshingAfterEdit ? 'Updating...' : 'Edit Phase'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeletePhaseOpen(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Phase
          </Button>
        </div>
      </div>

      {/* Phase Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activePhase.subject}</h1>
                <p className="text-sm text-gray-600">Phase Details</p>
              </div>
            </div>
            
            {activePhase.details && (
              <p className="text-gray-700 leading-relaxed">{activePhase.details}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(activePhase.status || 'Open')}`}>
              {getStatusIcon(activePhase.status || 'Open')}
              <span className="font-medium">{activePhase.status || 'Open'}</span>
            </div>
            {activePhase.priority && (
              <div className={`px-3 py-1 rounded-full border ${getPriorityColor(activePhase.priority)}`}>
                <span className="text-sm font-medium">{activePhase.priority}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Phase Progress</span>
              {phaseTasks.length > 0 && (
                <span className="text-xs text-gray-500">
                  (Auto-calculated from {phaseTasks.length} tasks)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">
                {calculatedPhaseProgress}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRecalculateProgress}
                disabled={isCalculatingProgress}
                className="h-8 w-8 p-0"
                title="Recalculate progress from tasks"
              >
                <RefreshCw className={`h-4 w-4 ${isCalculatingProgress ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${calculatedPhaseProgress}%` }}
            ></div>
          </div>
          {phaseTasks.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Task progress: {phaseTasks.map(task => `${task.subject}: ${task.progress || 0}%`).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Start Date</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(activePhase.start_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">End Date</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(activePhase.end_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Estimated Cost</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(activePhase.costing)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Phase Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Phase ID</span>
              <span className="text-gray-900 font-semibold">{activePhase.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Project</span>
              <span className="text-gray-900 font-semibold">{projectName}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Status</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(activePhase.status || 'Open')}`}>
                {getStatusIcon(activePhase.status || 'Open')}
                <span className="font-medium">{activePhase.status || 'Open'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Priority</span>
              <div className={`px-3 py-1 rounded-full ${getPriorityColor(activePhase.priority || 'Medium')}`}>
                <span className="font-medium">{activePhase.priority || 'Medium'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Tasks Count</span>
              <span className="text-gray-900 font-semibold">{activePhase.tasks?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Duration</span>
              <span className="text-gray-900 font-semibold">
                {activePhase.start_date && activePhase.end_date
                  ? `${Math.ceil(
                      (new Date(activePhase.end_date).getTime() - new Date(activePhase.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-600">{calculatedPhaseProgress}%</span>
                {phaseTasks.length > 0 && (
                  <span className="text-xs text-gray-500">
                    (from {phaseTasks.length} tasks)
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Estimated Cost</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(phase.costing)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks in this Phase */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Tasks in this Phase</h3>
        </div>

        {tasksLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-3">
                <div className="col-span-1 text-sm font-medium text-gray-700">#</div>
                <div className="col-span-3 text-sm font-medium text-gray-700">Task</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Progress</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Assign to</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Status</div>
                <div className="col-span-1 text-sm font-medium text-gray-700 text-center">Priority</div>
                <div className="col-span-1 text-sm font-medium text-gray-700 text-center">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {phaseTasks && phaseTasks.length > 0 ? (
                phaseTasks.map((task: any, index: number) => (
                  <div key={task.name} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-gray-600">{index + 1}</span>
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="p-1 bg-orange-100 rounded">
                        <span className="text-sm">📝</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{task.subject || task.name}</div>
                        <div className="text-sm text-gray-500">{task.name}</div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-[30px]">
                          {task.progress || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      {(() => {
                        const assignedUser = getTaskAssignment(task.name);
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
                      })()}
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status || 'Open')}`}>
                        {task.status || 'Open'}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {task.priority && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {onViewTaskDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTaskDetails(task)}
                          className="h-7 px-2 text-xs"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-lg font-medium mb-1">No tasks yet</div>
                  <div className="text-sm">Click "Add Task" to create the first task for this phase</div>
                </div>
              )}

              {/* Add Task Row */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="col-span-12 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    onClick={() => setIsCreateTaskModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add new task to this phase
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phase Files Section */}
      <FileAttachments
        doctype="project_phase"
        docname={phase.name}
        title="Phase Files"
        allowUpload={true}
        allowDelete={true}
        className="mt-8"
      />

      {/* Create Task Modal */}
      <CreateTask
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectName={projectName}
        phaseId={phase.name}
        onSuccess={async () => {
          
          // Refresh the phase data first to get updated tasks
          await mutatePhase();
          
          // Also refresh the parent data if callback exists
          if (onTaskCreated) {
            await onTaskCreated();
          }
          
          // Then refresh tasks data after phase is updated
          setTimeout(async () => {
            await mutateTasks();
            
            // Recalculate phase progress after tasks are refreshed
            setTimeout(async () => {
              await handleRecalculateProgress();
            }, 500);
          }, 500);
        }}
      />

      {/* Edit Phase Dialog */}
      <EditPhase
        phase={phase}
        projectName={projectName}
        isOpen={isEditPhaseOpen}
        onClose={() => setIsEditPhaseOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Phase Dialog */}
      <DeletePhase
        phase={phase}
        isOpen={isDeletePhaseOpen}
        onClose={() => setIsDeletePhaseOpen(false)}
        onSuccess={handleDeleteSuccess}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="fixed z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl pointer-events-none border border-gray-700"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y,
            transform: 'translateY(-100%)',
            maxWidth: '400px',
            minWidth: '200px',
            wordWrap: 'break-word'
          }}
        >
          <div className="font-medium leading-relaxed">{tooltip.text}</div>
          <div 
            className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            style={{ left: '20px' }}
          ></div>
        </div>
      )}
    </div>
  );
};
