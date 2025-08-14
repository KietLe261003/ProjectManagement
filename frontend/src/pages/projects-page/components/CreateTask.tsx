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
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    type: 'Task',
    expected_time: 0,
    task_weight: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createDoc, loading } = useFrappeCreateDoc();

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
    
    if (!validateForm()) {
      return;
    }

    try {
      const taskData: any = {
        ...formData,
        project: projectName,
        expected_time: Number(formData.expected_time),
        task_weight: Number(formData.task_weight)
      };

      await createDoc('Task', taskData);

      // Reset form
      setFormData({
        subject: '',
        description: '',
        priority: 'Medium',
        status: 'Open',
        type: 'Task',
        expected_time: 0,
        task_weight: 1
      });
      setErrors({});
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
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
      task_weight: 1
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
                  <option value="Completed">Completed</option>
                </select>
              </div>
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
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
