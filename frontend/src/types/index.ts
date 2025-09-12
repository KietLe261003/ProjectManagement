export interface Project {
  name: string;
  project_name: string;
  project_type: string;
  status: string;
  customer: string;
  company: string;
  department?: string;
  team?: string;
  expected_start_date: string;
  expected_end_date: string;
  actual_start_date: string;
  actual_end_date: string | null;
  percent_complete: number;
  priority: string;
  estimated_costing: number;
  total_billable_amount: number;
  total_billed_amount: number;
  gross_margin: number;
  estimated_hours: number;
  total_hours: number;
  is_active: boolean;
}

export interface Phase {
  name: string;
  subject?: string; // Tên phase
  project?: string;
  status?: "Open" | "Working" | "Completed";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  department?: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  details?: string;
  costing?: number;
  tasks?: PhaseTask[];
  // Để backward compatibility
  phase_name?: string;
  expected_start_date?: string;
  expected_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string | null;
  description?: string;
}

export interface PhaseTask {
  name: string;
  task?: string; 
  task_name?: string;
}

export interface Task {
  name: string;
  subject: string;
  project: string;
  phase?: string;
  status: string;
  priority: string;
  type: string;
  expected_time: number;
  actual_time: number;
  exp_start_date: string;
  exp_end_date: string;
  progress: number;
  assigned_to: string | null;
  is_group: boolean;
  parent_task_name: string | null;
}

// UI representation of tasks for the TasksPage component
export interface TaskItem {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  status: string;
  priority: string;
  dueDate: string;
  labels: string[];
  todoId: string;
  referenceName: string;
  referenceType: string;
  // Additional fields for Task and SubTask distinction
  type: 'Task' | 'SubTask';
  parentTask?: string; // For SubTasks, this will be the parent task name
  taskProgress?: number; // For Tasks
  expectedTime?: number; // For Tasks
  actualTime?: number; // For Tasks
  startDate?: string;
  endDate?: string;
}

export interface Timesheet {
  name: string;
  employee: string;
  project: string;
  task: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  billable: boolean;
  billing_hours: number;
  billing_rate: number;
  billing_amount: number;
}

export interface FilteredData {
  filteredProjects: Project[];
  filteredPhases: Phase[];
  filteredTasks: TaskItem[];
  filteredTimesheets: Timesheet[];
}

// Export ToDo interface
export type { ToDo } from './Todo/ToDo';
