import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappePostCall } from 'frappe-react-sdk';
import { AlertTriangle } from 'lucide-react';

interface DeleteSubTaskProps {
  subtask: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteSubTask: React.FC<DeleteSubTaskProps> = ({ subtask, isOpen, onClose, onSuccess }) => {
  const { call: deleteSubTask, loading, error } = useFrappePostCall('frappe.client.delete');

  const handleDelete = async () => {
    if (!subtask) return;

    try {
      await deleteSubTask({
        doctype: 'SubTask',
        name: subtask.name
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error deleting subtask:', err);
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
            Delete SubTask
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Are you sure you want to delete this subtask? This action cannot be undone.
          </div>
          
          {subtask && (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="font-medium text-gray-900">{subtask.subject}</div>
              <div className="text-sm text-gray-600">Status: {subtask.status || 'Open'}</div>
              <div className="text-sm text-gray-600">Progress: {subtask.progress || 0}%</div>
              <div className="text-sm text-gray-600">Task: {subtask.task}</div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this subtask will also remove:
            </div>
            <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
              <li>All subtask progress data</li>
              <li>Subtask timeline and activities</li>
              <li>Related comments and attachments</li>
              <li>Any associated time logs</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to delete subtask'}</p>
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
            {loading ? 'Deleting...' : 'Delete SubTask'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSubTask;
