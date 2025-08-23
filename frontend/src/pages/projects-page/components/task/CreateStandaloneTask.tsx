import React, { useState } from 'react';
import { useFrappeCreateDoc } from 'frappe-react-sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface CreateStandaloneTaskProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onSuccess?: () => void;
}

export const CreateStandaloneTask: React.FC<CreateStandaloneTaskProps> = ({
  isOpen,
  onClose,
  projectName,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
    exp_start_date: '',
    exp_end_date: '',
    status: 'Open'
  });

  const { createDoc, loading, error } = useFrappeCreateDoc();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      return;
    }

    try {
      await createDoc('Task', {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        exp_start_date: formData.exp_start_date || null,
        exp_end_date: formData.exp_end_date || null,
        status: formData.status,
        project: projectName,
        is_template: 0,
        progress: 0
      });

      // Reset form
      setFormData({
        subject: '',
        description: '',
        priority: 'Medium',
        exp_start_date: '',
        exp_end_date: '',
        status: 'Open'
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating standalone task:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create Standalone Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Task Subject *</Label>
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('priority', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('status', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>

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
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Error creating task: {error.message}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.subject.trim()}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
