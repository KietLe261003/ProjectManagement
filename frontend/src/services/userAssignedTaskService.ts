import {
  useFrappeGetDocList,
  useFrappeAuth,
} from "frappe-react-sdk";
import type { Task } from "../types/Projects/Task";
import type { SubTask } from "../types/Todo/SubTask";
import type { ToDo } from "../types/Desk/ToDo";

export interface EnrichedTask extends Task {
  project_name?: string;
  assignedTodo?: ToDo;
}

export interface EnrichedSubTask extends SubTask {
  task_subject?: string;
  project_name?: string;
  assignedTodo?: ToDo;
}

export interface UserAssignedTasksData {
  tasks: EnrichedTask[];
  subTasks: EnrichedSubTask[];
  todos: ToDo[];
  isLoading: boolean;
  error?: any;
  mutate: () => void;
  currentUser?: any;
}

export class UserAssignedTaskService {
  // Get all tasks and subtasks assigned to current user
  static useUserAssignedTasks(): UserAssignedTasksData {
    const { currentUser } = useFrappeAuth();

    // Get all ToDos assigned to current user
    const {
      data: todos,
      isLoading: todosLoading,
      error: todosError,
      mutate: mutateTodos,
    } = useFrappeGetDocList<ToDo>(
      "ToDo",
      {
        fields: [
          "name",
          "status",
          "priority",
          "date",
          "allocated_to",
          "description",
          "reference_type",
          "reference_name",
          "assigned_by",
          "assigned_by_full_name",
          "creation",
          "modified",
        ],
        filters: [["allocated_to", "=", currentUser || ""]],
        orderBy: {
          field: "creation",
          order: "desc",
        },
        limit: 0,
      },
      currentUser ? "user-assigned-todos" : null
    );

    // Extract Task reference names
    const taskTodos = (todos || []).filter(
      (todo) => todo.reference_type === "Task"
    );
    const taskNames = taskTodos
      .map((todo) => todo.reference_name)
      .filter(Boolean) as string[];

    // Extract SubTask reference names
    const subTaskTodos = (todos || []).filter(
      (todo) => todo.reference_type === "SubTask"
    );
    const subTaskNames = subTaskTodos
      .map((todo) => todo.reference_name)
      .filter(Boolean) as string[];

    // Get Tasks details
    const {
      data: tasks,
      isLoading: tasksLoading,
      error: tasksError,
    } = useFrappeGetDocList<Task>(
      "Task",
      {
        fields: [
          "name",
          "subject",
          "project",
          "status",
          "priority",
          "type",
          "expected_time",
          "actual_time",
          "exp_start_date",
          "exp_end_date",
          "progress",
          "is_group",
          "parent_task",
          "description",
          "company",
          "department",
        ],
        filters:
          taskNames.length > 0
            ? [["name", "in", taskNames]]
            : [["name", "=", "nonexistent"]], // Prevent loading all tasks if no assigned tasks
        limit: 0,
      },
      taskNames.length > 0 ? "user-assigned-tasks" : null
    );

    // Get SubTasks details
    const {
      data: subTasks,
      isLoading: subTasksLoading,
      error: subTasksError,
    } = useFrappeGetDocList<SubTask>(
      "SubTask",
      {
        fields: [
          "name",
          "subject",
          "task",
          "status",
          "start_date",
          "end_date",
          "description",
          "assigned_to",
        ],
        filters:
          subTaskNames.length > 0
            ? [["name", "in", subTaskNames]]
            : [["name", "=", "nonexistent"]], // Prevent loading all subtasks if no assigned subtasks
        limit: 0,
      },
      subTaskNames.length > 0 ? "user-assigned-subtasks" : null
    );

    // Get unique parent task names from subtasks to fetch their details
    const parentTaskNames = [
      ...new Set((subTasks || []).map((st) => st.task).filter(Boolean)),
    ] as string[];

    // Get parent task details for subtasks
    const { data: parentTasks } = useFrappeGetDocList<Task>(
      "Task",
      {
        fields: ["name", "subject", "project"],
        filters:
          parentTaskNames.length > 0
            ? [["name", "in", parentTaskNames]]
            : [["name", "=", "nonexistent"]],
        limit: 0,
      },
      parentTaskNames.length > 0 ? "parent-tasks-for-subtasks" : null
    );

    // Get unique project names
    const projectNames = [
      ...new Set([
        ...(tasks || []).map((task) => task.project).filter(Boolean),
        ...(parentTasks || []).map((task) => task.project).filter(Boolean),
      ]),
    ] as string[];

    // Get project details
    const { data: projects } = useFrappeGetDocList(
      "Project",
      {
        fields: ["name", "project_name"],
        filters:
          projectNames.length > 0
            ? [["name", "in", projectNames]]
            : [["name", "=", "nonexistent"]],
        limit: 0,
      },
      projectNames.length > 0 ? "projects-for-assigned-tasks" : null
    );

    // Create project name mapping
    const projectNameMap = (projects || []).reduce(
      (acc: Record<string, string>, project: any) => {
        acc[project.name] = project.project_name || project.name;
        return acc;
      },
      {}
    );

    // Create parent task mapping
    const parentTaskMap = (parentTasks || []).reduce(
      (acc: Record<string, Task>, task: Task) => {
        acc[task.name] = task;
        return acc;
      },
      {}
    );

    // Create todo mapping
    const todoMap = (todos || []).reduce(
      (acc: Record<string, ToDo>, todo: ToDo) => {
        if (todo.reference_name) {
          acc[todo.reference_name] = todo;
        }
        return acc;
      },
      {}
    );

    // Enrich tasks with project names and todo info
    const enrichedTasks: EnrichedTask[] = (tasks || []).map((task) => ({
      ...task,
      project_name: task.project ? projectNameMap[task.project] : undefined,
      assignedTodo: todoMap[task.name],
    }));

    // Enrich subtasks with task and project info
    const enrichedSubTasks: EnrichedSubTask[] = (subTasks || []).map(
      (subTask) => {
        const parentTask = subTask.task
          ? parentTaskMap[subTask.task]
          : undefined;
        return {
          ...subTask,
          task_subject: parentTask?.subject,
          project_name: parentTask?.project
            ? projectNameMap[parentTask.project]
            : undefined,
          assignedTodo: todoMap[subTask.name],
        };
      }
    );

    const isLoading = todosLoading || tasksLoading || subTasksLoading;
    const error = todosError || tasksError || subTasksError;

    const mutate = () => {
      mutateTodos();
    };

    return {
      tasks: enrichedTasks,
      subTasks: enrichedSubTasks,
      todos: todos || [],
      isLoading,
      error,
      mutate,
      currentUser,
    };
  }
  //getRoleOfTeam
  static getRoleOfTeam(): "Leader" | "Member" | null {
    return "Leader";
  }
}

// Export hook for easier usage
export const useUserAssignedTasks =
  UserAssignedTaskService.useUserAssignedTasks;
export const useUserRoleOfTeam = UserAssignedTaskService.getRoleOfTeam;
