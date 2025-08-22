import { useFrappePostCall } from 'frappe-react-sdk';

export class ProjectCascadeDeleteService {
  static useProjectCascadeDelete() {
    const { call: deleteCall } = useFrappePostCall('frappe.client.delete');
    const { call: getListCall } = useFrappePostCall('frappe.client.get_list');

    const deleteProjectCascade = async (projectName: string) => {
      try {
        console.log(`Starting cascade delete for project: ${projectName}`);
        
        // Validate project exists first
        try {
          const projectResponse = await getListCall({
            doctype: 'Project',
            fields: ['name'],
            filters: [['name', '=', projectName]],
            limit_page_length: 1
          });
          
          if (!projectResponse?.message || projectResponse.message.length === 0) {
            throw new Error(`Project ${projectName} not found`);
          }
        } catch (validationError) {
          console.error('Project validation failed:', validationError);
          throw new Error(`Project validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
        }
        
        let deletedSubtasks = 0;
        let deletedTasks = 0;
        let deletedPhases = 0;
        
        // Step 1: Get all tasks for this project
        console.log('Step 1: Fetching all tasks...');
        let tasks = [];
        try {
          const tasksResponse = await getListCall({
            doctype: 'Task',
            fields: ['name'],
            filters: [['project', '=', projectName]],
            limit_page_length: 1000 // Get all tasks
          });
          
          tasks = tasksResponse?.message || [];
          console.log(`Found ${tasks.length} tasks to delete`);
        } catch (taskFetchError) {
          console.error('Error fetching tasks:', taskFetchError);
          // Continue with deletion even if we can't fetch tasks - they might not exist
          console.log('Continuing with deletion despite task fetch error...');
        }

        // Step 2: For each task, delete all its subtasks
        if (tasks.length > 0) {
          console.log(`Step 2: Processing ${tasks.length} tasks for subtask deletion...`);
          for (const task of tasks) {
            console.log(`Step 2: Deleting subtasks for task ${task.name}...`);
            
            try {
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
                  console.log(`Successfully deleted subtask: ${subtask.name}`);
                  
                  // Small delay to prevent overwhelming the server
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  console.error(`Error deleting subtask ${subtask.name}:`, error);
                  // Continue with other subtasks even if one fails
                }
              }
            } catch (subtaskFetchError) {
              console.error(`Error fetching subtasks for task ${task.name}:`, subtaskFetchError);
              // Continue with other tasks even if subtask fetch fails
            }
          }
          
          // Wait a bit before proceeding to task deletion
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Step 3: Delete all tasks
        if (tasks.length > 0) {
          console.log(`Step 3: Deleting ${tasks.length} tasks...`);
          for (const task of tasks) {
            try {
              console.log(`Deleting task: ${task.name}`);
              await deleteCall({
                doctype: 'Task',
                name: task.name
              });
              deletedTasks++;
              console.log(`Successfully deleted task: ${task.name}`);
              
              // Small delay to prevent overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error deleting task ${task.name}:`, error);
              // Continue with other tasks even if one fails
            }
          }
          
          // Wait a bit before proceeding to phase deletion
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Step 4: Get and delete all phases
        console.log('Step 4: Deleting all phases...');
        let phases = [];
        try {
          const phasesResponse = await getListCall({
            doctype: 'project_phase',
            fields: ['name'],
            filters: [['project', '=', projectName]],
            limit_page_length: 1000
          });
          
          phases = phasesResponse?.message || [];
          console.log(`Found ${phases.length} phases to delete`);
        } catch (phaseFetchError) {
          console.error('Error fetching phases:', phaseFetchError);
          // Continue with deletion even if we can't fetch phases
          console.log('Continuing with deletion despite phase fetch error...');
        }
        
        for (const phase of phases) {
          try {
            console.log(`Deleting phase: ${phase.name}`);
            await deleteCall({
              doctype: 'project_phase',
              name: phase.name
            });
            deletedPhases++;
            console.log(`Successfully deleted phase: ${phase.name}`);
            
            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error deleting phase ${phase.name}:`, error);
            // Continue with other phases even if one fails
          }
        }
        
        if (phases.length > 0) {
          // Wait a bit before proceeding to other deletions
          await new Promise(resolve => setTimeout(resolve, 500));
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

        // Step 6.5: Comprehensive dependency check and cleanup
        console.log('Step 6.5: Performing comprehensive dependency cleanup...');
        
        // Check for any remaining dependencies that might prevent project deletion
        const dependencyChecks = [
          { doctype: 'Task', filter: [['project', '=', projectName]] },
          { doctype: 'SubTask', filter: [['project', '=', projectName]] },
          { doctype: 'project_phase', filter: [['project', '=', projectName]] },
          { doctype: 'Project User', filter: [['parent', '=', projectName]] },
          { doctype: 'ToDo', filter: [['reference_type', '=', 'Project'], ['reference_name', '=', projectName]] },
          { doctype: 'ToDo', filter: [['reference_type', '=', 'Task'], ['reference_name', 'like', `%${projectName}%`]] },
          // Add more potential dependencies
          { doctype: 'Communication', filter: [['reference_doctype', '=', 'Project'], ['reference_name', '=', projectName]] },
          { doctype: 'File', filter: [['attached_to_doctype', '=', 'Project'], ['attached_to_name', '=', projectName]] },
          { doctype: 'Comment', filter: [['reference_doctype', '=', 'Project'], ['reference_name', '=', projectName]] },
        ];
        
        for (const check of dependencyChecks) {
          try {
            console.log(`Checking for remaining ${check.doctype} dependencies...`);
            const remainingResponse = await getListCall({
              doctype: check.doctype,
              fields: ['name'],
              filters: check.filter,
              limit_page_length: 1000
            });
            
            const remainingItems = remainingResponse?.message || [];
            if (remainingItems.length > 0) {
              console.log(`Found ${remainingItems.length} remaining ${check.doctype} items, deleting them...`);
              for (const item of remainingItems) {
                try {
                  await deleteCall({
                    doctype: check.doctype,
                    name: item.name
                  });
                  console.log(`Deleted remaining ${check.doctype}: ${item.name}`);
                  // Small delay between deletions
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (deleteError) {
                  console.error(`Error deleting remaining ${check.doctype} ${item.name}:`, deleteError);
                  // Continue with other items
                }
              }
            } else {
              console.log(`No remaining ${check.doctype} dependencies found.`);
            }
          } catch (checkError) {
            console.error(`Error checking ${check.doctype} dependencies:`, checkError);
            // Continue with other checks
          }
        }
        
        // Wait a bit after comprehensive cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 7: Finally, delete the project itself
        console.log('Step 7: Deleting the project...');
        
        // Wait a bit before deleting the project to ensure all related items are fully deleted
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to delete the project with retries
        let projectDeleteAttempts = 0;
        const maxProjectDeleteAttempts = 3;
        
        while (projectDeleteAttempts < maxProjectDeleteAttempts) {
          try {
            projectDeleteAttempts++;
            console.log(`Attempting to delete project ${projectName} (attempt ${projectDeleteAttempts}/${maxProjectDeleteAttempts})`);
            
            await deleteCall({
              doctype: 'Project',
              name: projectName
            });
            
            // Verify the project was actually deleted
            console.log(`Verifying project ${projectName} deletion...`);
            try {
              const verifyResponse = await getListCall({
                doctype: 'Project',
                fields: ['name'],
                filters: [['name', '=', projectName]],
                limit_page_length: 1
              });
              
              if (verifyResponse?.message && verifyResponse.message.length > 0) {
                // Project still exists, this attempt failed
                throw new Error('Project still exists after deletion attempt');
              } else {
                console.log(`Successfully verified project ${projectName} deletion`);
              }
            } catch (verifyError: any) {
              if (verifyError.message === 'Project still exists after deletion attempt') {
                throw verifyError; // Re-throw our custom error
              }
              // If verification fails due to project not found, that's actually good
              console.log(`Project ${projectName} not found during verification - deletion successful`);
            }
            
            console.log(`Successfully deleted project: ${projectName}`);
            break; // Success, exit the retry loop
            
          } catch (projectDeleteError: any) {
            console.error(`Error deleting project ${projectName} (attempt ${projectDeleteAttempts}):`, projectDeleteError);
            
            // If this is not the last attempt, wait and try again
            if (projectDeleteAttempts < maxProjectDeleteAttempts) {
              console.log(`Waiting before retry attempt ${projectDeleteAttempts + 1}...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
              
              // Try to clean up any remaining dependencies before retrying
              console.log('Attempting to clean up remaining dependencies...');
              
              // Check for any remaining project users that might have been missed
              try {
                const remainingProjectUsersResponse = await getListCall({
                  doctype: 'Project User',
                  fields: ['name'],
                  filters: [['parent', '=', projectName]],
                  limit_page_length: 1000
                });
                
                const remainingProjectUsers = remainingProjectUsersResponse?.message || [];
                if (remainingProjectUsers.length > 0) {
                  console.log(`Found ${remainingProjectUsers.length} remaining project users, deleting them...`);
                  for (const projectUser of remainingProjectUsers) {
                    try {
                      await deleteCall({
                        doctype: 'Project User',
                        name: projectUser.name
                      });
                      console.log(`Deleted remaining project user: ${projectUser.name}`);
                    } catch (cleanupError) {
                      console.error(`Error deleting remaining project user ${projectUser.name}:`, cleanupError);
                    }
                  }
                }
              } catch (cleanupError) {
                console.error('Error during dependency cleanup:', cleanupError);
              }
              
              // Check for any remaining todos
              try {
                const remainingTodosResponse = await getListCall({
                  doctype: 'ToDo',
                  fields: ['name'],
                  filters: [
                    ['reference_type', '=', 'Project'],
                    ['reference_name', '=', projectName]
                  ],
                  limit_page_length: 1000
                });
                
                const remainingTodos = remainingTodosResponse?.message || [];
                if (remainingTodos.length > 0) {
                  console.log(`Found ${remainingTodos.length} remaining todos, deleting them...`);
                  for (const todo of remainingTodos) {
                    try {
                      await deleteCall({
                        doctype: 'ToDo',
                        name: todo.name
                      });
                      console.log(`Deleted remaining todo: ${todo.name}`);
                    } catch (cleanupError) {
                      console.error(`Error deleting remaining todo ${todo.name}:`, cleanupError);
                    }
                  }
                }
              } catch (cleanupError) {
                console.error('Error during todo cleanup:', cleanupError);
              }
              
            } else {
              // Last attempt failed, extract detailed error information
              let detailedError = 'Unknown project deletion error';
              
              if (projectDeleteError && typeof projectDeleteError === 'object') {
                // Log the full error object for debugging
                console.error('Full project deletion error object:', JSON.stringify(projectDeleteError, null, 2));
                
                // Try to extract meaningful error message
                if (projectDeleteError.message) {
                  detailedError = projectDeleteError.message;
                } else if (projectDeleteError.exc) {
                  detailedError = projectDeleteError.exc;
                } else if (projectDeleteError._server_messages) {
                  try {
                    const serverMsgs = JSON.parse(projectDeleteError._server_messages);
                    if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
                      const parsed = JSON.parse(serverMsgs[0]);
                      detailedError = parsed.message || detailedError;
                    }
                  } catch (parseError) {
                    console.error('Error parsing server messages:', parseError);
                  }
                } else {
                  detailedError = JSON.stringify(projectDeleteError);
                }
              } else if (typeof projectDeleteError === 'string') {
                detailedError = projectDeleteError;
              }
              
              throw new Error(`Failed to delete project ${projectName} after ${maxProjectDeleteAttempts} attempts: ${detailedError}`);
            }
          }
        }

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
        
        // Provide more detailed error information
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          // Try to extract error message from various error formats
          errorMessage = (error as any).message || 
                        (error as any).error || 
                        (error as any).exc || 
                        JSON.stringify(error);
        }
        
        throw new Error(`Failed to delete project and related items: ${errorMessage}`);
      }
    };

    return { deleteProjectCascade };
  }
}

export const { useProjectCascadeDelete } = ProjectCascadeDeleteService;
