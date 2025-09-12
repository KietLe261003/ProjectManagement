import React from "react";
import { useUserAssignedTasks} from "../../services";
import { useTeamData } from "../../hooks/useTeamData";
import type { TaskItem } from "@/types";
import EditTaskModal from "./components/EditTaskModal";
import "./TasksPage.css";
import HeaderTask from "./components/HeaderTask";
import UserTasksView from './components/UserTasksView';
import LeaderTasksView from './components/LeaderTasksView';
import AdminTasksView from './components/AdminTasksView';
import ErrorLoading from "@/components/ErrorLoading";
import {  useFrappeAuth, useFrappeGetDocList } from "frappe-react-sdk";
import type { Team } from "@/types/Todo/Team";


export const TasksPage: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<"user" | "leader" | "admin">(
    "user"
  );
  const [activeTab, setActiveTab] = React.useState<
    "list" | "kanban" | "calendar"
  >("list");
  const [selectedMember, setSelectedMember] = React.useState<string | null>(
    null
  );
  const isAdmin = useFrappeAuth().currentUser === "Administrator";
  // Modal state for editing tasks/subtasks
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] =
    React.useState<TaskItem | null>(null);

  // Fetch user's assigned tasks and subtasks
  const { tasks, subTasks, isLoading, error, mutate, currentUser } = useUserAssignedTasks();
  // Fetch user's role in the team
  const { data: teams } = useFrappeGetDocList<Team>('Team',{
    filters: [["teamlead", "=", currentUser || '']]
  });
  const role = teams && teams.length > 0 ? "Leader" : "Member";
  // Set initial view based on user role
  React.useEffect(() => {
    if (isAdmin) {
      setCurrentView("admin");
    } else if (role === "Leader") {
      setCurrentView("leader");
    }
  }, [role, isAdmin]);
  // Transform tasks and subtasks to match the expected TaskItem structure
  const transformedTasks = React.useMemo((): TaskItem[] => {
    const taskItems: TaskItem[] = [];

    // Transform Tasks
    tasks.forEach((task) => {
      taskItems.push({
        id: task.name,
        title: task.subject || "Untitled Task",
        description: task.description || "No description available",
        project: task.project_name || task.project || "Unknown Project",
        assignee: currentUser || "Unknown",
        status: task.status || "Open",
        priority: task.priority || "Medium",
        dueDate: task.exp_end_date || new Date().toISOString().split("T")[0],
        labels: [task.type || "Task"],
        todoId: task.assignedTodo?.name || "",
        referenceName: task.name,
        referenceType: "Task",
        type: "Task",
        taskProgress: task.progress,
        expectedTime: task.expected_time,
        actualTime: task.actual_time,
        startDate: task.exp_start_date,
        endDate: task.exp_end_date,
      });
    });

    // Transform SubTasks
    subTasks.forEach((subTask) => {
      taskItems.push({
        id: subTask.name,
        title: subTask.subject || "Untitled SubTask",
        description: subTask.description || "No description available",
        project: subTask.project_name || "Unknown Project",
        assignee: currentUser || "Unknown",
        status: subTask.status || "Open",
        priority: "Medium", // SubTasks don't have priority field
        dueDate: subTask.end_date || new Date().toISOString().split("T")[0],
        labels: ["SubTask"],
        todoId: subTask.assignedTodo?.name || "",
        referenceName: subTask.name,
        referenceType: "SubTask",
        type: "SubTask",
        parentTask: subTask.task_subject,
        startDate: subTask.start_date,
        endDate: subTask.end_date,
      });
    });

    return taskItems.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
  }, [tasks, subTasks, currentUser]);
  // const test1 =test.getRole();

  // Use team data hook
  const {
    teamMembersData,
    error: teamDataError,
  } = useTeamData({team:teams && teams.length > 0 ? teams[0].name : ''});

  // For admin, get all users in the system
  const { data: allUsers } = useFrappeGetDocList('User', {
    fields: ['name', 'full_name', 'first_name', 'last_name'],
    filters: [['enabled', '=', 1]],
    limit: 0
  });

  // Prepare members data for admin view
  const adminMembersData = React.useMemo(() => {
    if (!isAdmin || !allUsers) return teamMembersData;
    
    return allUsers.map(user => ({
      id: user.name,
      name: user.full_name || user.first_name || user.name,
      role: 'Member' as const,
      taskCount: 0,
      avatar: '',
      tasks: [],
      user: user
    }));
  }, [isAdmin, allUsers, teamMembersData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isOverdue = date < today;
    const formatted = date.toLocaleDateString("vi-VN");

    return {
      formatted,
      isOverdue,
      display: isOverdue ? `${formatted} (Trễ)` : formatted,
    };
  };

  const handleRefresh = () => {
    mutate();
  };

  // Handle task click for editing
  const handleTaskClick = (task: TaskItem) => {
    setSelectedTaskForEdit(task);
    setEditModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedTaskForEdit(null);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    mutate(); // Refresh data
    if (currentView === "leader") {
      // Refresh team data if needed
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header và Nút chuyển đổi Role */}
        <HeaderTask
          role={role}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        {/* Error State */}
        <ErrorLoading error={error} />

        {/* Nội dung chính */}
        <main>
          {/* GIAO DIỆN USER */}
          {currentView === 'user' && (
            <UserTasksView
              isLoading={isLoading}
              handleRefresh={handleRefresh}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              transformedTasks={transformedTasks}
              formatDate={formatDate}
              handleTaskClick={handleTaskClick}
            />
          )}

          {/* GIAO DIỆN LEADER */}
          {currentView === 'leader' && role === 'Leader' && (
            <LeaderTasksView
              teamDataError={teamDataError}
              teamMembersData={teamMembersData}
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
              formatDate={formatDate}
              handleTaskClick={handleTaskClick}
            />
          )}

          {/* GIAO DIỆN ADMIN */}
          {currentView === 'admin' && isAdmin && (
            <AdminTasksView
              teamDataError={teamDataError}
              teamMembersData={adminMembersData}
              selectedMember={selectedMember}
              setSelectedMember={setSelectedMember}
              formatDate={formatDate}
              handleTaskClick={handleTaskClick}
            />
          )}
        </main>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={selectedTaskForEdit}
        isOpen={editModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        isLeader={role === 'Leader'}
      />
    </div>
  );
};
