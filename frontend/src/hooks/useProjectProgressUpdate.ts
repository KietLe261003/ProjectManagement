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
          'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
        },
        credentials: 'include',
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

      // Find phases that contain this task by fetching full phase documents
      const affectedPhases = [];
      
      for (const phase of phases) {
        try {
          const phaseDocResponse = await fetch(`/api/resource/project_phase/${phase.name}`, {
            headers: {
              'Accept': 'application/json',
              'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
            },
            credentials: 'include'
          });
          
          if (phaseDocResponse.ok) {
            const phaseDoc = await phaseDocResponse.json();
            if (phaseDoc.data.tasks && phaseDoc.data.tasks.some((phaseTask: any) => phaseTask.task === taskName)) {
              affectedPhases.push(phase);
            }
          }
        } catch (error) {
          console.warn('Error fetching phase document:', phase.name, error);
        }
      }

      console.log(`Found ${affectedPhases.length} phases affected by task ${taskName}`);

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
