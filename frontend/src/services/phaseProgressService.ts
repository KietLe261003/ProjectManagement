import { useFrappeUpdateDoc } from 'frappe-react-sdk';

export class PhaseProgressService {
  // Calculate phase progress based on tasks
  static usePhaseProgressCalculation() {
    const { updateDoc } = useFrappeUpdateDoc();

    const calculateAndUpdatePhaseProgress = async (phaseName: string) => {
      try {
        // First, get the phase to get task list
        const phaseResponse = await fetch('/api/method/frappe.client.get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
          },
          credentials: 'include',
          body: JSON.stringify({
            doctype: 'project_phase',
            name: phaseName,
          })
        });

        if (!phaseResponse.ok) {
          throw new Error(`HTTP error! status: ${phaseResponse.status}`);
        }

        const phaseResult = await phaseResponse.json();
        const phase = phaseResult.message;

        if (!phase || !phase.tasks || phase.tasks.length === 0) {
          // No tasks in phase - phase progress should be 0
          await updateDoc('project_phase', phaseName, {
            progress: 0
          });
          console.log(`Phase ${phaseName} progress updated to 0% (no tasks)`);
          return 0;
        }

        // Get progress of all tasks in this phase
        const taskNames = phase.tasks.map((task: any) => task.task);
        
        // Get task progress for all tasks
        const tasksResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
          },
          credentials: 'include',
          body: JSON.stringify({
            doctype: 'Task',
            fields: ['name', 'progress'],
            filters: [['name', 'in', taskNames]],
          })
        });

        if (!tasksResponse.ok) {
          throw new Error(`HTTP error! status: ${tasksResponse.status}`);
        }

        const tasksResult = await tasksResponse.json();
        const tasks = tasksResult.message || [];

        if (tasks.length === 0) {
          // No valid tasks found
          await updateDoc('project_phase', phaseName, {
            progress: 0
          });
          console.log(`Phase ${phaseName} progress updated to 0% (no valid tasks)`);
          return 0;
        }

        // Calculate average progress of all tasks
        let totalProgress = 0;
        tasks.forEach((task: any) => {
          totalProgress += (task.progress || 0);
        });

        const averageProgress = Math.round(totalProgress / tasks.length);

        // Update phase progress
        await updateDoc('project_phase', phaseName, {
          progress: averageProgress
        });
        
        console.log(`Phase ${phaseName} progress updated to ${averageProgress}% (based on ${tasks.length} tasks)`);
        return averageProgress;
      } catch (error) {
        console.error('Error calculating phase progress:', error);
        return null;
      }
    };

    return { calculateAndUpdatePhaseProgress };
  }

  // Update phase progress based on status (for project manager)
  static usePhaseStatusProgressUpdate() {
    const { updateDoc } = useFrappeUpdateDoc();

    const updatePhaseProgressByStatus = async (phaseName: string, status: string, currentProgress?: number) => {
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

        await updateDoc('project_phase', phaseName, {
          status: status,
          progress: newProgress
        });

        return newProgress;
      } catch (error) {
        console.error('Error updating phase progress by status:', error);
        return null;
      }
    };

    return { updatePhaseProgressByStatus };
  }

  // Manual progress update (for phase manager)
  static useManualPhaseProgressUpdate() {
    const { updateDoc } = useFrappeUpdateDoc();

    const updatePhaseProgress = async (phaseName: string, progress: number) => {
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

        await updateDoc('project_phase', phaseName, {
          progress: progress,
          status: autoStatus
        });

        return { progress, status: autoStatus };
      } catch (error) {
        console.error('Error updating manual phase progress:', error);
        return null;
      }
    };

    return { updatePhaseProgress };
  }
}

export const { 
  usePhaseProgressCalculation, 
  usePhaseStatusProgressUpdate, 
  useManualPhaseProgressUpdate
} = PhaseProgressService;

// Export a standalone function for external use
export const calculateAndUpdatePhaseProgress = async (phaseName: string) => {
  const { calculateAndUpdatePhaseProgress: hookFunction } = PhaseProgressService.usePhaseProgressCalculation();
  return await hookFunction(phaseName);
};
