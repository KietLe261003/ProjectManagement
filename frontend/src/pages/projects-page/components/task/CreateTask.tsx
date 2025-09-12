import React, { useState } from 'react';
import { useCreatePhaseTask } from '@/services/phaseTaskService';
import { useProjectUsers } from '@/services/projectUsersService';
import { useFrappeGetDoc } from 'frappe-react-sdk';
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
import { toast } from '@/utils/toastUtils';

interface CreateTaskProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  phaseId?: string;
  onSuccess?: () => void;
}

export const CreateTask: React.FC<CreateTaskProps> = ({
  isOpen,
  onClose,
  projectName,
  phaseId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    type: 'Task',
    expected_time: 0,
    task_weight: 1,
    exp_start_date: '',
    exp_end_date: '',
    assign_to: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTaskWithPhase, isLoading } = useCreatePhaseTask();
  
  // Fetch project users for assignment dropdown
  const { data: projectUsers, isLoading: usersLoading } = useProjectUsers(projectName);
  
  // Fetch project data to validate dates
  const { data: projectData } = useFrappeGetDoc('Project', projectName);

  const handleInputChange = (field: string, value: string | number) => {
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
      newErrors.subject = 'Task subject is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

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

    setIsSubmitting(true);

    try {
      const taskData: any = {
        ...formData,
        project: projectName,
        expected_time: Number(formData.expected_time),
        task_weight: Number(formData.task_weight),
        // Only include date fields if they have values
        exp_start_date: formData.exp_start_date || undefined,
        exp_end_date: formData.exp_end_date || undefined,
        phaseId: phaseId, // Add phaseId to the data object
        assign_to: formData.assign_to || undefined // Only include if not empty
      };

      console.log('Creating task with data:', taskData);
      console.log('Date fields:', {
        exp_start_date: formData.exp_start_date,
        exp_end_date: formData.exp_end_date
      });

      // Use the service to create task with optional phase
      const result = await createTaskWithPhase(taskData);
      console.log('Task with phase created:', result);

      // Show success message with assignment info
      let successMessage = `Task "${formData.subject}" has been created successfully.`;
      if (result.todo && formData.assign_to) {
        console.log('Task assigned and ToDo created for:', formData.assign_to);
        successMessage += ` Task has been assigned to ${formData.assign_to}.`;
      }
      
      toast.success("Task created successfully", {
        description: successMessage,
      });

      // Reset form
      setFormData({
        subject: '',
        description: '',
        priority: 'Medium',
        status: 'Open',
        type: 'Task',
        expected_time: 0,
        task_weight: 1,
        exp_start_date: '',
        exp_end_date: '',
        assign_to: ''
      });
      setErrors({});
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Error creating task:', error);
      
      let errorMessage = 'Failed to create task. Please try again.';
      
      // Handle specific validation errors from server
      if (error?.message) {
        if (error.message.includes('Expected End Date cannot be after Project')) {
          errorMessage = 'Task end date cannot be after the project end date. Please choose an earlier date.';
        } else if (error.message.includes('InvalidDates')) {
          errorMessage = 'Invalid date configuration. Please check your task dates.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Check if it's a server exception response
      if (error?.exception && typeof error.exception === 'string') {
        if (error.exception.includes('Expected End Date cannot be after Project')) {
          errorMessage = 'Task end date cannot be after the project end date. Please choose an earlier date.';
        }
      }
      
      toast.error("Failed to create task", {
        description: errorMessage,
      });
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      subject: '',
      description: '',
      priority: 'Medium',
      status: 'Open',
      type: 'Task',
      expected_time: 0,
      task_weight: 1,
      exp_start_date: '',
      exp_end_date: '',
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
            <span className="text-2xl">📝</span>
            Create New Task
          </DialogTitle>
          <DialogDescription>
            Create a new task for project: <strong>{projectName}</strong>
            {phaseId && (
              <>
                <br />
                <span className="text-blue-600">🔗 This task will be linked to the current phase</span>
              </>
            )}
            <br />
            <span className="text-gray-600">💡 Assigning to a user will automatically create a ToDo item for them</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className='flex flex-col gap-4'>
              <Label htmlFor="subject">Task Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter task subject..."
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-red-600 mt-1">{errors.subject}</p>
              )}
            </div>

            <div className='flex flex-col gap-4'>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
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
                  <option value="Urgent">Urgent</option>
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
                  <option value="Overdue">Overdue</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Assign To Field */}
            <div className='flex flex-col gap-4'>
              <Label htmlFor="assign_to">Assign To</Label>
              <select
                id="assign_to"
                value={formData.assign_to}
                onChange={(e) => handleInputChange('assign_to', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className='flex flex-col gap-4'>
                <Label htmlFor="expected_time">Expected Time (hours)</Label>
                <Input
                  id="expected_time"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.expected_time}
                  onChange={(e) => handleInputChange('expected_time', Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className='flex flex-col gap-4'>
                <Label htmlFor="task_weight">Task Weight</Label>
                <Input
                  id="task_weight"
                  type="number"
                  min="1"
                  value={formData.task_weight}
                  onChange={(e) => handleInputChange('task_weight', Number(e.target.value))}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Date Fields */}
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
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isLoading || isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
