import { useEffect } from 'react';
import { calculateAndUpdatePhaseProgress } from '@/services/phaseProgressService';

// Hook to automatically update phase progress when tasks in that project change
export const usePhaseProgressAutoUpdate = (projectName: string, onProgressUpdated?: () => void) => {
  
  const triggerPhaseProgressUpdate = async (taskName: string) => {
    try {
      console.log(`Task ${taskName} changed, updating affected phase progress...`);
      
      // Get task details to find project
      const taskResponse = await fetch(`/api/resource/Task/${taskName}`, {
        headers: {
          'Accept': 'application/json',
          'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
        },
        credentials: 'include'
      });

      if (taskResponse.ok) {
        const taskData = await taskResponse.json();
        const task = taskData.data;
        
        // Only process if task belongs to current project
        if (task.project === projectName) {
          console.log(`Task ${taskName} belongs to current project ${projectName}, finding affected phases...`);
          
          // Get all phases for this project
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
              fields: ['name'],
              filters: [['project', '=', projectName]],
            })
          });

          if (phasesResponse.ok) {
            const phasesResult = await phasesResponse.json();
            const phases = phasesResult.message || [];
            
            // For each phase, check if it contains this task and update progress
            for (const phase of phases) {
              try {
                const fullPhaseResponse = await fetch(`/api/resource/project_phase/${phase.name}`, {
                  headers: {
                    'Accept': 'application/json',
                    'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
                  },
                  credentials: 'include'
                });
                
                if (fullPhaseResponse.ok) {
                  const fullPhaseData = await fullPhaseResponse.json();
                  const fullPhase = fullPhaseData.data;
                  
                  // Check if this phase contains the task
                  if (fullPhase.tasks && fullPhase.tasks.some((phaseTask: any) => phaseTask.task === taskName)) {
                    console.log(`Updating progress for phase ${phase.name} containing task ${taskName}`);
                    await calculateAndUpdatePhaseProgress(phase.name);
                    
                    // Trigger UI refresh
                    if (onProgressUpdated) {
                      onProgressUpdated();
                    }
                  }
                }
              } catch (error) {
                console.error(`Error updating progress for phase ${phase.name}:`, error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in triggerPhaseProgressUpdate:', error);
    }
  };

  // Listen for storage events (can be used to communicate between components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'task_progress_updated' && e.newValue) {
        const taskName = e.newValue;
        console.log(`Received task progress update signal for: ${taskName}`);
        triggerPhaseProgressUpdate(taskName);
        // Clear the signal
        localStorage.removeItem('task_progress_updated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [projectName, onProgressUpdated]);

  return {
    triggerPhaseProgressUpdate
  };
};
