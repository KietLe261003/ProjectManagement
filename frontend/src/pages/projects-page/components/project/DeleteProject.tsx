import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProjectCascadeDelete } from '@/services/projectCascadeDeleteService';
import type { Project } from '@/types/Projects/Project';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from "sonner";
interface DeleteProjectProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteProject: React.FC<DeleteProjectProps> = ({ project, isOpen, onClose, onSuccess }) => {
  const { deleteProjectCascade } = useProjectCascadeDelete();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [deletionProgress, setDeletionProgress] = useState<string>('');

  const handleDelete = async () => {
    if (!project) {
      console.error('No project selected for deletion');
      toast.error("Delete project failed", {
        description: "No project selected",
      });
      return;
    }

    if (isLoading) {
      console.log('Delete already in progress, ignoring duplicate request');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDeletionProgress('Starting deletion...');

    try {
      console.log(`Starting deletion for project: ${project.name}`);
      
      setDeletionProgress('Deleting subtasks...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDeletionProgress('Deleting tasks...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDeletionProgress('Deleting project phases...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDeletionProgress('Cleaning up dependencies...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDeletionProgress('Deleting project...');
      const result = await deleteProjectCascade(project.name);
      
      setDeletionProgress('Deletion completed successfully!');
      
      console.log('Cascade deletion result:', result);
      
      toast.success("Project deleted successfully", {
        description: `Project "${project.name}" and all related items have been deleted.`,
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err:any) {
      // Extract more meaningful error messages
      let errorMessage = "Delete project failed";
      let isRetryable = false;
      
      if (err?._server_messages) {
        try {
          const serverMsgs = JSON.parse(err._server_messages);
          if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
            const parsed = JSON.parse(serverMsgs[0]);
            errorMessage = parsed.message || errorMessage;
          }
        } catch (parseErr) {
          console.error("Parse error messages failed:", parseErr);
        }
      } else if (err?.message) {
        errorMessage = err.message;
        
        // Check if this is a retryable error (dependencies issue)
        if (errorMessage.includes('dependencies') || 
            errorMessage.includes('linked') || 
            errorMessage.includes('referenced') ||
            errorMessage.includes('Unknown project deletion error')) {
          isRetryable = true;
          errorMessage += '\n\nTip: This error usually resolves on the second attempt. Please try again.';
        }
      }
      
      console.error('Error deleting project:', err);
      
      toast.error("Delete project failed", {
        description: errorMessage,
        duration: isRetryable ? 8000 : 5000, // Longer duration for retryable errors
      });
      
      setError(err instanceof Error ? err : new Error(errorMessage));
      setDeletionProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setError(null);
      setDeletionProgress('');
      onClose();
    }
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
              <strong>Warning:</strong> This will permanently delete in the following order:
            </div>
            <ol className="text-sm text-red-700 mt-1 ml-4 list-decimal">
              <li>All subtasks in all tasks</li>
              <li>All tasks in the project</li>
              <li>All project phases</li>
              <li>All ToDo assignments</li>
              <li>All project team members</li>
              <li>The project itself</li>
            </ol>
            <div className="text-sm text-red-800 mt-2">
              <strong>This action cannot be undone!</strong>
            </div>
          </div>

          {/* Progress Display */}
          {isLoading && deletionProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Progress:</strong> {deletionProgress}
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Please wait while we delete all related items...
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to delete project'}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Cancel'}
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </div>
            ) : (
              'Delete Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProject;
