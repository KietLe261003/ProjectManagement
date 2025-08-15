import { useFrappeCreateDoc, useFrappePostCall } from 'frappe-react-sdk';

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

    const createTaskWithPhase = async (taskData: PhaseTaskData) => {
      try {
        console.log('Creating task with data:', taskData);
        
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

        // Step 2: If phaseId is provided, create Project Phase Task
        if (taskData.phaseId && createdTask) {
          console.log('Linking task to phase:', taskData.phaseId);
          
          const phaseTaskData: ProjectPhaseTaskData = {
            parent: taskData.phaseId,
            parenttype: 'Project Phase',
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
          
          return {
            success: true,
            task: createdTask,
            phaseTask: phaseTaskResult,
            message: 'Task created and linked to phase successfully'
          };
        }

        return {
          success: true,
          task: createdTask,
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
