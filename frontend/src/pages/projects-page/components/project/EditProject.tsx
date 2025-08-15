import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useUpdateProject } from '@/services';
import type { Project } from '@/types/Projects/Project';
import type { ProjectCreateData } from '@/services/projectService';

interface EditProjectProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditProject: React.FC<EditProjectProps> = ({ project, isOpen, onClose, onSuccess }) => {
  const { updateProject, isLoading, error } = useUpdateProject();
  
  const [formData, setFormData] = useState<Partial<ProjectCreateData>>({
    project_name: '',
    customer: '',
    project_type: '',
    status: 'Open',
    priority: 'Medium',
    department: '',
    company: '',
    cost_center: '',
    expected_start_date: '',
    expected_end_date: '',
    notes: '',
  });

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.project_name || '',
        customer: project.customer || '',
        project_type: project.project_type || '',
        status: project.status || 'Open',
        priority: project.priority || 'Medium',
        department: project.department || '',
        company: project.company || '',
        cost_center: project.cost_center || '',
        expected_start_date: project.expected_start_date ? project.expected_start_date.split(' ')[0] : '',
        expected_end_date: project.expected_end_date ? project.expected_end_date.split(' ')[0] : '',
        notes: project.notes || '',
      });
    }
  }, [project]);

  const handleInputChange = (field: keyof ProjectCreateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;

    try {
      await updateProject(project.name, formData);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  const handleCancel = () => {
    if (project) {
      // Reset form to original values
      setFormData({
        project_name: project.project_name || '',
        customer: project.customer || '',
        project_type: project.project_type || '',
        status: project.status || 'Open',
        priority: project.priority || 'Medium',
        department: project.department || '',
        company: project.company || '',
        cost_center: project.cost_center || '',
        expected_start_date: project.expected_start_date ? project.expected_start_date.split(' ')[0] : '',
        expected_end_date: project.expected_end_date ? project.expected_end_date.split(' ')[0] : '',
        notes: project.notes || '',
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e) => handleInputChange('project_name', e.target.value)}
              required
              placeholder="Enter project name"
            />
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Input
              id="customer"
              value={formData.customer}
              onChange={(e) => handleInputChange('customer', e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="project_type">Project Type</Label>
            <select
              id="project_type"
              value={formData.project_type}
              onChange={(e) => handleInputChange('project_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select project type</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
              <option value="Other">Other</option>
            </select>
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

          {/* Department and Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Enter department"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company"
              />
            </div>
          </div>

          {/* Cost Center */}
          <div className="space-y-2">
            <Label htmlFor="cost_center">Cost Center</Label>
            <Input
              id="cost_center"
              value={formData.cost_center}
              onChange={(e) => handleInputChange('cost_center', e.target.value)}
              placeholder="Enter cost center"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_start_date">Expected Start Date</Label>
              <Input
                id="expected_start_date"
                type="date"
                value={formData.expected_start_date}
                onChange={(e) => handleInputChange('expected_start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_end_date">Expected End Date</Label>
              <Input
                id="expected_end_date"
                type="date"
                value={formData.expected_end_date}
                onChange={(e) => handleInputChange('expected_end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter project notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to update project'}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProject;
