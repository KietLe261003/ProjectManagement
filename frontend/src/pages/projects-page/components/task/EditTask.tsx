import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappePostCall } from 'frappe-react-sdk';

interface EditTaskProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditTask: React.FC<EditTaskProps> = ({ task, isOpen, onClose, onSuccess }) => {
  const { call: updateTask, loading, error } = useFrappePostCall('frappe.client.save');
  
  const [formData, setFormData] = useState({
    subject: '',
    status: 'Open',
    priority: 'Medium',
    exp_start_date: '',
    exp_end_date: '',
    progress: 0,
    description: '',
  });

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        subject: task.subject || '',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        exp_start_date: task.exp_start_date ? task.exp_start_date.split(' ')[0] : '',
        exp_end_date: task.exp_end_date ? task.exp_end_date.split(' ')[0] : '',
        progress: task.progress || 0,
        description: task.description || '',
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
      await updateTask({
        doc: {
          doctype: 'Task',
          name: task.name,
          ...formData
        }
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleCancel = () => {
    if (task) {
      setFormData({
        subject: task.subject || '',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        exp_start_date: task.exp_start_date ? task.exp_start_date.split(' ')[0] : '',
        exp_end_date: task.exp_end_date ? task.exp_end_date.split(' ')[0] : '',
        progress: task.progress || 0,
        description: task.description || '',
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
              />
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
            />
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
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to update task'}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTask;
