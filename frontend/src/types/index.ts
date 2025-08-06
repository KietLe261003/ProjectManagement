export interface Project {
  name: string;
  project_name: string;
  project_type: string;
  status: string;
  customer: string;
  company: string;
  expected_start_date: string;
  expected_end_date: string;
  actual_start_date: string;
  actual_end_date: string | null;
  percent_complete: number;
  priority: string;
  project_cost: number;
  total_billable_amount: number;
  total_billed_amount: number;
  gross_margin: number;
  estimated_hours: number;
  total_hours: number;
  is_active: boolean;
}

export interface Task {
  name: string;
  subject: string;
  project: string;
  status: string;
  priority: string;
  type: string;
  expected_time: number;
  actual_time: number;
  start_date: string;
  end_date: string;
  progress: number;
  assigned_to: string | null;
  is_group: boolean;
  parent_task_name: string | null;
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
  filteredTasks: Task[];
  filteredTimesheets: Timesheet[];
}
