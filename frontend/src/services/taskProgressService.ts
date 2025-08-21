import { useFrappeUpdateDoc } from 'frappe-react-sdk';

export class TaskProgressService {
  // Calculate task progress based on subtasks
  static useTaskProgressCalculation() {
    const { updateDoc } = useFrappeUpdateDoc();

    const calculateAndUpdateTaskProgress = async (taskName: string) => {
      try {
        // Get all subtasks for this task using direct API call
        const response = await fetch('/api/method/frappe.client.get_list', {
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
            fields: ['name', 'status'],
            filters: [['task', '=', taskName]],
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const subtasks = result.message || [];

        if (!subtasks || subtasks.length === 0) {
          // No subtasks - task progress should be managed manually
          return null;
        }

        // Calculate progress based on subtask statuses
        let totalProgress = 0;
        subtasks.forEach((subtask: any) => {
          switch (subtask.status) {
            case 'Open':
              totalProgress += 1;
              break;
            case 'Working':
              totalProgress += 50; // Assume 50% when working
              break;
            case 'Completed':
              totalProgress += 100;
              break;
            default:
              totalProgress += 0;
          }
        });

        const averageProgress = Math.round(totalProgress / subtasks.length);

        // Update task progress
        await updateDoc('Task', taskName, {
          progress: averageProgress
        });
        console.log(`Task ${taskName} progress updated to ${averageProgress}%`);
        return averageProgress;
      } catch (error) {
        console.error('Error calculating task progress:', error);
        return null;
      }
    };

    return { calculateAndUpdateTaskProgress };
  }

  // Update task progress based on status (for leader)
  static useTaskStatusProgressUpdate() {
    const { updateDoc } = useFrappeUpdateDoc();

    const updateTaskProgressByStatus = async (taskName: string, status: string, currentProgress?: number) => {
      try {
        let newProgress = currentProgress || 0;

        switch (status) {
          case 'Completed':
            newProgress = 100;
            break;
          case 'Cancelled':
          case 'Rejected':
            newProgress = 0;
            break;
          default:
            // Keep current progress for other statuses
            break;
        }

        await updateDoc('Task', taskName, {
          status: status,
          progress: newProgress
        });

        return newProgress;
      } catch (error) {
        console.error('Error updating task progress by status:', error);
        return null;
      }
    };

    return { updateTaskProgressByStatus };
  }

  // Manual progress update (for task assignee)
  static useManualProgressUpdate() {
    const { updateDoc } = useFrappeUpdateDoc();

    const updateTaskProgress = async (taskName: string, progress: number) => {
      try {
        let autoStatus = '';

        // Auto-determine status based on progress
        if (progress === 0) {
          autoStatus = 'Open';
        } else if (progress === 1) {
          autoStatus = 'Open';
        } else if (progress > 1 && progress <= 90) {
          autoStatus = 'Working';
        } else if (progress > 90 && progress < 100) {
          autoStatus = 'Pending Review';
        } else if (progress === 100) {
          autoStatus = 'Completed';
        }

        await updateDoc('Task', taskName, {
          progress: progress,
          status: autoStatus
        });

        return { progress, status: autoStatus };
      } catch (error) {
        console.error('Error updating manual task progress:', error);
        return null;
      }
    };

    return { updateTaskProgress };
  }
}

export const { 
  useTaskProgressCalculation, 
  useTaskStatusProgressUpdate, 
  useManualProgressUpdate
} = TaskProgressService;
