import { useFrappeUpdateDoc, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeGetDoc } from 'frappe-react-sdk';

export interface TaskUpdateData {
  subject?: string;
  status?: string;
  priority?: string;
  exp_start_date?: string;
  exp_end_date?: string;
  progress?: number;
  description?: string;
  assign_to?: string;
}

export interface TaskServiceResponse<T> {
  data?: T;
  isLoading: boolean;
  error?: any;
}

// Task Service Class
export class TaskService {
  // Update task using useFrappeUpdateDoc
  static useUpdateTask() {
    const { updateDoc, loading, error } = useFrappeUpdateDoc();

    const updateTask = async (taskName: string, taskData: Partial<TaskUpdateData>) => {
      // Remove assign_to from task data as it's not a Task field
      const { assign_to, ...taskFields } = taskData;
      
      return await updateDoc("Task", taskName, {
        ...taskFields,
        exp_start_date: taskFields.exp_start_date || undefined,
        exp_end_date: taskFields.exp_end_date || undefined,
      });
    };

    return {
      updateTask,
      isLoading: loading,
      error
    };
  }

  // Create/Update/Delete ToDo for task assignment
  static useTaskAssignment() {
    const { createDoc } = useFrappeCreateDoc();
    const { deleteDoc } = useFrappeDeleteDoc();
    const { data: currentUser } = useFrappeGetDoc('User', '', {
      shouldFetch: true
    });

    const assignTask = async (taskName: string, taskSubject: string, allocatedTo: string, priority: string = 'Medium') => {
      return await createDoc('ToDo', {
        allocated_to: allocatedTo,
        assigned_by: currentUser?.name || '',
        description: `Task: ${taskSubject}`,
        reference_type: 'Task',
        reference_name: taskName,
        status: 'Open',
        priority: priority,
        date: new Date().toISOString().split('T')[0]
      });
    };

    const unassignTask = async (todoName: string) => {
      return await deleteDoc('ToDo', todoName);
    };

    return {
      assignTask,
      unassignTask
    };
  }
}

// Export hooks for easier usage
export const useUpdateTask = TaskService.useUpdateTask;
export const useTaskAssignment = TaskService.useTaskAssignment;
