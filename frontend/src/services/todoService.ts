import { useFrappeGetDocList, useFrappeGetDoc, useFrappeGetCall } from 'frappe-react-sdk';
import type { ToDo } from '../types/Desk/ToDo';

export interface TodoWithTask extends ToDo {
  task_subject?: string;
  task_status?: string;
  task_priority?: string;
  task_exp_start_date?: string;
  task_exp_end_date?: string;
  task_description?: string;
  project_name?: string;
  assigned_to_full_name?: string;
}

export class TodoService {
  // Get all ToDos assigned to current user
  static useUserTodos() {
    const { data: currentUser } = useFrappeGetDoc('User', '', {
      shouldFetch: true
    });

    const { data: todos, isLoading, error, mutate } = useFrappeGetDocList<TodoWithTask>(
      'ToDo',
      {
        fields: [
          'name',
          'status',
          'priority',
          'date',
          'allocated_to',
          'description',
          'reference_type',
          'reference_name',
          'assigned_by',
          'assigned_by_full_name',
          'creation',
          'modified'
        ],
        filters: [
          ['allocated_to', '=', currentUser?.name || ''],
          ['reference_type', '=', 'Task']
        ],
        orderBy: {
          field: 'creation',
          order: 'desc'
        }
      },
      currentUser?.name ? 'user-todos' : null
    );

    return {
      todos: todos || [],
      isLoading,
      error,
      mutate,
      currentUser
    };
  }

  // Get ToDos with enriched task and project data using server-side method
  static useUserTodosEnriched() {
    const { data: currentUser } = useFrappeGetDoc('User', '', {
      shouldFetch: true
    });

    const { data: enrichedTodos, isLoading, error, mutate } = useFrappeGetCall<{ message: TodoWithTask[] }>(
      'todo.api.get_user_todos_with_task_info',
      {
        user: currentUser?.name || ''
      },
      currentUser?.name ? 'user-todos-enriched' : null,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false
      }
    );

    return {
      todos: enrichedTodos?.message || [],
      isLoading,
      error,
      mutate,
      currentUser
    };
  }

  // Get ToDos with enriched task data (fallback method using client-side enrichment)
  static useUserTodosWithTaskData() {
    const { todos, isLoading: todosLoading, error: todosError, mutate, currentUser } = TodoService.useUserTodos();
    
    // Get task details for each todo
    const enrichedTodos = todos.map(todo => {
      if (todo.reference_type === 'Task' && todo.reference_name) {
        // This would need to be implemented with proper task fetching
        // For now, we'll return the todo as is
        return todo;
      }
      return todo;
    });

    return {
      todos: enrichedTodos,
      isLoading: todosLoading,
      error: todosError,
      mutate,
      currentUser
    };
  }
}

// Export hooks for easier usage
export const useUserTodos = TodoService.useUserTodos;
export const useUserTodosEnriched = TodoService.useUserTodosEnriched;
export const useUserTodosWithTaskData = TodoService.useUserTodosWithTaskData;
