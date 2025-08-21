import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFrappeDeleteDoc } from 'frappe-react-sdk';
import { AlertTriangle } from 'lucide-react';

interface DeleteTaskProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteTask: React.FC<DeleteTaskProps> = ({ task, isOpen, onClose, onSuccess }) => {
  const { deleteDoc, loading, error } = useFrappeDeleteDoc();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!task) return;

    setIsDeleting(true);
    try {
      // Step 1: Fetch tất cả SubTasks của Task này
      const subtaskResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
<<<<<<< HEAD
        },
=======
          'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
        },
        credentials: 'include',
>>>>>>> ca353f013da63c18b5dc0c89d8ff3c60071062d4
        body: JSON.stringify({
          doctype: 'SubTask',
          fields: ['name'],
          filters: [['task', '=', task.name]],
        })
      });

      if (subtaskResponse.ok) {
        const subtaskResult = await subtaskResponse.json();
        const subtasks = subtaskResult.message || [];

        // Xóa tất cả SubTasks trước
        if (subtasks.length > 0) {
          for (const subtask of subtasks) {
            await deleteDoc('SubTask', subtask.name);
          }
        }
      }
      
      try {
        // Fetch project phases list first (same as ProjectTaskManagement)
        const phasesListResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
<<<<<<< HEAD
          },
=======
            'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
          },
          credentials: 'include',
>>>>>>> ca353f013da63c18b5dc0c89d8ff3c60071062d4
          body: JSON.stringify({
            doctype: 'project_phase',
            fields: ['name', 'subject', 'status', 'priority', 'start_date', 'end_date', 'progress', 'details', 'costing'],
            filters: [['project', '=', task.project]],
            orderBy: { field: 'start_date', order: 'asc' }
          })
        });

        if (phasesListResponse.ok) {
          const phasesListResult = await phasesListResponse.json();
          const phasesList = phasesListResult.message || [];
          
          
          // Fetch individual phase documents to get child table data (same as ProjectTaskManagement)
          const phasesToUpdate = [];
          for (const phase of phasesList) {
            try {
              // Use frappe.client.get to get full document with child tables
              const phaseResponse = await fetch(`/api/resource/project_phase/${phase.name}`, {
                headers: {
                  'Accept': 'application/json',
                }
              });
              
              if (phaseResponse.ok) {
                const phaseDoc = await phaseResponse.json();
                const phaseTasks = phaseDoc.data?.tasks || [];
                
                // Tìm task trong child table của phase này
                const taskIndex = phaseTasks.findIndex((pt: any) => pt.task === task.name);
                
                if (taskIndex >= 0) {
                  console.log(`Found task ${task.name} in phase ${phase.name}, will remove from child table...`);
                  
                  // Remove task from child table
                  phaseTasks.splice(taskIndex, 1);
                  
                  // Store phase for updating
                  phasesToUpdate.push({
                    name: phase.name,
                    data: {
                      ...phaseDoc.data,
                      tasks: phaseTasks
                    }
                  });
                }
              } else {
                console.warn('Failed to fetch phase:', phase.name);
              }
            } catch (phaseError) {
              console.error('Error fetching phase:', phase.name, phaseError);
            }
          }
          
          // Update all phases that had the task
          for (const phaseToUpdate of phasesToUpdate) {
            try {
              const updateResponse = await fetch(`/api/resource/project_phase/${phaseToUpdate.name}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify(phaseToUpdate.data)
              });
              
              if (updateResponse.ok) {
                console.log(`Successfully removed task ${task.name} from phase ${phaseToUpdate.name}`);
              } else {
                console.warn(`Failed to update phase ${phaseToUpdate.name} after removing task`);
              }
            } catch (updateError) {
              console.error(`Error updating phase ${phaseToUpdate.name}:`, updateError);
            }
          }
        } else {
          console.warn('Failed to fetch phases list, proceeding with task deletion...');
        }
      } catch (err) {
        console.warn('Error checking phases for task references:', err);
      }

      await deleteDoc('Task', task.name);
      console.log(`Successfully deleted task ${task.name}`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      
      // Hiển thị thông báo lỗi user-friendly
      if (err?.exception?.includes('LinkExistsError')) {
        if (err.exception.includes('project_phase') || err.exception.includes('phase')) {
          alert('Cannot delete task because it is still linked with project phases. The system tried to remove phase task links automatically but failed. Please contact administrator.');
        } else if (err.exception.includes('SubTask')) {
          alert('Cannot delete task because it has linked subtasks. Please delete all subtasks first.');
        } else {
          alert('Cannot delete task because it has linked dependencies. Please check related records.');
        }
      } else {
        alert('Error deleting task. Please try again.');
      }
    } finally {
      setIsDeleting(false);
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
              {task.project && (
                <div className="text-sm text-blue-600">Project: {task.project}</div>
              )}
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>⚠️ Warning:</strong> Deleting this task will automatically:
            </div>
            <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
              <li><strong>Delete ALL subtasks first</strong> (to resolve SubTask dependencies)</li>
              <li><strong>Remove task from ALL phase child tables</strong> (for any phases this task is assigned to)</li>
              <li>Remove all task progress data</li>
              <li>Delete task timeline and activities</li>
              <li>Remove related comments and attachments</li>
            </ul>
            <div className="text-xs text-red-600 mt-2 font-medium">
              💡 The system will automatically search and handle ALL dependencies to prevent LinkExistsError.
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <p><strong>Error:</strong> {error.message || 'Failed to delete task'}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || loading}
          >
            {isDeleting ? 'Deleting Task & SubTasks...' : loading ? 'Deleting...' : 'Delete Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTask;
