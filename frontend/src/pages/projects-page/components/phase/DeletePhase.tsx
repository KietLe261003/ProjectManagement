import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappePostCall } from 'frappe-react-sdk';
import { AlertTriangle } from 'lucide-react';

interface DeletePhaseProps {
  phase: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeletePhase: React.FC<DeletePhaseProps> = ({ phase, isOpen, onClose, onSuccess }) => {
  const { call: deletePhase, loading, error } = useFrappePostCall('frappe.client.delete');

  const handleDelete = async () => {
    if (!phase) return;

    try {
      await deletePhase({
        doctype: 'project_phase',
        name: phase.name
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error deleting phase:', err);
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
            Delete Phase
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Are you sure you want to delete this phase? This action cannot be undone.
          </div>
          
          {phase && (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="font-medium text-gray-900">{phase.subject}</div>
              <div className="text-sm text-gray-600">Status: {phase.status || 'Open'}</div>
              <div className="text-sm text-gray-600">Priority: {phase.priority || 'Medium'}</div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this phase will also remove:
            </div>
            <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
              <li>All tasks associated with this phase</li>
              <li>All phase progress data</li>
              <li>Phase timeline and milestones</li>
              <li>Related documents and attachments</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to delete phase'}</p>
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
            {loading ? 'Deleting...' : 'Delete Phase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePhase;
