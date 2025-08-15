import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappePostCall } from 'frappe-react-sdk';

interface EditSubTaskProps {
  subtask: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditSubTask: React.FC<EditSubTaskProps> = ({ subtask, isOpen, onClose, onSuccess }) => {
  const { call: updateSubTask, loading, error } = useFrappePostCall('frappe.client.save');
  
  const [formData, setFormData] = useState({
    subject: '',
    status: 'Open',
    start_date: '',
    end_date: '',
    progress: 0,
    description: '',
  });

  // Update form data when subtask changes
  useEffect(() => {
    if (subtask) {
      setFormData({
        subject: subtask.subject || '',
        status: subtask.status || 'Open',
        start_date: subtask.start_date ? subtask.start_date.split(' ')[0] : '',
        end_date: subtask.end_date ? subtask.end_date.split(' ')[0] : '',
        progress: subtask.progress || 0,
        description: subtask.description || '',
      });
    }
  }, [subtask]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subtask) return;

    try {
      await updateSubTask({
        doc: {
          doctype: 'SubTask',
          name: subtask.name,
          ...formData
        }
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating subtask:', err);
    }
  };

  const handleCancel = () => {
    if (subtask) {
      setFormData({
        subject: subtask.subject || '',
        status: subtask.status || 'Open',
        start_date: subtask.start_date ? subtask.start_date.split(' ')[0] : '',
        end_date: subtask.end_date ? subtask.end_date.split(' ')[0] : '',
        progress: subtask.progress || 0,
        description: subtask.description || '',
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit SubTask</DialogTitle>
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
              placeholder="Enter subtask subject"
            />
          </div>

          {/* Status */}
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
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
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
              placeholder="Enter subtask description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to update subtask'}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update SubTask'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubTask;
