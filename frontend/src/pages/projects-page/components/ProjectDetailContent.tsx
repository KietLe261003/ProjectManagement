import { useState, useMemo } from "react";
import {
  Calendar,
  DollarSign,
  User,
  Users,
  Crown,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import {
  useFrappeGetDoc,
  useFrappePostCall,
} from "frappe-react-sdk";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FileAttachments } from "@/components/FileAttachments";
import type { Project } from "@/types/Projects/Project";
import { formatCurrency } from "@/utils/formatCurrency";
// import { ProjectTaskManagement } from "../ProjectTaskManagement";
// import { PhaseDetails } from "../phase/PhaseDetails";
// import { TaskDetails } from "../task/TaskDetails";
// import { SubTaskDetails } from "../subtask/SubTaskDetails";
import EditProject from "./project/EditProject";
import DeleteProject from "./project/DeleteProject";
import { AddTeamMemberDialog } from "./project/AddTeamMemberDialog";

interface ProjectDetailContentProps {
  project: Project;
}

export function ProjectDetailContent({
  project,
}: ProjectDetailContentProps) {
  const navigate = useNavigate();
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

  // Edit and Delete project states
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);

  // Get current user from Frappe auth
  // const { currentUser } = useFrappeAuth();

  // Fetch full project data to get complete information
  const {
    data: fullProjectData,
    mutate: refreshProject,
  } = useFrappeGetDoc<Project>("Project", project.name);

  // Fetch project users
  const {
    data: projectUsers,
    isLoading: loadingUsers,
  } = useFrappeGetDoc("Project", project.name, {
    fields: [
      "name",
      "users",
      "users.user",
      "users.view_attachments",
      "users.hide_timesheets",
      "users.project_status",
    ],
  });

  // Fetch owner details
  const {
    data: ownerData,
    isLoading: ownerLoading,
    error: ownerError,
  } = useFrappeGetDoc("User", project?.owner, project?.owner ? undefined : null);

  // Form for adding members
  // const addMemberForm = useForm<MemberFormData>();

  // Form for editing owner
  // const editOwnerForm = useForm<OwnerFormData>();

  // API calls
  // const { call: addProjectUser } = useFrappePostCall("todo.api.add_project_user");
  const { call: removeProjectUser } = useFrappePostCall("todo.api.remove_project_user");

  // Calculate project progress from tasks and phases
  const calculatedProgress = useMemo(() => {
    if (!fullProjectData) {
      return { progress: project?.percent_complete || 0, total: 0, completed: 0 };
    }
    return { progress: fullProjectData?.percent_complete || 0, total: 0, completed: 0 };
  }, [fullProjectData, project]);

  // Handle removing member
  const handleRemoveMember = async (userId: string) => {
    if (!project?.name) return;
    
    try {
      await removeProjectUser({
        project: project.name,
        user: userId,
      });
      
      setTimeout(() => refreshProject(), 1000);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  // Handle refreshing task data
  // const handleRefreshTask = async () => {
  //   if (selectedTask?.name) {
  //     await mutate(`Task-${selectedTask.name}`);
  //   }
  // };

  // Handle refreshing subtask data
  // const handleRefreshSubTask = async () => {
  //   if (selectedSubTask?.name) {
  //     await mutate(`SubTask-${selectedSubTask.name}`);
  //   }
  // };

  // Handle refreshing task by name
  // const handleRefreshTaskByName = async (taskName: string) => {
  //   await mutate(`Task-${taskName}`);
  // };

  // Check if current user is the project owner
  // const isCurrentUserOwner = () => {
  //   return project?.owner === currentUser || currentUser === "Administrator";
  // };

  // Get status color
  const getStatusColor = (status?: "Open" | "Completed" | "Cancelled") => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
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
  const handleEditSuccess = async () => {
    await refreshProject();
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    navigate('/projects'); // Navigate back to projects list after successful deletion
  };

  if (!project) return null;

  // Use fullProjectData if available, fallback to project prop
  const currentProject = fullProjectData || project;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Project Header */}
      <div className="bg-white shadow-sm border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {currentProject.project_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentProject.project_name}
                </h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(
                      currentProject.status
                    )}`}
                  >
                    {currentProject.status || "Open"}
                  </span>
                  {currentProject.project_type && (
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                      {currentProject.project_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProject}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />  
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteProject}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-600 mt-4">
            Project Details and Progress Overview
          </p>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mt-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "tasks"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tasks & Phases
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "team"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="h-4 w-4" />
              Team ({(projectUsers?.users?.length || 0) + 1})
            </button>
            {selectedPhase && (
              <button
                onClick={() => setActiveTab("phase-details")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "phase-details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📋 {selectedPhase.subject}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhase(null);
                    setActiveTab("tasks");
                  }}
                  className="ml-2 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                  title="Close phase details"
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
                </span>
              </button>
            )}
            {selectedTask && (
              <button
                onClick={() => setActiveTab("task-details")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "task-details"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📝 {selectedTask.subject || selectedTask.name}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(null);
                    setActiveTab("tasks");
                  }}
                  className="ml-2 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                  title="Close task details"
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
                </span>
              </button>
            )}
            {selectedSubTask && (
              <button
                onClick={() => setActiveTab("subtask-details")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "subtask-details"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📌 {selectedSubTask.subject || selectedSubTask.name}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubTask(null);
                    setActiveTab("tasks");
                  }}
                  className="ml-2 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                  title="Close subtask details"
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
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-8">
          {activeTab === "overview" && (
            <>
              {/* Progress Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Project Progress
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-gray-700">
                        Overall Progress
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {calculatedProgress.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${calculatedProgress.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Project Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                        Customer
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {currentProject.customer || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600 uppercase tracking-wide">
                        Budget
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(currentProject.estimated_costing)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Calendar className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                        Deadline
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatDate(currentProject.expected_end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Project Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Start Date
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatDate(currentProject.expected_start_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Priority
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {currentProject.priority || "Medium"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Team
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {currentProject.team || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-600 font-medium">
                        Company
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {currentProject.company || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Financial Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Total Cost
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(currentProject.total_costing_amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Total Sales
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(currentProject.total_sales_amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Billable Amount
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(currentProject.total_billable_amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-600 font-medium">
                        Gross Margin
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(currentProject.gross_margin)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Files Section */}
              <FileAttachments
                doctype="Project"
                docname={project.name}
                title="Project Files"
                allowUpload={true}
                allowDelete={true}
                className="mt-8"
              />
            </>
          )}

          {activeTab === "team" && (
            <div className="space-y-6">
              {/* Project Owner Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Project Owner
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {ownerLoading
                        ? "Loading..."
                        : ownerData?.full_name
                        ? ownerData.full_name
                        : currentProject?.owner
                        ? currentProject.owner
                        : "No Owner"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {ownerLoading
                        ? "Loading email..."
                        : ownerData?.email
                        ? ownerData.email
                        : currentProject?.owner
                        ? currentProject.owner
                        : "No email"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        Project Owner
                      </span>
                      {ownerData?.designation && (
                        <span className="text-xs text-gray-500">
                          {ownerData.designation}
                        </span>
                      )}
                      {ownerError && (
                        <span className="text-xs text-red-500">
                          (Error loading user details)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Team Members
                    </h3>
                    <span className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                      {projectUsers?.users?.length || 0} members
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowAddMemberDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading team members...
                    </span>
                  </div>
                ) : projectUsers?.users && projectUsers.users.length > 0 ? (
                  <div className="grid gap-4">
                    {projectUsers.users.map((member: any, index: number) => (
                      <div
                        key={member.user || index}
                        className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.full_name || member.user}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-blue-600">
                              {(member.full_name || member.user || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {member.full_name ||
                              member.user ||
                              "Unknown User"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.email || member.user || "No email"}
                          </p>
                          {member.project_status && (
                            <p className="text-xs text-blue-600 mt-1">
                              Status: {member.project_status}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Team Member
                          </span>
                          {member.view_attachments && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Can View Files
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveMember(member.user)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">
                      No team members added yet
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Add team members to collaborate on this project
                    </p>
                    <Button
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowAddMemberDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Member
                    </Button>
                  </div>
                )}
              </div>

              {/* Project Statistics */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Team Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {(projectUsers?.users?.length || 0) + 1}
                    </p>
                    <p className="text-sm text-gray-600">Total Members</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">1</p>
                    <p className="text-sm text-gray-600">Project Owner</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {projectUsers?.users?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Team Members</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {project?.percent_complete || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Progress</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg font-medium">
                  Task Management
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Task management functionality will be implemented here
                </p>
              </div>
              {/* <ProjectTaskManagement
                projectName={project.name}
                onViewPhaseDetails={(phase: any) => {
                  setSelectedPhase(phase);
                  setActiveTab("phase-details");
                }}
                onViewTaskDetails={(task: any) => {
                  setSelectedTask(task);
                  setActiveTab("task-details");
                }}
                onViewSubTaskDetails={(subtask: any) => {
                  setSelectedSubTask(subtask);
                  setActiveTab("subtask-details");
                }}
              /> */}
            </div>
          )}

          {activeTab === "phase-details" && selectedPhase && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg font-medium">
                  Phase Details
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Phase details functionality will be implemented here
                </p>
              </div>
              {/* <PhaseDetails
                phase={selectedPhase}
                projectName={project.name}
                onBack={() => setActiveTab("tasks")}
                onViewTaskDetails={(task: any) => {
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
              /> */}
            </div>
          )}
          {activeTab === "task-details" && selectedTask && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg font-medium">
                  Task Details
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Task details functionality will be implemented here
                </p>
              </div>
              {/* <TaskDetails
                task={selectedTask}
                projectName={project.name}
                onBack={() => setActiveTab("tasks")}
                onViewSubTaskDetails={(subtask: any) => {
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
              /> */}
            </div>
          )}

          {activeTab === "subtask-details" && selectedSubTask && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg font-medium">
                  SubTask Details
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  SubTask details functionality will be implemented here
                </p>
              </div>
              {/* <SubTaskDetails
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
              /> */}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-12 text-lg font-semibold"
              onClick={() => setActiveTab("tasks")}
            >
              View Tasks
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 text-lg font-semibold"
            >
              View Timeline
            </Button>
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
