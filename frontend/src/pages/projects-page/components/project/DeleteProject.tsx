import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useDeleteProject } from '@/services';
import type { Project } from '@/types/Projects/Project';
import { AlertTriangle } from 'lucide-react';

interface DeleteProjectProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteProject: React.FC<DeleteProjectProps> = ({ project, isOpen, onClose, onSuccess }) => {
  const { deleteProject, isLoading, error } = useDeleteProject();

  const handleDelete = async () => {
    if (!project) return;

    try {
      await deleteProject(project.name);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Project
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Are you sure you want to delete this project? This action cannot be undone.
          </div>
          
          {project && (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="font-medium text-gray-900">{project.project_name}</div>
              <div className="text-sm text-gray-600">{project.customer || 'No customer'}</div>
              <div className="text-sm text-gray-600">Status: {project.status || 'Open'}</div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this project will also remove:
            </div>
            <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
              <li>All project tasks and subtasks</li>
              <li>All project phases</li>
              <li>Project team members</li>
              <li>Project timesheets and activities</li>
              <li>All related documents and files</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to delete project'}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProject;
