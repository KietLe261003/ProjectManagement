import { usePhaseProgressCalculation } from '@/services/phaseProgressService';
import { useProjectProgressCalculation } from '@/services/projectProgressService';

export const useProjectProgressUpdate = () => {
  const { calculateAndUpdatePhaseProgress } = usePhaseProgressCalculation();
  const { calculateAndUpdateProjectProgress } = useProjectProgressCalculation();

  const updatePhaseProgressForTask = async (taskName: string, projectName: string) => {
    try {
      // Get all phases for this project that contain the task
      const phasesResponse = await fetch('/api/method/frappe.client.get_list', {
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
          fields: ['name', 'tasks'],
          filters: [['project', '=', projectName]],
        })
      });

      if (!phasesResponse.ok) {
        throw new Error(`HTTP error! status: ${phasesResponse.status}`);
      }

      const phasesResult = await phasesResponse.json();
      const phases = phasesResult.message || [];

      // Find phases that contain this task
      const affectedPhases = phases.filter((phase: any) => {
        return phase.tasks && phase.tasks.some((phaseTask: any) => phaseTask.task === taskName);
      });

      // Update progress for each affected phase
      for (const phase of affectedPhases) {
        console.log(`Updating progress for phase ${phase.name} after task ${taskName} change`);
        await calculateAndUpdatePhaseProgress(phase.name);
      }

      // After updating phases, update overall project progress
      console.log(`Updating overall project progress for ${projectName} after task ${taskName} change`);
      await calculateAndUpdateProjectProgress(projectName);

      console.log(`Updated progress for ${affectedPhases.length} phases and project ${projectName} affected by task ${taskName}`);
      return affectedPhases;
    } catch (error) {
      console.error('Error updating phase progress for task:', error);
      return [];
    }
  };

  const updateProjectProgress = async (projectName: string) => {
    try {
      // Update project progress using the comprehensive calculation
      console.log(`Updating overall project progress for ${projectName}`);
      const result = await calculateAndUpdateProjectProgress(projectName);
      
      if (result) {
        console.log(`Project ${projectName} progress updated to ${result.progress}% from ${result.source} (${result.count} items)`);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating project progress:', error);
      return null;
    }
  };

  return {
    updatePhaseProgressForTask,
    updateProjectProgress
  };
};
