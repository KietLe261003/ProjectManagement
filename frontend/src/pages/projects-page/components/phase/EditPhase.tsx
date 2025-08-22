import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { useProjectUsers } from '@/services/projectUsersService';
import { useUpdatePhase, usePhaseAssignment } from '@/services/phaseService';
import { toast } from "sonner";

interface EditPhaseProps {
  phase: any;
  projectName: string; // Added projectName
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditPhase: React.FC<EditPhaseProps> = ({ phase, projectName, isOpen, onClose, onSuccess }) => {
  const { updatePhase, isLoading: updateLoading, error: updateError } = useUpdatePhase();
  const { assignPhase, unassignPhase } = usePhaseAssignment();
  
  // Fetch project users for assignment dropdown
  const { data: projectUsers, isLoading: usersLoading } = useProjectUsers(projectName);
  
  // Fetch current ToDo assignments for this phase
  const { data: existingToDos } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'allocated_to'],
    filters: [['reference_type', '=', 'project_phase'], ['reference_name', '=', phase?.name || '']],
  });
  
  const [formData, setFormData] = useState({
    subject: '',
    status: 'Open',
    priority: 'Medium',
    start_date: '',
    end_date: '',
    progress: 0,
    details: '',
    costing: 0,
    assign_to: '', // Added assign_to field
  });

  // Get current assignment
  const currentAssignment = existingToDos?.[0]?.allocated_to || '';

  // Update form data when phase changes
  useEffect(() => {
    if (phase) {
      setFormData({
        subject: phase.subject || '',
        status: phase.status || 'Open',
        priority: phase.priority || 'Medium',
        start_date: phase.start_date ? phase.start_date.split(' ')[0] : '',
        end_date: phase.end_date ? phase.end_date.split(' ')[0] : '',
        progress: phase.progress || 0,
        details: phase.details || '',
        costing: phase.costing || 0,
        assign_to: currentAssignment, // Set current assignment
      });
    }
  }, [phase, currentAssignment]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phase) return;

    try {
      // Prepare phase data (exclude assign_to as it's not a phase field)
      const { assign_to, ...phaseData } = formData;
      
      // Update phase
      await updatePhase(phase.name, phaseData);
      
      // Handle assignment changes
      const previousAssignment = currentAssignment;
      const newAssignment = assign_to;
      
      if (previousAssignment && previousAssignment !== newAssignment) {
        // Remove old assignment
        const oldToDo = existingToDos?.find(todo => todo.allocated_to === previousAssignment);
        if (oldToDo) {
          await unassignPhase(oldToDo.name);
        }
      }
      
      if (newAssignment && newAssignment !== previousAssignment) {
        // Create new assignment
        await assignPhase(phase.name, newAssignment);
      }
      
      // Show success message
      toast.success("Phase updated successfully", {
        description: `Phase "${formData.subject}" has been updated.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating phase:', err);
      
      // Show error message
      toast.error("Failed to update phase", {
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    }
  };

  const handleCancel = () => {
    if (phase) {
      setFormData({
        subject: phase.subject || '',
        status: phase.status || 'Open',
        priority: phase.priority || 'Medium',
        start_date: phase.start_date ? phase.start_date.split(' ')[0] : '',
        end_date: phase.end_date ? phase.end_date.split(' ')[0] : '',
        progress: phase.progress || 0,
        details: phase.details || '',
        costing: phase.costing || 0,
        assign_to: currentAssignment, // Reset to current assignment
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Phase</DialogTitle>
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
              placeholder="Enter phase subject"
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
                <option value="Critical">Critical</option>
              </select>
            </div>
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

          {/* Progress and Costing */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="costing">Costing</Label>
              <Input
                id="costing"
                type="number"
                min="0"
                step="0.01"
                value={formData.costing}
                onChange={(e) => handleInputChange('costing', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              placeholder="Enter phase details"
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
              <p><strong>Error:</strong> {updateError.message || 'Failed to update phase'}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update Phase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPhase;
