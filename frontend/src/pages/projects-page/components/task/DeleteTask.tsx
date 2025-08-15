import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappePostCall } from 'frappe-react-sdk';
import { AlertTriangle } from 'lucide-react';

interface DeleteTaskProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteTask: React.FC<DeleteTaskProps> = ({ task, isOpen, onClose, onSuccess }) => {
  const { call: deleteTask, loading, error } = useFrappePostCall('frappe.client.delete');

  const handleDelete = async () => {
    if (!task) return;

    try {
      await deleteTask({
        doctype: 'Task',
        name: task.name
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error deleting task:', err);
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
            Delete Task
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Are you sure you want to delete this task? This action cannot be undone.
          </div>
          
          {task && (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="font-medium text-gray-900">{task.subject}</div>
              <div className="text-sm text-gray-600">Status: {task.status || 'Open'}</div>
              <div className="text-sm text-gray-600">Priority: {task.priority || 'Medium'}</div>
              <div className="text-sm text-gray-600">Progress: {task.progress || 0}%</div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this task will also remove:
            </div>
            <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
              <li>All subtasks associated with this task</li>
              <li>All task progress data</li>
              <li>Task timeline and activities</li>
              <li>Related comments and attachments</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to delete task'}</p>
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
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTask;
