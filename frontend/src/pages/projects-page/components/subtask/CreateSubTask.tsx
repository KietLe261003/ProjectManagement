import React, { useState } from 'react';
import { useFrappeCreateDoc } from 'frappe-react-sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProjectUsers } from '@/services/projectUsersService';
import { useSubTaskAssignment } from '@/services/subTaskService';
import { useTaskProgressCalculation } from '@/services/taskProgressService';

interface CreateSubTaskProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  parentTask?: string;
  onSuccess?: () => void;
}

export const CreateSubTask: React.FC<CreateSubTaskProps> = ({
  isOpen,
  onClose,
  projectName,
  parentTask,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    task: parentTask || '',
    assign_to: '' // Added assign_to field
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createDoc, loading } = useFrappeCreateDoc();
  const { assignSubTask } = useSubTaskAssignment();
  const { calculateAndUpdateTaskProgress } = useTaskProgressCalculation();
  
  // Fetch project users for assignment dropdown
  const { data: projectUsers, isLoading: usersLoading } = useProjectUsers(projectName);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'SubTask subject is required';
    }

    if (!formData.task.trim()) {
      newErrors.task = 'Parent task is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare subtask data (exclude assign_to as it's not a SubTask field)
      const { assign_to, ...subTaskData } = formData;
      
      const newSubTask = await createDoc('SubTask', {
        ...subTaskData,
        project: projectName
      });

      // If assign_to is specified, create assignment
      if (assign_to && newSubTask) {
        await assignSubTask(newSubTask.name, assign_to);
      }

      // Cập nhật progress của parent task sau khi tạo subtask mới
      if (parentTask) {
        try {
          await calculateAndUpdateTaskProgress(parentTask);
        } catch (error) {
          console.error('Error updating task progress after subtask creation:', error);
        }
      }

      // Reset form
      setFormData({
        subject: '',
        description: '',
        priority: 'Medium',
        status: 'Open',
        task: parentTask || '',
        assign_to: ''
      });
      setErrors({});
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error creating subtask:', error);
      setErrors({ submit: 'Failed to create subtask. Please try again.' });
    }
  };

  const handleClose = () => {
    setFormData({
      subject: '',
      description: '',
      priority: 'Medium',
      status: 'Open',
      task: parentTask || '',
      assign_to: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📌</span>
            Create New SubTask
          </DialogTitle>
          <DialogDescription>
            Create a new subtask for project: <strong>{projectName}</strong>
            {parentTask && (
              <span className="block mt-1">
                Parent Task: <strong>{parentTask}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className='flex flex-col gap-4'>
              <Label htmlFor="subject">SubTask Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter subtask subject..."
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-red-600 mt-1">{errors.subject}</p>
              )}
            </div>

            <div className='flex flex-col gap-4'>
              <Label htmlFor="task">Parent Task *</Label>
              <Input
                id="task"
                value={formData.task}
                onChange={(e) => handleInputChange('task', e.target.value)}
                placeholder="Enter parent task ID..."
                className={errors.task ? 'border-red-500' : ''}
              />
              {errors.task && (
                <p className="text-sm text-red-600 mt-1">{errors.task}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Enter the Task ID that this subtask belongs to
              </p>
            </div>

            <div className='flex flex-col gap-4'>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter subtask description..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Assignment */}
            <div className="space-y-2">
              <Label htmlFor="assign_to">Assign To</Label>
              <select
                id="assign_to"
                value={formData.assign_to}
                onChange={(e) => handleInputChange('assign_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={usersLoading}
              >
                <option value="">Select user...</option>
                {projectUsers?.map((projectUser) => (
                  <option 
                    key={projectUser.name} 
                    value={projectUser.user || projectUser.name}
                  >
                    {projectUser.user || projectUser.name}
                  </option>
                ))}
              </select>
              {usersLoading && <span className="text-sm text-gray-500">Loading users...</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className='flex flex-col gap-4'>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className='flex flex-col gap-4'>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Open">Open</option>
                  <option value="Working">Working</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {errors.submit}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create SubTask'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
