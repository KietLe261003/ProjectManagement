import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useUpdateTask } from '@/services/taskService';
import { useUpdateSubTask } from '@/services/subTaskService';
import { useManualProgressUpdate, useTaskStatusProgressUpdate } from '@/services/taskProgressService';
import { useTaskProgressCalculation } from '@/services/taskProgressService';
import { toast } from '@/utils/toastUtils';
import type { TaskItem } from '@/types';
import { Calendar, User, BarChart3, Flag } from 'lucide-react';

interface TaskEditModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSuccess,
}) => {
  const { updateTask, isLoading: updateTaskLoading } = useUpdateTask();
  const { updateSubTask, isLoading: updateSubTaskLoading } = useUpdateSubTask();
  const { updateTaskProgress } = useManualProgressUpdate();
  const { updateTaskProgressByStatus } = useTaskStatusProgressUpdate();
  const { calculateAndUpdateTaskProgress } = useTaskProgressCalculation();

  const [formData, setFormData] = useState({
    subject: '',
    status: 'Open',
    priority: 'Medium',
    progress: 0,
    start_date: '',
    end_date: '',
    description: ''
  });

  const isLoading = updateTaskLoading || updateSubTaskLoading;

  // Status options based on role
  const getStatusOptions = () => {
    const baseStatuses = ['Open', 'Working', 'Pending Review', 'Completed', 'Cancelled'];
    return baseStatuses;
  };

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        subject: task.title || '',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        progress: task.taskProgress || 0,
        start_date: task.startDate || '',
        end_date: task.endDate || '',
        description: task.description || ''
      });
    }
  }, [task]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) return;

    try {
      if (task.type === 'Task') {
        // Update Task
        await updateTask(task.referenceName, {
          subject: formData.subject,
          status: formData.status,
          priority: formData.priority,
          exp_start_date: formData.start_date || undefined,
          exp_end_date: formData.end_date || undefined,
          description: formData.description,
          progress: formData.progress
        });

        // Update progress if changed
        if (formData.progress !== (task.taskProgress || 0)) {
          await updateTaskProgress(task.referenceName, formData.progress);
        }

        // Update progress based on status
        await updateTaskProgressByStatus(task.referenceName, formData.status);
        
        toast.success('Task updated successfully');
      } else if (task.type === 'SubTask') {
        // Update SubTask
        await updateSubTask(task.referenceName, {
          subject: formData.subject,
          status: formData.status,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          description: formData.description
        });

        // Calculate and update parent task progress
        if (task.parentTask) {
          await calculateAndUpdateTaskProgress(task.parentTask);
        }
        
        toast.success('SubTask updated successfully');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setFormData({
      subject: '',
      status: 'Open',
      priority: 'Medium',
      progress: 0,
      start_date: '',
      end_date: '',
      description: ''
    });
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.type === 'Task' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {task.type}
              </span>
              <span>Edit {task.type}</span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Info */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter task subject"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter task description"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getStatusOptions().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {task.type === 'Task' && (
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

          {/* Progress for Tasks only */}
          {task.type === 'Task' && (
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                />
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Task Meta Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Assignee:</span>
                <span className="font-medium">{task.assignee}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">{task.project}</span>
              </div>

              {task.type === 'SubTask' && task.parentTask && (
                <div className="flex items-center space-x-2 md:col-span-2">
                  <Flag className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Parent Task:</span>
                  <span className="font-medium">{task.parentTask}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditModal;
