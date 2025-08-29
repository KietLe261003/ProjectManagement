import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappeGetDocList, useFrappeGetDoc } from 'frappe-react-sdk';
import { useUpdateTask, useTaskAssignment } from '@/services/taskService';
import { useUpdateSubTask, useSubTaskAssignment } from '@/services/subTaskService';
import { useManualProgressUpdate, useTaskStatusProgressUpdate } from '@/services/taskProgressService';
import { toast } from '@/utils/toastUtils';
import type { TaskItem } from '@/types';

interface EditTaskModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isLeader: boolean;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSuccess, isLeader }) => {
  const isSubTask = task?.type === 'SubTask';
  
  // Task services
  const { updateTask, isLoading: updateTaskLoading, error: updateTaskError } = useUpdateTask();
  const { assignTask, unassignTask } = useTaskAssignment();
  const { updateTaskProgress } = useManualProgressUpdate();
  const { updateTaskProgressByStatus } = useTaskStatusProgressUpdate();
  
  // SubTask services
  const { updateSubTask, isLoading: updateSubTaskLoading, error: updateSubTaskError } = useUpdateSubTask();
  const { assignSubTask, unassignSubTask } = useSubTaskAssignment();
  
  // Combined loading and error states
  const isLoading = updateTaskLoading || updateSubTaskLoading;
  const updateError = updateTaskError || updateSubTaskError;
  
  
  // Fetch project data to validate dates (only for tasks)
  const { data: projectData } = useFrappeGetDoc('Project', task?.project || '', {
    enabled: !!task?.project && !isSubTask
  });
  
  // Fetch current ToDo assignments
  const { data: existingToDos } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'allocated_to'],
    filters: [
      ['reference_type', '=', isSubTask ? 'SubTask' : 'Task'], 
      ['reference_name', '=', task?.referenceName || '']
    ]
  });
  
  // Fetch subtasks to check if task has subtasks (only for tasks)
  const { data: subtasks } = useFrappeGetDocList('SubTask', {
    fields: ['name'],
    filters: [['task', '=', task?.referenceName || '']],
    limit: 1
  });
  
  const [formData, setFormData] = useState({
    subject: '',
    status: 'Open',
    priority: 'Medium',
    start_date: '',
    end_date: '',
    progress: 0,
    description: '',
    assign_to: '',
  });

  // State để track task có subtasks hay không
  const [hasSubtasks, setHasSubtasks] = useState(false);

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      // Find current assignment from existing ToDos
      const currentAssignment = existingToDos?.[0]?.allocated_to || '';
      
      setFormData({
        subject: task.title || '',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        start_date: task.startDate ? task.startDate.split(' ')[0] : '',
        end_date: task.endDate ? task.endDate.split(' ')[0] : '',
        progress: task.taskProgress || 0,
        description: task.description || '',
        assign_to: currentAssignment,
      });
    }
  }, [task, existingToDos]);

  // Check if task has subtasks when subtasks data changes (only for tasks)
  useEffect(() => {
    if (!isSubTask) {
      setHasSubtasks(!!(subtasks && subtasks.length > 0));
    }
  }, [subtasks, isSubTask]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    // Validate date fields
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate < startDate) {
        toast.error('End date cannot be earlier than start date');
        return;
      }
    }
    // Validate against project end date (only for tasks)
    if (!isSubTask && formData.end_date && projectData?.expected_end_date) {
      const taskEndDate = new Date(formData.end_date);
      const projectEndDate = new Date(projectData.expected_end_date);
      
      if (taskEndDate > projectEndDate) {
        toast.error(`Task end date cannot be after project end date (${projectData.expected_end_date})`);
        return;
      }
    }
    try {
      // Handle assignment changes
      const currentAssignment = existingToDos?.[0]?.allocated_to || '';
      const newAssignment = formData.assign_to;

      if (isSubTask) {
        // SubTask handling
        const { assign_to, ...subTaskData } = formData;
        
        // Map form fields to SubTask fields
        const subTaskUpdateData = {
          subject: subTaskData.subject,
          status: subTaskData.status,
          start_date: subTaskData.start_date,
          end_date: subTaskData.end_date,
          description: subTaskData.description,
        };
        
        // Update subtask
        await updateSubTask(task.referenceName, subTaskUpdateData);
        
        // Handle assignment changes
        if (currentAssignment && currentAssignment !== newAssignment) {
          // Remove old assignment
          const oldToDo = existingToDos?.find(todo => todo.allocated_to === currentAssignment);
          if (oldToDo) {
            await unassignSubTask(oldToDo.name);
          }
        }
        
        if (newAssignment && newAssignment !== currentAssignment) {
          // Create new assignment
          await assignSubTask(task.referenceName, newAssignment);
        }
        
        // Update parent task progress if subtask status changed
        if (subTaskUpdateData.status !== task.status) {
          // Need to get the parent task from SubTask data
          // This might require additional API call to get parent task
          // For now, we'll skip this as it requires more complex logic
        }
        
        toast.success("SubTask updated successfully", {
          description: `SubTask "${formData.subject}" has been updated.`,
        });
        
      } else {
        // Task handling
        const isProgressManuallyChanged = formData.progress !== (task.taskProgress || 0);
        const isStatusChanged = formData.status !== task.status;
        
        // Map form fields to Task fields
        const taskUpdateData = {
          subject: formData.subject,
          status: formData.status,
          priority: formData.priority,
          exp_start_date: formData.start_date,
          exp_end_date: formData.end_date,
          progress: formData.progress,
          description: formData.description,
        };
        
        // Determine what type of progress update to use
        if (hasSubtasks && isProgressManuallyChanged) {
          // Validate progress update (only assignee can manually change progress)
          await updateTaskProgress(task.referenceName, formData.progress);
        } else if (isStatusChanged && (formData.status === 'Completed' || formData.status === 'Cancelled')) {
          // Update progress based on status
          await updateTaskProgressByStatus(task.referenceName, formData.status);
        } else {
          // Update the task using TaskService
          await updateTask(task.referenceName, taskUpdateData);
        }

        // Handle assignment changes
        if (currentAssignment !== newAssignment) {
          // Remove old assignment if exists
          if (currentAssignment && existingToDos?.[0]) {
            try {
              await unassignTask(existingToDos[0].name);
            } catch (deleteError) {
              console.error('Error deleting old ToDo:', deleteError);
            }
          }

          // Create new assignment if provided
          if (newAssignment) {
            try {
              await assignTask(task.referenceName, formData.subject, newAssignment, formData.priority);
            } catch (createError) {
              console.error('Error creating new ToDo:', createError);
            }
          }
        }
        
        toast.success("Task updated successfully", {
          description: `Task "${formData.subject}" has been updated.`,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Error updating task/subtask:', err);
      
      // Show user-friendly error message
      let errorMessage = `Failed to update ${isSubTask ? 'subtask' : 'task'}`;
      if (err?.message?.includes('modified')) {
        errorMessage = `The ${isSubTask ? 'subtask' : 'task'} has been modified by someone else. Please close and reopen to get the latest version.`;
      } else if (err?.message?.includes('permission')) {
        errorMessage = `You do not have permission to update this ${isSubTask ? 'subtask' : 'task'}.`;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(`Failed to update ${isSubTask ? 'subtask' : 'task'}`, {
        description: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    if (task) {
      const currentAssignment = existingToDos?.[0]?.allocated_to || '';
      
      setFormData({
        subject: task.title || '',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        start_date: task.startDate ? task.startDate.split(' ')[0] : '',
        end_date: task.endDate ? task.endDate.split(' ')[0] : '',
        progress: task.taskProgress || 0,
        description: task.description || '',
        assign_to: currentAssignment,
      });
    }
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {isSubTask ? 'SubTask' : 'Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              required
              placeholder={`Enter ${isSubTask ? 'subtask' : 'task'} subject`}
            />
          </div>

          {/* Status and Priority */}
          <div className={`grid ${isSubTask ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Open">Open</option>
                <option value="Working">Working</option>
                <option value="Pending Review">Pending Review</option>
                {!isSubTask && <option value="Overdue">Overdue</option>}
                {isLeader && <option value="Completed">Completed</option> }
                {isLeader && <option value="Cancelled">Cancelled</option>}
              </select>
            </div>

            {!isSubTask && (
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            )}
          </div>

          {/* Assign To */}
          {/* <div className="space-y-2">
            <Label htmlFor="assign_to">Assign To</Label>
            <select
              id="assign_to"
              value={formData.assign_to}
              onChange={(e) => handleInputChange('assign_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={usersLoading}
            >
              <option value="">Select user to assign (Optional)</option>
              {projectUsers?.map((projectUser: any) => (
                <option key={projectUser.user || projectUser.name} value={projectUser.user || projectUser.name}>
                  {projectUser.full_name || projectUser.name}
                  {projectUser.email && ` (${projectUser.email})`}
                </option>
              ))}
            </select>
            {usersLoading && (
              <p className="text-sm text-gray-500">Loading users...</p>
            )}
          </div> */}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{isSubTask ? 'Start Date' : 'Expected Start Date'}</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">{isSubTask ? 'End Date' : 'Expected End Date'}</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                max={!isSubTask && projectData?.expected_end_date ? projectData.expected_end_date : undefined}
              />
              {!isSubTask && projectData?.expected_end_date && (
                <p className="text-xs text-muted-foreground">
                  Must be before project end date: {projectData.expected_end_date}
                </p>
              )}
            </div>
          </div>

          {/* Progress (only for Tasks) */}
          {!isSubTask && (
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                placeholder="0"
                disabled={hasSubtasks}
              />
              {/* Progress Mode Information */}
              {hasSubtasks ? (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  <strong>🔄 Smart Progress Mode:</strong>
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li>Progress is automatically calculated from subtasks</li>
                    <li>Only assignee can manually override progress</li>
                    <li>Project leaders can set progress via status changes</li>
                  </ul>
                </div>
              ) : (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  <strong>✏️ Manual Progress Mode:</strong>
                  <span className="text-xs"> Progress can be updated manually by anyone with edit permission</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={`Enter ${isSubTask ? 'subtask' : 'task'} description`}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Project Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Project:</strong> {task.project}
            </p>
          </div>

          {/* Error Display */}
          {updateError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {updateError.message || `Failed to update ${isSubTask ? 'subtask' : 'task'}`}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? 'Updating...' 
                : `Update ${isSubTask ? 'SubTask' : 'Task'}`
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
