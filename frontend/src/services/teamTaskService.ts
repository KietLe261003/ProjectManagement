import { useFrappeGetDocList } from 'frappe-react-sdk';
import type { Task } from '@/types/Projects/Task';
import type { SubTask } from '@/types/Todo/SubTask';

export class TeamTaskService {
  // Get all tasks for team members
  static useAllTeamTasks() {
    const { data: allTasks, isLoading: isLoadingTasks, error: tasksError } = useFrappeGetDocList<Task>('Task', {
      fields: [
        'name',
        'subject',
        'description',
        'status',
        'priority',
        'exp_start_date',
        'exp_end_date',
        'project',
        'type',
        'progress',
        'completed_by'
      ],
      limit: 0
    });

    const { data: allSubTasks, isLoading: isLoadingSubTasks, error: subTasksError } = useFrappeGetDocList<SubTask>('SubTask', {
      fields: [
        'name',
        'subject',
        'description',
        'status',
        'start_date',
        'end_date',
        'assigned_to',
        'task'
      ],
      limit: 0
    });

    return {
      allTasks: allTasks || [],
      allSubTasks: allSubTasks || [],
      isLoading: isLoadingTasks || isLoadingSubTasks,
      error: tasksError || subTasksError
    };
  }
}

export const useAllTeamTasks = TeamTaskService.useAllTeamTasks;
