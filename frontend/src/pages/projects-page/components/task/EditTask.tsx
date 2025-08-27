import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappeGetDocList, useFrappeGetDoc } from 'frappe-react-sdk';
import { useProjectUsers } from '@/services/projectUsersService';
import { useUpdateTask, useTaskAssignment } from '@/services/taskService';
import { useManualProgressUpdate, useTaskStatusProgressUpdate } from '@/services/taskProgressService';
import { toast } from '@/utils/toastUtils';

interface EditTaskProps {
  task: any;
  projectName: string; // Added projectName
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditTask: React.FC<EditTaskProps> = ({ task, projectName, isOpen, onClose, onSuccess }) => {
  const { updateTask, isLoading: updateLoading, error: updateError } = useUpdateTask();
  const { assignTask, unassignTask } = useTaskAssignment();
  const { updateTaskProgress } = useManualProgressUpdate();
  const { updateTaskProgressByStatus } = useTaskStatusProgressUpdate();
  
  // Fetch project users for assignment dropdown
  const { data: projectUsers, isLoading: usersLoading } = useProjectUsers(projectName);
  
  // Fetch project data to validate dates
  const { data: projectData } = useFrappeGetDoc('Project', projectName);
  
  // Fetch current ToDo assignments for this task
  const { data: existingToDos } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'allocated_to'],
    filters: [['reference_type', '=', 'Task'], ['reference_name', '=', task?.name || '']],
  });
  
  // Fetch subtasks to check if task has subtasks
  const { data: subtasks } = useFrappeGetDocList('SubTask', {
    fields: ['name'],
    filters: [['task', '=', task?.name || '']],
    limit: 1
  });
  
  const [formData, setFormData] = useState({
    subject: '',
    status: 'Open',
    priority: 'Medium',
    exp_start_date: '',
    exp_end_date: '',
    progress: 0,
    description: '',
    assign_to: '', // Added assign_to field
  });

  // State để track task có subtasks hay không
  const [hasSubtasks, setHasSubtasks] = useState(false);

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      // Find current assignment from existing ToDos
      const currentAssignment = existingToDos?.[0]?.allocated_to || '';
      
      setFormData({
        subject: task.subject || '',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        exp_start_date: task.exp_start_date ? task.exp_start_date.split(' ')[0] : '',
        exp_end_date: task.exp_end_date ? task.exp_end_date.split(' ')[0] : '',
        progress: task.progress || 0,
        description: task.description || '',
        assign_to: currentAssignment,
      });
    }
  }, [task, existingToDos]);

  // Check if task has subtasks when subtasks data changes
  useEffect(() => {
    setHasSubtasks(!!(subtasks && subtasks.length > 0));
  }, [subtasks]);

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
    if (formData.exp_start_date && formData.exp_end_date) {
      const startDate = new Date(formData.exp_start_date);
      const endDate = new Date(formData.exp_end_date);
      
      if (endDate < startDate) {
        toast.error('End date cannot be earlier than start date');
        return;
      }
    }

    // Validate against project end date
    if (formData.exp_end_date && projectData?.expected_end_date) {
      const taskEndDate = new Date(formData.exp_end_date);
      const projectEndDate = new Date(projectData.expected_end_date);
      
      if (taskEndDate > projectEndDate) {
        toast.error(`Task end date cannot be after project end date (${projectData.expected_end_date})`);
        return;
      }
    }

    try {
      // Determine what type of progress update to use
      const isProgressManuallyChanged = formData.progress !== (task.progress || 0);
      const isStatusChanged = formData.status !== task.status;
      
      // Case 1: Task has subtasks and user manually changes progress
      if (hasSubtasks && isProgressManuallyChanged) {
        // Validate progress update (only assignee can manually change progress)
        await updateTaskProgress(task.name, formData.progress);
      }
      
      // Case 2: Task status changed by Project Leader/Manager 
      else if (isStatusChanged && (formData.status === 'Completed' || formData.status === 'Cancelled')) {
        // Update progress based on status
        await updateTaskProgressByStatus(task.name, formData.status);
      }
      
      // Case 3: Normal task update (no special progress logic needed)
      else {
        // Update the task using TaskService
        await updateTask(task.name, formData);
      }

      // Handle assignment changes
      const currentAssignment = existingToDos?.[0]?.allocated_to || '';
      const newAssignment = formData.assign_to;

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
            await assignTask(task.name, formData.subject, newAssignment, formData.priority);
          } catch (createError) {
            console.error('Error creating new ToDo:', createError);
          }
        }
      }
      
      // Show success message
      toast.success("Task updated successfully", {
        description: `Task "${formData.subject}" has been updated.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Error updating task:', err);
      
      // Show user-friendly error message
      let errorMessage = "Failed to update task";
      if (err?.message?.includes('modified')) {
        errorMessage = 'The task has been modified by someone else. Please close and reopen the task to get the latest version.';
      } else if (err?.message?.includes('permission')) {
        errorMessage = 'You do not have permission to update this task.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error("Failed to update task", {
        description: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    if (task) {
      const currentAssignment = existingToDos?.[0]?.allocated_to || '';
      
      setFormData({
        subject: task.subject || '',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        exp_start_date: task.exp_start_date ? task.exp_start_date.split(' ')[0] : '',
        exp_end_date: task.exp_end_date ? task.exp_end_date.split(' ')[0] : '',
        progress: task.progress || 0,
        description: task.description || '',
        assign_to: currentAssignment,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
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
              placeholder="Enter task subject"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
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
                <option value="Overdue">Overdue</option>
                <option value="Template">Template</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

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
          </div>

          {/* Assign To */}
          <div className="space-y-2">
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
            {!usersLoading && projectUsers && projectUsers.length > 10 && (
              <p className="text-sm text-amber-600">
                ⚠️ Showing all system users (project users not available)
              </p>
            )}
            {existingToDos && existingToDos.length > 0 && (
              <p className="text-sm text-blue-600">
                💡 Changing assignment will update the ToDo automatically
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp_start_date">Expected Start Date</Label>
              <Input
                id="exp_start_date"
                type="date"
                value={formData.exp_start_date}
                onChange={(e) => handleInputChange('exp_start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp_end_date">Expected End Date</Label>
              <Input
                id="exp_end_date"
                type="date"
                value={formData.exp_end_date}
                onChange={(e) => handleInputChange('exp_end_date', e.target.value)}
                max={projectData?.expected_end_date || undefined}
              />
              {projectData?.expected_end_date && (
                <p className="text-xs text-muted-foreground">
                  Must be before project end date: {projectData.expected_end_date}
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error Display */}
          {updateError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {updateError.message || 'Failed to update task'}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateLoading}>
              {updateLoading 
                ? 'Updating...' 
                : 'Update Task'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTask;
