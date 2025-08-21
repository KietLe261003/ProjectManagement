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
        
        console.log(`Project ${projectName} progress updated to ${averageProgress}% (from ${phases.length} phases)`);
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
          console.log(`Project ${projectName} progress updated to 0% (no tasks)`);
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
        
        console.log(`Project ${projectName} progress updated to ${averageProgress}% (from ${tasks.length} tasks)`);
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
        // First, check if project has phases
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

        if (phases && phases.length > 0) {
          // Calculate from phases
          let totalProgress = 0;
          phases.forEach((phase: any) => {
            totalProgress += (phase.progress || 0);
          });

          const averageProgress = Math.round(totalProgress / phases.length);

          await updateDoc('Project', projectName, {
            percent_complete: averageProgress
          });
          
          console.log(`Project ${projectName} progress updated to ${averageProgress}% (from ${phases.length} phases)`);
          return { progress: averageProgress, source: 'phases', count: phases.length };
        } else {
          // Calculate from tasks directly
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
            await updateDoc('Project', projectName, {
              percent_complete: 0
            });
            console.log(`Project ${projectName} progress updated to 0% (no tasks)`);
            return { progress: 0, source: 'none', count: 0 };
          }

          let totalProgress = 0;
          tasks.forEach((task: any) => {
            totalProgress += (task.progress || 0);
          });

          const averageProgress = Math.round(totalProgress / tasks.length);

          await updateDoc('Project', projectName, {
            percent_complete: averageProgress
          });
          
          console.log(`Project ${projectName} progress updated to ${averageProgress}% (from ${tasks.length} tasks)`);
          return { progress: averageProgress, source: 'tasks', count: tasks.length };
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
