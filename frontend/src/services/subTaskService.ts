import { useFrappeUpdateDoc, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeGetDoc } from 'frappe-react-sdk';

export class SubTaskService {
  static useUpdateSubTask() {
    const { updateDoc, loading: isLoading, error } = useFrappeUpdateDoc();
    
    const updateSubTask = async (name: string, data: any) => {
      return await updateDoc('SubTask', name, data);
    };
    
    return { updateSubTask, isLoading, error };
  }
  
  static useSubTaskAssignment() {
    const { createDoc } = useFrappeCreateDoc();
    const { deleteDoc } = useFrappeDeleteDoc();
    const { data: currentUser } = useFrappeGetDoc('User', '', {
      shouldFetch: true
    });
    
    const assignSubTask = async (subTaskName: string, allocatedTo: string) => {
      return await createDoc('ToDo', {
        allocated_to: allocatedTo,
        assigned_by: currentUser?.name || '',
        reference_type: 'SubTask',
        reference_name: subTaskName,
        description: `Assignment for SubTask: ${subTaskName}`,
        status: 'Open',
      });
    };
    
    const unassignSubTask = async (toDoName: string) => {
      return await deleteDoc('ToDo', toDoName);
    };
    
    return { assignSubTask, unassignSubTask };
  }
}

export const { useUpdateSubTask, useSubTaskAssignment } = SubTaskService;
