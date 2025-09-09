import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { useProjectUsers } from '@/services/projectUsersService';
import { useUpdateSubTask, useSubTaskAssignment } from '@/services/subTaskService';
import { useTaskProgressCalculation } from '@/services/taskProgressService';

interface EditSubTaskProps {
  subtask: any;
  projectName: string; // Added projectName
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditSubTask: React.FC<EditSubTaskProps> = ({ subtask, projectName, isOpen, onClose, onSuccess }) => {
  const { updateSubTask, isLoading: updateLoading, error: updateError } = useUpdateSubTask();
  const { assignSubTask, unassignSubTask } = useSubTaskAssignment();
  const { calculateAndUpdateTaskProgress } = useTaskProgressCalculation();
  
  // Fetch project users for assignment dropdown
  const { data: projectUsers, isLoading: usersLoading } = useProjectUsers(projectName);
  
  // Fetch current ToDo assignments for this subtask
  const { data: existingToDos } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'allocated_to'],
    filters: [['reference_type', '=', 'SubTask'], ['reference_name', '=', subtask?.name || '']],
  });
  
  const [formData, setFormData] = useState({
    subject: '',
    status: 'Open',
    start_date: '',
    end_date: '',
    description: '',
    assign_to: '', // Added assign_to field
  });

  // Get current assignment
  const currentAssignment = existingToDos?.[0]?.allocated_to || '';

  // Update form data when subtask changes
  useEffect(() => {
    if (subtask) {
      setFormData({
        subject: subtask.subject || '',
        status: subtask.status || 'Open',
        start_date: subtask.start_date ? subtask.start_date.split(' ')[0] : '',
        end_date: subtask.end_date ? subtask.end_date.split(' ')[0] : '',
        description: subtask.description || '',
        assign_to: currentAssignment, // Set current assignment
      });
    }
  }, [subtask, currentAssignment]);

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
      // Prepare subtask data (exclude assign_to as it's not a subtask field)
      const { assign_to, ...subTaskData } = formData;
      
      // Update subtask
      await updateSubTask(subtask.name, subTaskData);
      
      // Handle assignment changes
      const previousAssignment = currentAssignment;
      const newAssignment = assign_to;
      
      if (previousAssignment && previousAssignment !== newAssignment) {
        // Remove old assignment
        const oldToDo = existingToDos?.find(todo => todo.allocated_to === previousAssignment);
        if (oldToDo) {
          await unassignSubTask(oldToDo.name);
        }
      }
      
      if (newAssignment && newAssignment !== previousAssignment) {
        // Create new assignment
        await assignSubTask(subtask.name, newAssignment);
      }
      // Update parent task progress if subtask status changed
      if (subtask.task && subTaskData.status !== subtask.status) {
        await calculateAndUpdateTaskProgress(subtask.task);
      }
      
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
        description: subtask.description || '',
        assign_to: currentAssignment, // Reset to current assignment
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
              <option value="Completed">Completed</option>
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

          {/* Error Display */}
          {updateError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {updateError.message || 'Failed to update subtask'}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update SubTask'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubTask;
