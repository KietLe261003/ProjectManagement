import { useFrappeCreateDoc, useFrappePostCall, useFrappeGetDoc } from 'frappe-react-sdk';

export interface PhaseTaskData {
  subject: string;
  description?: string;
  priority: string;
  status: string;
  type: string;
  expected_time: number;
  task_weight: number;
  project: string;
  phaseId?: string;
  assign_to?: string; // Added assign_to field
}

export interface ProjectPhaseTaskData {
  parent: string;
  parenttype: string;
  parentfield: string;
  task: string;
  task_name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

// Phase Task Service for managing phase-related task operations
export class PhaseTaskService {
  
  // Create task and optionally link to phase
  static useCreatePhaseTask() {
    const { createDoc, loading: taskLoading } = useFrappeCreateDoc();
    const { call: insertCall } = useFrappePostCall('frappe.client.insert');
    const { call: saveCall } = useFrappePostCall('frappe.client.save');
    const { data: currentUser } = useFrappeGetDoc('User', '', {
      shouldFetch: true
    });

    const createTaskWithPhase = async (taskData: PhaseTaskData) => {
      try {
        
        // Step 1: Create the Task first
        const createdTask = await createDoc('Task', {
          subject: taskData.subject,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          type: taskData.type,
          expected_time: taskData.expected_time,
          task_weight: taskData.task_weight,
          project: taskData.project
        });

        console.log('Task created successfully:', createdTask);

        // Step 1.5: Create ToDo if assign_to is provided
        let todoResult = null;
        if (taskData.assign_to && createdTask) {
          try {
            todoResult = await insertCall({
              doc: {
                doctype: 'ToDo',
                allocated_to: taskData.assign_to,
                assigned_by: currentUser?.name || '',
                description: `Task: ${taskData.subject}`,
                reference_type: 'Task',
                reference_name: createdTask.name,
                status: 'Open',
                priority: taskData.priority,
                date: new Date().toISOString().split('T')[0] // Today's date
              }
            });
            console.log('ToDo created successfully:', todoResult);
          } catch (todoError) {
            console.error('Error creating ToDo:', todoError);
            // Don't fail the entire operation if ToDo creation fails
          }
        }

        // Step 2: If phaseId is provided, create Project Phase Task
        if (taskData.phaseId && createdTask) {
          
          const phaseTaskData: ProjectPhaseTaskData = {
            parent: taskData.phaseId,
            parenttype: 'project_phase',
            parentfield: 'tasks',
            task: createdTask.name,
            task_name: createdTask.subject,
            status: createdTask.status,
            start_date: createdTask.exp_start_date,
            end_date: createdTask.exp_end_date,
            description: createdTask.description
          };

          const phaseTaskResult = await insertCall({
            doc: {
              doctype: 'Project Phase Task',
              ...phaseTaskData
            }
          });

          console.log('Project Phase Task created successfully:', phaseTaskResult);
          
          // Force save parent document to ensure child table is committed
          try {
            console.log('Saving parent phase document to commit child table changes...');
            const saveResult = await saveCall({
              doc: {
                doctype: 'project_phase',
                name: taskData.phaseId
              }
            });
            console.log('Parent phase saved successfully:', saveResult);
          } catch (saveError) {
            console.warn('Failed to save parent phase, but child was created:', saveError);
          }
          
          return {
            success: true,
            task: createdTask,
            phaseTask: phaseTaskResult,
            todo: todoResult,
            message: 'Task created and linked to phase successfully'
          };
        }

        return {
          success: true,
          task: createdTask,
          todo: todoResult,
          message: 'Task created successfully'
        };

      } catch (error) {
        console.error('Error in createTaskWithPhase:', error);
        
        if (error instanceof Error) {
          return {
            success: false,
            error: error.message,
            message: 'Failed to create task'
          };
        }
        
        return {
          success: false,
          error: 'Unknown error occurred',
          message: 'Failed to create task'
        };
      }
    };

    return {
      createTaskWithPhase,
      isLoading: taskLoading
    };
  }

  // Create only Project Phase Task (for existing tasks)
  static useLinkTaskToPhase() {
    const { call: insertCall } = useFrappePostCall('frappe.client.insert');

    const linkTaskToPhase = async (taskName: string, phaseId: string, additionalData?: Partial<ProjectPhaseTaskData>) => {
      try {
        const phaseTaskData: ProjectPhaseTaskData = {
          parent: phaseId,
          parenttype: 'Project Phase',
          parentfield: 'tasks',
          task: taskName,
          task_name: additionalData?.task_name || taskName,
          status: additionalData?.status || 'Open',
          start_date: additionalData?.start_date,
          end_date: additionalData?.end_date,
          description: additionalData?.description
        };

        const result = await insertCall({
          doc: {
            doctype: 'Project Phase Task',
            ...phaseTaskData
          }
        });

        return {
          success: true,
          phaseTask: result,
          message: 'Task linked to phase successfully'
        };

      } catch (error) {
        console.error('Error linking task to phase:', error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to link task to phase'
        };
      }
    };

    return {
      linkTaskToPhase
    };
  }
}

// Export hooks for easier usage
export const useCreatePhaseTask = PhaseTaskService.useCreatePhaseTask;
export const useLinkTaskToPhase = PhaseTaskService.useLinkTaskToPhase;
