import { useFrappeAuth, useFrappeGetDocList } from "frappe-react-sdk";
import type { Task } from "@/types/Projects/Task";
import type { SubTask } from "@/types/Todo/SubTask";
import type { Project } from "@/types";
import type { Team } from "@/types/Todo/Team";

export class TeamTaskService {
  // Get all tasks for team members
  static useAllTeamTasks() {
    const {
      data: allTasks,
      isLoading: isLoadingTasks,
      error: tasksError,
    } = useFrappeGetDocList<Task>("Task", {
      fields: [
        "name",
        "subject",
        "description",
        "status",
        "priority",
        "exp_start_date",
        "exp_end_date",
        "project",
        "type",
        "progress",
        "completed_by",
      ],
      limit: 0,
    });

    const {
      data: allSubTasks,
      isLoading: isLoadingSubTasks,
      error: subTasksError,
    } = useFrappeGetDocList<SubTask>("SubTask", {
      fields: [
        "name",
        "subject",
        "description",
        "status",
        "start_date",
        "end_date",
        "assigned_to",
        "task",
      ],
      limit: 0,
    });

    return {
      allTasks: allTasks || [],
      allSubTasks: allSubTasks || [],
      isLoading: isLoadingTasks || isLoadingSubTasks,
      error: tasksError || subTasksError,
    };
  }
  static getAllTaskOfTeam() {
  const currentUser = useFrappeAuth().currentUser;

  const { data: teams } = useFrappeGetDocList<Team>("Team", {
    filters: [["teamlead", "=", currentUser || ""]],
  });
  const teamNames = teams?.map(t => t.name) || [];

  const { data: allProjects } = useFrappeGetDocList<Project>("Project", {
    fields: ["name", "team"],
    filters: [["team", "in", teamNames]],
    limit: 0,
  });
  const projectNames = allProjects?.map(p => p.name) || [];

  const {
    data: allTasks, isLoading: isLoadingTasks, error: tasksError,
  } = useFrappeGetDocList<Task>("Task", {
    fields: [
      "name","status","exp_end_date","project",
    ],
    limit: 0,
  });
  const tasks = (allTasks || []).filter(t => projectNames.includes(t.project || ""));

  const {
    data: allSubTasks, isLoading: isLoadingSubTasks, error: subTasksError,
  } = useFrappeGetDocList<SubTask>("SubTask", {
    fields: ["name","status","task"],
    limit: 0,
  });
  const taskNames = tasks.map(t => t.name);
  const subtasks = (allSubTasks || []).filter(st => taskNames.includes(st.task || ""));

  // helpers
  const isCompleted = (s?: string|null) => (s || "").toLowerCase() === "completed";
  const isWorking  = (s?: string|null) => (s || "").toLowerCase() === "working";
  const isCancelled = (s?: string|null) => (s || "").toLowerCase() === "cancelled";
  const isOverdueStatus = (s?: string|null) => (s || "").toLowerCase() === "overdue";

  const today = new Date(); today.setHours(0,0,0,0);
  const isTaskOverdue = (t: Task) => {
    if (isOverdueStatus(t.status)) return true;
    if (!isCompleted(t.status) && !isCancelled(t.status) && t.exp_end_date) {
      const end = new Date(t.exp_end_date as unknown as string);
      end.setHours(0,0,0,0);
      return end < today;
    }
    return false;
  };

  // ===== số liệu cho 4 thẻ =====
  const total     = tasks.length + subtasks.length;
  const working   = tasks.filter(t => isWorking(t.status)).length
                  + subtasks.filter(st => isWorking(st.status)).length;
  const completed = tasks.filter(t => isCompleted(t.status)).length
                  + subtasks.filter(st => isCompleted(st.status)).length;
  const overdue   = tasks.filter(t => isTaskOverdue(t)).length; // chỉ Task

  return {
    total,        // "Tổng công việc"
    working,      // "Đang thực hiện"
    completed,    // "Hoàn thành"
    overdue,      // "Trễ hạn" (Task)
    isLoading: isLoadingTasks || isLoadingSubTasks,
    error: tasksError || subTasksError,
  };
}

}

export const useAllTeamTasks = TeamTaskService.useAllTeamTasks;
export const useAllTaskOfTeam = TeamTaskService.getAllTaskOfTeam;
