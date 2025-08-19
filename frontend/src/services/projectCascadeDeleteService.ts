import { useFrappePostCall } from 'frappe-react-sdk';

export class ProjectCascadeDeleteService {
  static useProjectCascadeDelete() {
    const { call: deleteCall } = useFrappePostCall('frappe.client.delete');
    const { call: getListCall } = useFrappePostCall('frappe.client.get_list');

    const deleteProjectCascade = async (projectName: string) => {
      try {
        console.log(`Starting cascade delete for project: ${projectName}`);
        
        let deletedSubtasks = 0;
        let deletedTasks = 0;
        let deletedPhases = 0;
        
        // Step 1: Get all tasks for this project
        console.log('Step 1: Fetching all tasks...');
        const tasksResponse = await getListCall({
          doctype: 'Task',
          fields: ['name'],
          filters: [['project', '=', projectName]],
          limit_page_length: 1000 // Get all tasks
        });
        
        const tasks = tasksResponse?.message || [];
        console.log(`Found ${tasks.length} tasks to delete`);

        // Step 2: For each task, delete all its subtasks
        for (const task of tasks) {
          console.log(`Step 2: Deleting subtasks for task ${task.name}...`);
          
          const subtasksResponse = await getListCall({
            doctype: 'SubTask',
            fields: ['name'],
            filters: [['task', '=', task.name]],
            limit_page_length: 1000
          });
          
          const subtasks = subtasksResponse?.message || [];
          console.log(`Found ${subtasks.length} subtasks for task ${task.name}`);
          
          // Delete all subtasks for this task
          for (const subtask of subtasks) {
            try {
              console.log(`Deleting subtask: ${subtask.name}`);
              await deleteCall({
                doctype: 'SubTask',
                name: subtask.name
              });
              deletedSubtasks++;
            } catch (error) {
              console.error(`Error deleting subtask ${subtask.name}:`, error);
              // Continue with other subtasks even if one fails
            }
          }
        }

        // Step 3: Delete all tasks
        console.log('Step 3: Deleting all tasks...');
        for (const task of tasks) {
          try {
            console.log(`Deleting task: ${task.name}`);
            await deleteCall({
              doctype: 'Task',
              name: task.name
            });
            deletedTasks++;
          } catch (error) {
            console.error(`Error deleting task ${task.name}:`, error);
            // Continue with other tasks even if one fails
          }
        }

        // Step 4: Get and delete all phases
        console.log('Step 4: Deleting all phases...');
        const phasesResponse = await getListCall({
          doctype: 'project_phase',
          fields: ['name'],
          filters: [['project', '=', projectName]],
          limit_page_length: 1000
        });
        
        const phases = phasesResponse?.message || [];
        console.log(`Found ${phases.length} phases to delete`);
        
        for (const phase of phases) {
          try {
            console.log(`Deleting phase: ${phase.name}`);
            await deleteCall({
              doctype: 'project_phase',
              name: phase.name
            });
            deletedPhases++;
          } catch (error) {
            console.error(`Error deleting phase ${phase.name}:`, error);
            // Continue with other phases even if one fails
          }
        }

        // Step 5: Delete ToDo assignments related to the project
        console.log('Step 5: Deleting ToDo assignments...');
        try {
          const todosResponse = await getListCall({
            doctype: 'ToDo',
            fields: ['name'],
            filters: [
              ['reference_type', 'in', ['Project', 'Task', 'SubTask']],
              ['reference_name', 'like', `%${projectName}%`]
            ],
            limit_page_length: 1000
          });
          
          const todos = todosResponse?.message || [];
          console.log(`Found ${todos.length} ToDo assignments to delete`);
          
          for (const todo of todos) {
            try {
              await deleteCall({
                doctype: 'ToDo',
                name: todo.name
              });
            } catch (error) {
              console.error(`Error deleting ToDo ${todo.name}:`, error);
            }
          }
        } catch (error) {
          console.error('Error fetching/deleting ToDo assignments:', error);
        }

        // Step 6: Delete project users (team members)
        console.log('Step 6: Deleting project users...');
        try {
          const projectUsersResponse = await getListCall({
            doctype: 'Project User',
            fields: ['name'],
            filters: [['parent', '=', projectName]],
            limit_page_length: 1000
          });
          
          const projectUsers = projectUsersResponse?.message || [];
          console.log(`Found ${projectUsers.length} project users to delete`);
          
          for (const projectUser of projectUsers) {
            try {
              await deleteCall({
                doctype: 'Project User',
                name: projectUser.name
              });
            } catch (error) {
              console.error(`Error deleting Project User ${projectUser.name}:`, error);
            }
          }
        } catch (error) {
          console.error('Error fetching/deleting project users:', error);
        }

        // Step 7: Finally, delete the project itself
        console.log('Step 7: Deleting the project...');
        await deleteCall({
          doctype: 'Project',
          name: projectName
        });

        console.log(`Successfully completed cascade delete for project: ${projectName}`);
        
        return {
          success: true,
          deletedItems: {
            subtasks: deletedSubtasks,
            tasks: deletedTasks,
            phases: deletedPhases,
            project: 1
          }
        };

      } catch (error) {
        console.error('Error in cascade delete:', error);
        throw new Error(`Failed to delete project and related items: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    return { deleteProjectCascade };
  }
}

export const { useProjectCascadeDelete } = ProjectCascadeDeleteService;
