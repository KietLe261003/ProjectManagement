import React, { useState } from 'react';
import { useFrappeCreateDoc } from 'frappe-react-sdk';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useProjectUsers } from '@/services/projectUsersService';
import { usePhaseAssignment } from '@/services/phaseService';

interface CreateProjectPhaseProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onSuccess?: () => void;
}

export const CreateProjectPhase: React.FC<CreateProjectPhaseProps> = ({
  isOpen,
  onClose,
  projectName,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    start_date: '',
    end_date: '',
    priority: 'Medium',
    details: '',
    costing: 0,
    assign_to: '' // Added assign_to field
  });

  const { createDoc, loading, error } = useFrappeCreateDoc();
  const { assignPhase } = usePhaseAssignment();
  
  // Fetch project users for assignment dropdown
  const { data: projectUsers, isLoading: usersLoading } = useProjectUsers(projectName);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      return;
    }

    try {
      // Prepare phase data (exclude assign_to as it's not a phase field)
      const { assign_to, ...phaseData } = formData;
      
      const newPhase = await createDoc('project_phase', {
        project: projectName,
        subject: phaseData.subject,
        start_date: phaseData.start_date || null,
        end_date: phaseData.end_date || null,
        priority: phaseData.priority,
        details: phaseData.details || null,
        costing: phaseData.costing || 0,
        status: 'Open',
        progress: 0
      });

      // If assign_to is specified, create assignment
      if (assign_to && newPhase) {
        await assignPhase(newPhase.name, assign_to);
      }

      // Reset form
      setFormData({
        subject: '',
        start_date: '',
        end_date: '',
        priority: 'Medium',
        details: '',
        costing: 0,
        assign_to: ''
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('Failed to create project phase:', err);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      subject: '',
      start_date: '',
      end_date: '',
      priority: 'Medium',
      details: '',
      costing: 0,
      assign_to: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project Phase</DialogTitle>
          <DialogDescription>
            Add a new phase to organize tasks and milestones for "{projectName}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Phase Name *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g., Planning, Development, Testing"
              required
            />
          </div>

          {/* Priority */}
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

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <div className="relative">
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <div className="relative">
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  min={formData.start_date || undefined}
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Costing */}
          <div className="space-y-2">
            <Label htmlFor="costing">Estimated Cost</Label>
            <Input
              id="costing"
              type="number"
              value={formData.costing}
              onChange={(e) => handleInputChange('costing', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
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

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Description</Label>
            <textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              placeholder="Phase description, objectives, and key deliverables..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {error.message || 'Failed to create project phase. Please try again.'}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.subject.trim()}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Phase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
