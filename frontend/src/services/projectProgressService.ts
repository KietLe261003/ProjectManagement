import { useFrappeUpdateDoc } from 'frappe-react-sdk';

export class ProjectProgressService {
  // Calculate project progress from phases
  static useProjectProgressFromPhases() {
    const { updateDoc } = useFrappeUpdateDoc();

    const calculateAndUpdateProjectProgressFromPhases = async (projectName: string) => {
      try {
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
            fields: ['name', 'progress'],
            filters: [['project', '=', projectName]],
          })
        });

        if (!phasesResponse.ok) {
          throw new Error(`HTTP error! status: ${phasesResponse.status}`);
        }

        const phasesResult = await phasesResponse.json();
        const phases = phasesResult.message || [];

        if (!phases || phases.length === 0) {
          // No phases - calculate from tasks directly
          const { calculateAndUpdateProjectProgressFromTasks } = ProjectProgressService.useProjectProgressFromTasks();
          return await calculateAndUpdateProjectProgressFromTasks(projectName);
        }

        // Calculate average progress of all phases
        let totalProgress = 0;
        phases.forEach((phase: any) => {
          totalProgress += (phase.progress || 0);
        });

        const averageProgress = Math.round(totalProgress / phases.length);

        // Update project progress
        await updateDoc('Project', projectName, {
          percent_complete: averageProgress
        });
        
        return averageProgress;
      } catch (error) {
        console.error('Error calculating project progress from phases:', error);
        return null;
      }
    };

    return { calculateAndUpdateProjectProgressFromPhases };
  }

  // Calculate project progress from tasks (when no phases)
  static useProjectProgressFromTasks() {
    const { updateDoc } = useFrappeUpdateDoc();

    const calculateAndUpdateProjectProgressFromTasks = async (projectName: string) => {
      try {
        // Get all tasks for this project
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
            filters: [['project', '=', projectName]],
          })
        });

        if (!tasksResponse.ok) {
          throw new Error(`HTTP error! status: ${tasksResponse.status}`);
        }

        const tasksResult = await tasksResponse.json();
        const tasks = tasksResult.message || [];

        if (!tasks || tasks.length === 0) {
          // No tasks - project progress should be 0
          await updateDoc('Project', projectName, {
            percent_complete: 0
          });
          return 0;
        }

        // Calculate average progress of all tasks
        let totalProgress = 0;
        tasks.forEach((task: any) => {
          totalProgress += (task.progress || 0);
        });

        const averageProgress = Math.round(totalProgress / tasks.length);

        // Update project progress
        await updateDoc('Project', projectName, {
          percent_complete: averageProgress
        });
        
       
        return averageProgress;
      } catch (error) {
        console.error('Error calculating project progress from tasks:', error);
        return null;
      }
    };

    return { calculateAndUpdateProjectProgressFromTasks };
  }

  // Comprehensive project progress calculation (tries phases first, then tasks)
  static useProjectProgressCalculation() {
    const { updateDoc } = useFrappeUpdateDoc();

    const calculateAndUpdateProjectProgress = async (projectName: string) => {
      try {
        
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
            fields: ['name', 'progress'],
            filters: [['project', '=', projectName]],
          })
        });

        if (!phasesResponse.ok) {
          throw new Error(`HTTP error! status: ${phasesResponse.status}`);
        }

        const phasesResult = await phasesResponse.json();
        const phases = phasesResult.message || [];
        console.log('Found phases:', phases.length);

        // Get all tasks for this project
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
            filters: [['project', '=', projectName]],
          })
        });

        if (!tasksResponse.ok) {
          throw new Error(`HTTP error! status: ${tasksResponse.status}`);
        }

        const tasksResult = await tasksResponse.json();
        const tasks = tasksResult.message || [];
        console.log('Found tasks:', tasks.length);

        // If we have phases, use mixed calculation (phases + standalone tasks)
        if (phases && phases.length > 0) {
          // Get full phase documents to check which tasks belong to phases
          const phaseTaskMapping: string[] = [];
          
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
                if (phaseDoc.data.tasks && phaseDoc.data.tasks.length > 0) {
                  phaseDoc.data.tasks.forEach((phaseTask: any) => {
                    if (phaseTask.task) {
                      phaseTaskMapping.push(phaseTask.task);
                    }
                  });
                }
              }
            } catch (error) {
              console.warn('Error fetching phase document:', phase.name, error);
            }
          }

          console.log('Tasks in phases:', phaseTaskMapping);

          // Find standalone tasks (tasks not in any phase)
          const standaloneTasks = tasks.filter((task: any) => 
            !phaseTaskMapping.includes(task.name)
          );
          
          console.log('Standalone tasks:', standaloneTasks.length);

          // Calculate progress: Average of phase progress + standalone task progress
          let totalProgress = 0;
          let totalComponents = 0;

          // Add phase progress
          phases.forEach((phase: any) => {
            const phaseProgress = phase.progress || 0;
            console.log(`Phase ${phase.name}: ${phaseProgress}%`);
            totalProgress += phaseProgress;
            totalComponents += 1;
          });

          // Add standalone task progress
          standaloneTasks.forEach((task: any) => {
            const taskProgress = task.progress || 0;
            console.log(`Standalone Task ${task.name}: ${taskProgress}%`);
            totalProgress += taskProgress;
            totalComponents += 1;
          });

          console.log(`Total components: ${totalComponents}, Total progress: ${totalProgress}`);

          const averageProgress = totalComponents > 0 ? Math.round(totalProgress / totalComponents) : 0;
          console.log(`Calculated average progress: ${averageProgress}%`);

          await updateDoc('Project', projectName, {
            percent_complete: averageProgress
          });
          
          return { 
            progress: averageProgress, 
            source: 'mixed', 
            count: totalComponents,
            phases: phases.length,
            standaloneTasks: standaloneTasks.length
          };
        } else if (tasks && tasks.length > 0) {
          // No phases - calculate from all tasks
          console.log('No phases found, calculating from all tasks');
          
          let totalProgress = 0;
          tasks.forEach((task: any) => {
            totalProgress += (task.progress || 0);
          });

          const averageProgress = Math.round(totalProgress / tasks.length);
          console.log(`Task-based progress: ${averageProgress}%`);

          await updateDoc('Project', projectName, {
            percent_complete: averageProgress
          });
          
          return { progress: averageProgress, source: 'tasks', count: tasks.length };
        } else {
          // No phases and no tasks
          console.log('No phases or tasks found');
          
          await updateDoc('Project', projectName, {
            percent_complete: 0
          });
          
          return { progress: 0, source: 'none', count: 0 };
        }
      } catch (error) {
        console.error('Error calculating project progress:', error);
        return null;
      }
    };

    return { calculateAndUpdateProjectProgress };
  }

  // Update project progress based on status
  static useProjectStatusProgressUpdate() {
    const { updateDoc } = useFrappeUpdateDoc();

    const updateProjectProgressByStatus = async (projectName: string, status: string, currentProgress?: number) => {
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

        await updateDoc('Project', projectName, {
          status: status,
          percent_complete: newProgress
        });

        return newProgress;
      } catch (error) {
        console.error('Error updating project progress by status:', error);
        return null;
      }
    };

    return { updateProjectProgressByStatus };
  }
}

export const { 
  useProjectProgressFromPhases,
  useProjectProgressFromTasks,
  useProjectProgressCalculation,
  useProjectStatusProgressUpdate
} = ProjectProgressService;
