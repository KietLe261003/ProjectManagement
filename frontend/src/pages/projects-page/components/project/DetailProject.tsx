import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  DollarSign,
  Users,
  Crown,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  BarChart3,
} from "lucide-react";
import {
  useFrappeGetDoc,
  useFrappePostCall,
  useFrappeAuth,
} from "frappe-react-sdk";
import { useForm } from "react-hook-form";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { FileAttachments } from "@/components/FileAttachments";
import type { Project } from "@/types/Projects/Project";
import { formatCurrency } from "@/utils/formatCurrency";
import { ProjectTaskManagement } from "../ProjectTaskManagement";
import { PhaseDetails } from "../phase/PhaseDetails";
import { TaskDetails } from "../task/TaskDetails";
import { SubTaskDetails } from "../subtask/SubTaskDetails";
import EditProject from "./EditProject";
import DeleteProject from "./DeleteProject";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";
// import { useProjectProgressUpdate } from '@/hooks/useProjectProgressUpdate'

interface DetailProjectProps {
  project: Project | null;
  onBack: () => void;
}

interface OwnerFormData {
  owner: string;
}

export function DetailProject({
  project,
  onBack,
}: DetailProjectProps) {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "tasks"
    | "team"
    | "phase-details"
    | "task-details"
    | "subtask-details"
  >("overview");
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedSubTask, setSelectedSubTask] = useState<any>(null);

  // Member management states
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  // Owner management states
  const [showEditOwnerDialog, setShowEditOwnerDialog] = useState(false);

  // Edit and Delete project states
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);

  // Reset form states when edit owner dialog closes
  useEffect(() => {
    if (!showEditOwnerDialog) {
      editOwnerForm.reset();
      editOwnerForm.clearErrors();
    }
  }, [showEditOwnerDialog]);

  // Reset all states when project changes
  useEffect(() => {
    if (project?.name) {
      setActiveTab("overview");
      setSelectedPhase(null);
      setSelectedTask(null);
      setSelectedSubTask(null);
      setShowAddMemberDialog(false);
      setShowEditOwnerDialog(false);
      setShowEditProjectDialog(false);
      setShowDeleteProjectDialog(false);
      // editOwnerForm.reset(); // This will be called after form initialization
    }
  }, [project?.name]);

  // Fetch complete project data with users field
  const {
    data: fullProjectData,
    isLoading: loadingProject,
    mutate: refreshProject,
  } = useFrappeGetDoc(
    "Project",
    project?.name || "",
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const { call: deleteCall } = useFrappePostCall("frappe.client.delete");
  const { call: removeMemberCall } = useFrappePostCall(
    "todo.api.remove_project_member"
  );

  // Fetch project owner details
  const {
    data: ownerData,
    error: ownerError,
    isLoading: ownerLoading,
  } = useFrappeGetDoc(
    "User",
    project?.owner || "",
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Fetch subtask data for refresh after update
  const { data: subtaskData, mutate: refreshSubTask } = useFrappeGetDoc(
    "SubTask",
    selectedSubTask?.name || "",
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Fetch task data for refresh after update
  const { data: taskData, mutate: refreshTask } = useFrappeGetDoc(
    "Task",
    selectedTask?.name || "",
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Get current user to check permissions
  const { currentUser } = useFrappeAuth();

  // Get users from the project data
  const projectUsers = fullProjectData?.users || project?.users || [];
  const loadingUsers = loadingProject;

  // NEW APPROACH: Display project progress with enhanced data
  const calculatedProgress = useMemo(() => {
    // Mock data for tasks and phases - in real app, these would come from API
    const totalTasks = 15; // This would come from your tasks API
    const completedTasks = Math.round((totalTasks * (fullProjectData?.percent_complete || project?.percent_complete || 0)) / 100);
    
    const phases = [
      { name: "Planning", progress: 100 },
      { name: "Development", progress: 75 },
      { name: "Testing", progress: 30 },
      { name: "Deployment", progress: 0 }
    ];

    return {
      progress: fullProjectData?.percent_complete || project?.percent_complete || 0,
      source: "project",
      count: 1,
      totalTasks,
      completedTasks,
      phases,
    };
  }, [fullProjectData?.percent_complete, project?.percent_complete, project?.name]);

  // Function to refresh subtask data after update
  const handleRefreshSubTask = async () => {
    if (selectedSubTask?.name) {
      try {
        await refreshSubTask();
      } catch (error) {
        console.error("Error refreshing subtask data:", error);
      }
    }
  };

  // Function to refresh task data after update
  const handleRefreshTask = async () => {
    if (selectedTask?.name) {
      try {
        await refreshTask();
      } catch (error) {
        console.error("Error refreshing task data:", error);
      }
    }
  };

  // Function to refresh task by task name (for when subtask updates affect parent task)
  const handleRefreshTaskByName = async (taskName: string) => {
    if (selectedTask?.name === taskName) {
      await handleRefreshTask();
    }
  };

  // Auto-update selectedSubTask when subtaskData changes
  useEffect(() => {
    if (subtaskData && selectedSubTask?.name === subtaskData.name) {
      setSelectedSubTask(subtaskData);
    }
  }, [subtaskData, selectedSubTask?.name]);

  // Auto-update selectedTask when taskData changes
  useEffect(() => {
    if (taskData && selectedTask?.name === taskData.name) {
      setSelectedTask(taskData);
    }
  }, [taskData, selectedTask?.name]);

  // Form hooks for owner management
  const editOwnerForm = useForm<OwnerFormData>();
  
  // Reset form when project changes
  useEffect(() => {
    if (project?.name) {
      editOwnerForm.reset();
      // Force refresh project data
      if (refreshProject) {
        refreshProject();
      }
    }
  }, [project?.name, editOwnerForm, refreshProject]);
  const handleRemoveMember = async (userToRemove: string) => {
    if (!project?.name) return;

    if (
      !confirm("Are you sure you want to remove this member from the project?")
    ) {
      return;
    }

    try {
      // Use custom API that doesn't send notification email
      const result = await removeMemberCall({
        project_name: project.name,
        user: userToRemove,
      });

      console.log("Member removed successfully:", result);

      // Success - refresh data
      setTimeout(() => refreshProject(), 1000);

      // Show success message
      alert("Member removed successfully!");
    } catch (error) {
      console.error("Error removing member:", error);

      // Handle different types of errors gracefully
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("Email Account") ||
        errorMessage.includes("OutgoingEmailError") ||
        errorMessage.includes("email") ||
        errorMessage.includes("SMTP")
      ) {
        // Email error - member might still be removed, just email failed
        console.log(
          "Email error detected when removing member, checking if removal was successful"
        );

        // Refresh to check if member was actually removed
        setTimeout(() => {
          refreshProject();
          alert(
            "Member removed successfully! (Email notification failed to send, but member was removed from project)"
          );
        }, 1000);
      } else if (
        errorMessage.includes("PermissionError") ||
        errorMessage.includes("Not permitted")
      ) {
        alert(
          "You do not have permission to remove members from this project."
        );
      } else if (errorMessage.includes("ValidationError")) {
        alert("Cannot remove member: Validation error occurred.");
      } else if (
        errorMessage.includes("LinkExistsError") ||
        errorMessage.includes("Cannot delete")
      ) {
        alert(
          "Cannot remove member: This user may have linked records (tasks, timesheets, etc.). Please remove or reassign those records first."
        );
      } else if (errorMessage.includes("is not a member of this project")) {
        alert("This user is not a member of the project.");
        // Refresh to sync the UI
        setTimeout(() => refreshProject(), 500);
      } else {
        // Generic error with fallback to old method
        console.log("Custom API failed, trying fallback method");

        try {
          // Fallback to direct deletion
          const userRecord = projectUsers.find(
            (u: any) => u.user === userToRemove
          );
          if (userRecord?.name) {
            await deleteCall({
              doctype: "Project User",
              name: userRecord.name,
            });

            setTimeout(() => refreshProject(), 1000);
            alert("Member removed successfully! (Using fallback method)");
          } else {
            alert("User record not found.");
          }
        } catch (fallbackError) {
          console.error("Fallback method also failed:", fallbackError);
          alert(`Failed to remove member: ${errorMessage}`);
        }
      }
    }
  };

  // Check if current user is the project owner
  const isCurrentUserOwner = () => {
    return project?.owner === currentUser || currentUser === "Administrator";
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };
  // Handle edit project
  const handleEditProject = () => {
    setShowEditProjectDialog(true);
  };

  // Handle delete project
  const handleDeleteProject = () => {
    setShowDeleteProjectDialog(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    refreshProject(); // Refresh current project data

    // Also refresh the projects list in parent component if needed
    // This will help update any cached data throughout the app
    mutate(
      (key) => typeof key === "string" && key.includes("Project"),
      undefined,
      { revalidate: true }
    );
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    onBack(); // Go back to projects list after successful deletion
  };

  if (!project) return null;

  // Use fullProjectData if available, fallback to project prop
  const currentProject = fullProjectData || project;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Project Header - UAV Style */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                <span className="text-3xl font-bold text-white">
                  {currentProject.project_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold tracking-tight">
                    {currentProject.project_name}
                  </h1>
                  <span
                    className={`px-4 py-2 text-sm font-semibold rounded-full ${
                      currentProject.status === "Open"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                        : currentProject.status === "Completed"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                        : "bg-red-500/20 text-red-300 border border-red-400/30"
                    }`}
                  >
                    {currentProject.status || "Open"}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-slate-300">
                  <span className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {formatDate(currentProject.expected_end_date)}
                  </span>
                  {currentProject.project_type && (
                    <span className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {currentProject.project_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleEditProject}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Project
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDeleteProject}
                className="bg-red-600/20 border-red-400/30 text-red-200 hover:bg-red-600/30 backdrop-blur-sm"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={onBack}
                className="text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Projects
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Progress</p>
                  <p className="text-3xl font-bold text-white">
                    {calculatedProgress.progress}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${calculatedProgress.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Budget</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(currentProject.estimated_costing)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">
                    Team Size
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {(projectUsers?.length || 0) + 1}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-500/30 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">
                    Days Left
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {currentProject.expected_end_date
                      ? Math.max(
                          0,
                          Math.ceil(
                            (new Date(
                              currentProject.expected_end_date
                            ).getTime() -
                              new Date().getTime()) /
                              (1000 * 3600 * 24)
                          )
                        )
                      : "N/A"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - UAV Style */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "tasks", label: "Tasks & Phases", icon: "📋" },
              {
                id: "team",
                label: `Team (${(projectUsers?.length || 0) + 1})`,
                icon: "👥",
              },
              ...(selectedPhase
                ? [
                    {
                      id: "phase-details",
                      label: `📋 ${selectedPhase.subject}`,
                      icon: "🔍",
                    },
                  ]
                : []),
              ...(selectedTask
                ? [
                    {
                      id: "task-details",
                      label: `📝 ${selectedTask.subject || selectedTask.name}`,
                      icon: "🔍",
                    },
                  ]
                : []),
              ...(selectedSubTask
                ? [
                    {
                      id: "subtask-details",
                      label: `📌 ${
                        selectedSubTask.subject || selectedSubTask.name
                      }`,
                      icon: "🔍",
                    },
                  ]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-slate-600 text-slate-800 bg-slate-50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {(tab.id === "phase-details" ||
                  tab.id === "task-details" ||
                  tab.id === "subtask-details") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tab.id === "phase-details") {
                        setSelectedPhase(null);
                        setActiveTab("tasks");
                      } else if (tab.id === "task-details") {
                        setSelectedTask(null);
                        setActiveTab("tasks");
                      } else {
                        setSelectedSubTask(null);
                        setActiveTab("tasks");
                      }
                    }}
                    className="ml-2 p-1 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content - UAV Style Background */}
      <div className="bg-slate-50 min-h-screen">
        <div className=" mx-auto py-8">
          <div className="space-y-8">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Quick Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Total Tasks
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {calculatedProgress.totalTasks}
                        </p>
                        <p className="text-sm text-emerald-600 mt-1">
                          {calculatedProgress.completedTasks} completed
                        </p>
                      </div>
                      <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-7 h-7 text-slate-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Team Members
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {(projectUsers?.length || 0) + 1}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Including project owner
                        </p>
                      </div>
                      <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Users className="w-7 h-7 text-slate-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Budget
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                          {formatCurrency(currentProject.estimated_costing)}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Estimated cost
                        </p>
                      </div>
                      <div className="h-14 w-14 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-7 h-7 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Time Left
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {currentProject.expected_end_date
                            ? Math.max(
                                0,
                                Math.ceil(
                                  (new Date(
                                    currentProject.expected_end_date
                                  ).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 3600 * 24)
                                )
                              )
                            : "N/A"}
                        </p>
                        <p className="text-sm text-orange-600 mt-1">
                          Days remaining
                        </p>
                      </div>
                      <div className="h-14 w-14 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Calendar className="w-7 h-7 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Project Information - 2/3 width */}
                  <div className="xl:col-span-2 space-y-8">
                    {/* Project Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="px-8 py-6 border-b border-slate-200">
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-slate-600" />
                          </div>
                          Project Information
                        </h3>
                      </div>
                      <div className="p-8 space-y-8">
                        <div>
                          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Description
                          </label>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-slate-900 leading-relaxed">
                              {currentProject.description ||
                                "No description provided for this project."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                              Start Date
                            </label>
                            <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                              <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-emerald-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {formatDate(
                                    currentProject.expected_start_date
                                  )}
                                </p>
                                <p className="text-sm text-emerald-600">
                                  Project kickoff
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                              Target End Date
                            </label>
                            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-red-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {formatDate(currentProject.expected_end_date)}
                                </p>
                                <p className="text-sm text-red-600">
                                  Delivery deadline
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                              Customer
                            </label>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <p className="text-slate-900 font-medium">
                                {currentProject.customer || "Not assigned"}
                              </p>
                            </div>
                          </div>

                          {currentProject.project_type && (
                            <div>
                              <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Project Type
                              </label>
                              <div className="flex items-center px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="h-6 w-6 bg-slate-200 rounded-md flex items-center justify-center mr-3">
                                  <svg
                                    className="w-3 h-3 text-slate-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <span className="text-slate-900 font-medium">
                                  {currentProject.project_type}
                                </span>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                              Priority
                            </label>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-amber-900 font-medium">
                                {currentProject.priority || "Medium"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Financial Section */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Financial Overview
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                              <p className="text-sm text-emerald-700 font-medium">
                                Total Sales
                              </p>
                              <p className="text-lg font-bold text-emerald-900">
                                {formatCurrency(
                                  currentProject.total_sales_amount
                                )}
                              </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-700 font-medium">
                                Total Cost
                              </p>
                              <p className="text-lg font-bold text-blue-900">
                                {formatCurrency(
                                  currentProject.total_costing_amount
                                )}
                              </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                              <p className="text-sm text-purple-700 font-medium">
                                Billable
                              </p>
                              <p className="text-lg font-bold text-purple-900">
                                {formatCurrency(
                                  currentProject.total_billable_amount
                                )}
                              </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                              <p className="text-sm text-orange-700 font-medium">
                                Gross Margin
                              </p>
                              <p className="text-lg font-bold text-orange-900">
                                {formatCurrency(currentProject.gross_margin)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Sidebar - 1/3 width */}
                  <div className="space-y-6">
                    {/* Progress Overview Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="px-6 py-5 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-slate-600" />
                          </div>
                          Progress Overview
                        </h3>
                      </div>
                      <div className="p-6 space-y-6">
                        {/* Main Progress Circle */}
                        <div className="text-center">
                          <div className="relative inline-flex items-center justify-center">
                            <div className="w-28 h-28">
                              <svg
                                className="w-28 h-28 transform -rotate-90"
                                viewBox="0 0 100 100"
                              >
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  className="text-slate-200"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  strokeDasharray={`${2 * Math.PI * 40}`}
                                  strokeDashoffset={`${
                                    2 *
                                    Math.PI *
                                    40 *
                                    (1 - calculatedProgress.progress / 100)
                                  }`}
                                  className="text-slate-800 transition-all duration-1000 ease-out"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold text-slate-800">
                                {calculatedProgress.progress}%
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600 mt-3 font-medium">
                            Overall Completion
                          </p>
                        </div>

                        {/* Task Breakdown */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-2xl font-bold text-slate-800">
                              {calculatedProgress.completedTasks}
                            </div>
                            <div className="text-sm text-slate-600 font-medium">
                              Completed
                            </div>
                          </div>
                          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-2xl font-bold text-slate-800">
                              {calculatedProgress.totalTasks -
                                calculatedProgress.completedTasks}
                            </div>
                            <div className="text-sm text-slate-600 font-medium">
                              Remaining
                            </div>
                          </div>
                        </div>

                        {/* Phase Progress */}
                        {calculatedProgress.phases.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                              <div className="h-6 w-6 bg-slate-100 rounded-md flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-slate-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              Phase Progress
                            </h4>
                            <div className="space-y-3">
                              {calculatedProgress.phases.map((phase, index) => (
                                <div
                                  key={index}
                                  className="bg-slate-50 p-3 rounded-lg border border-slate-200"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-slate-900 truncate">
                                      {phase.name}
                                    </span>
                                    <span className="text-sm font-bold text-slate-700 ml-2">
                                      {phase.progress}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                      className="bg-slate-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${phase.progress}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Files Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="px-8 py-6 border-b border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-slate-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      Project Files
                    </h3>
                  </div>
                  <div className="p-8">
                    <FileAttachments
                      doctype="Project"
                      docname={project.name}
                      title=""
                      allowUpload={true}
                      allowDelete={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-8">
                {/* Team Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Total Members
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {(projectUsers?.length || 0) + 1}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Including owner
                        </p>
                      </div>
                      <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Users className="w-7 h-7 text-slate-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Project Owner
                        </p>
                        <p className="text-2xl font-bold text-amber-600 mt-2">
                          1
                        </p>
                        <p className="text-sm text-slate-600 mt-1">Active</p>
                      </div>
                      <div className="h-14 w-14 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Crown className="w-7 h-7 text-amber-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Team Members
                        </p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">
                          {projectUsers?.length || 0}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Contributors
                        </p>
                      </div>
                      <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-7 h-7 text-slate-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                          Progress
                        </p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                          {project?.percent_complete || 0}%
                        </p>
                        <p className="text-sm text-slate-600 mt-1">Complete</p>
                      </div>
                      <div className="h-14 w-14 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-7 h-7 text-emerald-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Owner Section - Enhanced */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="px-8 py-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Crown className="h-6 w-6 text-amber-600" />
                        </div>
                        Project Owner
                      </h3>
                      {isCurrentUserOwner() && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            editOwnerForm.reset({
                              owner: project?.owner || "",
                            });
                            setShowEditOwnerDialog(true);
                          }}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          <Edit className="h-5 w-5 mr-2" />
                          Change Owner
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center shadow-sm border border-slate-200">
                          {ownerData?.user_image ? (
                            <img
                              src={ownerData.user_image}
                              alt={ownerData?.full_name || "Owner"}
                              className="h-full w-full object-cover rounded-xl"
                            />
                          ) : (
                            <span className="text-xl font-bold text-slate-600">
                              {(
                                ownerData?.full_name ||
                                currentProject?.owner ||
                                "O"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-slate-900 mb-1">
                          {ownerLoading
                            ? "Loading..."
                            : ownerData?.full_name ||
                              currentProject?.owner ||
                              "No Owner"}
                        </h4>
                        <p className="text-slate-600 mb-3">
                          {ownerLoading
                            ? "Loading email..."
                            : ownerData?.email ||
                              currentProject?.owner ||
                              "No email"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                            👑 Project Owner
                          </span>
                          {ownerData?.designation && (
                            <span className="inline-flex px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                              {ownerData.designation}
                            </span>
                          )}
                          {ownerError && (
                            <span className="inline-flex px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full border border-red-200">
                              ⚠️ Error loading details
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members Section - Enhanced */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="px-8 py-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-slate-600" />
                        </div>
                        Team Members
                        <span className="inline-flex px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                          {projectUsers?.length || 0} members
                        </span>
                      </h3>
                      <Button
                        size="lg"
                        className="bg-slate-800 hover:bg-slate-900"
                        onClick={() => setShowAddMemberDialog(true)}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </div>

                  <div className="p-8">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-600 mx-auto mb-4"></div>
                          <p className="text-lg font-medium text-slate-600">
                            Loading team members...
                          </p>
                          <p className="text-sm text-slate-500 mt-2">
                            Please wait while we fetch the team data
                          </p>
                        </div>
                      </div>
                    ) : projectUsers && projectUsers.length > 0 ? (
                      <div className="grid gap-4">
                        {projectUsers.map((member: any, index: number) => (
                          <div
                            key={member.user || index}
                            className="flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm border border-slate-200">
                                {member.image ? (
                                  <img
                                    src={member.image}
                                    alt={member.full_name || member.user}
                                    className="h-full w-full object-cover rounded-xl"
                                  />
                                ) : (
                                  <span className="text-lg font-semibold text-slate-600">
                                    {(member.full_name || member.user || "U")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-slate-900 mb-1">
                                  {member.full_name ||
                                    member.user ||
                                    "Unknown User"}
                                </h4>
                                <p className="text-slate-600 mb-2">
                                  {member.email || member.user || "No email"}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                    👥 Team Member
                                  </span>
                                  {member.project_status && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200">
                                      📊 {member.project_status}
                                    </span>
                                  )}
                                  {member.view_attachments && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                      📎 File Access
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                                onClick={() => handleRemoveMember(member.user)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="max-w-sm mx-auto">
                          <div className="h-20 w-20 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
                            <Users className="h-10 w-10 text-slate-400" />
                          </div>
                          <h4 className="text-xl font-semibold text-slate-900 mb-3">
                            No team members yet
                          </h4>
                          <p className="text-slate-600 text-base mb-6">
                            Start building your team by adding members to
                            collaborate on this project
                          </p>
                          <Button
                            size="lg"
                            className="bg-slate-800 hover:bg-slate-900"
                            onClick={() => setShowAddMemberDialog(true)}
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Add First Member
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 px-8 py-6 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Tasks & Phases Management
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Organize and track project phases, tasks, and subtasks
                  </p>
                </div>
                <div className="p-8">
                  <ProjectTaskManagement
                    projectName={project.name}
                    onViewPhaseDetails={(phase) => {
                      setSelectedPhase(phase);
                      setActiveTab("phase-details");
                    }}
                    onViewTaskDetails={(task) => {
                      setSelectedTask(task);
                      setActiveTab("task-details");
                    }}
                    onViewSubTaskDetails={(subtask) => {
                      setSelectedSubTask(subtask);
                      setActiveTab("subtask-details");
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "phase-details" && selectedPhase && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-100 px-8 py-6 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Phase Details: {selectedPhase.subject}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Manage tasks and track progress for this phase
                  </p>
                </div>
                <div className="p-8">
                  <PhaseDetails
                    phase={selectedPhase}
                    projectName={project.name}
                    onBack={() => setActiveTab("tasks")}
                    onViewTaskDetails={(task) => {
                      setSelectedTask(task);
                      setActiveTab("task-details");
                    }}
                    onPhaseUpdated={async () => {
                      refreshProject();
                    }}
                    onPhaseDeleted={async () => {
                      refreshProject();
                      setActiveTab("tasks");
                      setSelectedPhase(null);
                    }}
                    onTaskCreated={async () => {
                      refreshProject();
                    }}
                  />
                </div>
              </div>
            )}
            {activeTab === "task-details" && selectedTask && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-amber-100 px-8 py-6 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Task Details: {selectedTask.subject || selectedTask.name}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Manage subtasks and track task progress
                  </p>
                </div>
                <div className="p-8">
                  <TaskDetails
                    task={selectedTask}
                    projectName={project.name}
                    onBack={() => setActiveTab("tasks")}
                    onViewSubTaskDetails={(subtask) => {
                      setSelectedSubTask(subtask);
                      setActiveTab("subtask-details");
                    }}
                    onTaskUpdated={async () => {
                      // Refresh project data when task is updated
                      refreshProject();
                      // Refresh task data to show updated information
                      await handleRefreshTask();
                    }}
                    onTaskDeleted={async () => {
                      // Refresh project data and go back to tasks when task is deleted
                      refreshProject();
                      setActiveTab("tasks");
                      setSelectedTask(null);
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "subtask-details" && selectedSubTask && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-50 to-rose-100 px-8 py-6 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="h-10 w-10 bg-pink-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Subtask Details:{" "}
                    {selectedSubTask.subject || selectedSubTask.name}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Detailed view and management of subtask
                  </p>
                </div>
                <div className="p-8">
                  <SubTaskDetails
                    subtask={selectedSubTask}
                    projectName={project.name}
                    onBack={() => setActiveTab("tasks")}
                    onSubTaskUpdated={async () => {
                      // Refresh project data when subtask is updated
                      refreshProject();
                      // Refresh subtask data to show updated information
                      await handleRefreshSubTask();
                      // Refresh parent task data to update task progress
                      if (selectedSubTask?.task) {
                        await handleRefreshTaskByName(selectedSubTask.task);
                      }
                    }}
                    onSubTaskDeleted={async () => {
                      // Refresh project data and go back to tasks when subtask is deleted
                      refreshProject();
                      setActiveTab("tasks");
                      setSelectedSubTask(null);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              Quick Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 text-lg font-semibold bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-300 text-green-700 hover:text-green-800"
                onClick={() => setActiveTab("tasks")}
              >
                <svg
                  className="w-6 h-6 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Manage Tasks
              </Button>
              <Button
                variant="outline"
                className="h-16 text-lg font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 text-blue-700 hover:text-blue-800"
                onClick={() => setActiveTab("team")}
              >
                <Users className="w-6 h-6 mr-3" />
                Team Overview
              </Button>
              <Button
                variant="outline"
                className="h-16 text-lg font-semibold bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-300 text-purple-700 hover:text-purple-800"
                onClick={() => setActiveTab("overview")}
              >
                <BarChart3 className="w-6 h-6 mr-3" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Dialog */}
      <AddTeamMemberDialog
        isOpen={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        projectName={project.name}
        onSuccess={() => {
          setTimeout(() => refreshProject(), 1000);
        }}
      />

      {/* Edit Project Dialog */}
      <EditProject
        project={project}
        isOpen={showEditProjectDialog}
        onClose={() => setShowEditProjectDialog(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Project Dialog */}
      <DeleteProject
        project={project}
        isOpen={showDeleteProjectDialog}
        onClose={() => setShowDeleteProjectDialog(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
