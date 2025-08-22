import { useState, useEffect, useMemo } from 'react'
import { Calendar, DollarSign, User, Users, Crown, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { useFrappeGetDoc, useFrappePostCall, useFrappeAuth, useFrappeGetDocList } from "frappe-react-sdk"
import { useForm, Controller } from "react-hook-form"
import { mutate } from 'swr'

import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/input/Combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { Project } from '@/types/Projects/Project'
import type { ProjectUser } from '@/types/Projects/ProjectUser'
import { formatCurrency } from '@/utils/formatCurrency'
import { ProjectTaskManagement } from '../ProjectTaskManagement'
import { PhaseDetails } from '../phase/PhaseDetails'
import { TaskDetails } from '../task/TaskDetails'
import { SubTaskDetails } from '../subtask/SubTaskDetails'
import EditProject from './EditProject'
import DeleteProject from './DeleteProject'
import { useProjectProgressUpdate } from '@/hooks/useProjectProgressUpdate'

interface DetailProjectProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
}

interface MemberFormData {
  user: string
  view_attachments?: boolean
  hide_timesheets?: boolean
  project_status?: string
}

interface OwnerFormData {
  owner: string
}

export function DetailProject({ project, isOpen, onClose }: DetailProjectProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'phase-details' | 'task-details' | 'subtask-details'>('overview');
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedSubTask, setSelectedSubTask] = useState<any>(null);

  // Member management states
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectUser | null>(null);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);

  // Owner management states
  const [showEditOwnerDialog, setShowEditOwnerDialog] = useState(false);

  // Edit and Delete project states
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
  const [isCalculatingProgress, setIsCalculatingProgress] = useState(false);

  // Hook for project progress calculation
  const { updateProjectProgress } = useProjectProgressUpdate();

  // Fetch complete project data with users field
  const { data: fullProjectData, isLoading: loadingProject, mutate: refreshProject } = useFrappeGetDoc(
    "Project",
    project?.name || "",
    project?.name ? "Project" : undefined
  );

  // Fetch phases for progress calculation
  const { data: projectPhases } = useFrappeGetDocList('project_phase', {
    fields: ['name', 'progress'],
    filters: [['project', '=', project?.name || '']],
    orderBy: { field: 'creation', order: 'asc' }
  });

  // Fetch tasks for progress calculation (fallback when no phases)
  const { data: projectTasks } = useFrappeGetDocList('Task', {
    fields: ['name', 'progress'],
    filters: [['project', '=', project?.name || '']],
    orderBy: { field: 'creation', order: 'asc' }
  });

  const { call: insertCall } = useFrappePostCall('frappe.client.insert');
  const { call: saveCall } = useFrappePostCall('frappe.client.save');
  const { call: deleteCall } = useFrappePostCall('frappe.client.delete');
  const { call: setValueCall } = useFrappePostCall('frappe.client.set_value');

  // Fetch project owner details
  const { data: ownerData, error: ownerError, isLoading: ownerLoading } = useFrappeGetDoc(
    "User",
    project?.owner || "",
    project?.owner ? undefined : null // Only fetch if owner exists
  );

  // Fetch subtask data for refresh after update
  const { data: subtaskData, mutate: refreshSubTask } = useFrappeGetDoc(
    "SubTask",
    selectedSubTask?.name || "",
    selectedSubTask?.name ? undefined : null
  );

  // Fetch task data for refresh after update
  const { data: taskData, mutate: refreshTask } = useFrappeGetDoc(
    "Task",
    selectedTask?.name || "",
    selectedTask?.name ? undefined : null
  );

  // Get current user to check permissions
  const { currentUser } = useFrappeAuth();

  // Get users from the project data
  const projectUsers = fullProjectData?.users || project?.users || [];
  const loadingUsers = loadingProject;

  // Calculate project progress based on phases or tasks
  const calculatedProgress = useMemo(() => {
    if (projectPhases && projectPhases.length > 0) {
      // Calculate from phases
      const totalProgress = projectPhases.reduce((sum: number, phase: any) => {
        return sum + (phase.progress || 0);
      }, 0);
      return {
        progress: Math.round(totalProgress / projectPhases.length),
        source: 'phases',
        count: projectPhases.length
      };
    } else if (projectTasks && projectTasks.length > 0) {
      // Calculate from tasks
      const totalProgress = projectTasks.reduce((sum: number, task: any) => {
        return sum + (task.progress || 0);
      }, 0);
      return {
        progress: Math.round(totalProgress / projectTasks.length),
        source: 'tasks',
        count: projectTasks.length
      };
    }
    return {
      progress: fullProjectData?.percent_complete || project?.percent_complete || 0,
      source: 'manual',
      count: 0
    };
  }, [projectPhases, projectTasks, fullProjectData?.percent_complete, project?.percent_complete]);

  // Function to manually recalculate progress
  const handleRecalculateProgress = async () => {
    if (!project?.name) return;
    
    setIsCalculatingProgress(true);
    try {
      await updateProjectProgress(project.name);
      // Refresh project data
      await refreshProject();
    } catch (error) {
      console.error('Error recalculating project progress:', error);
    } finally {
      setIsCalculatingProgress(false);
    }
  };

  // Function to refresh subtask data after update
  const handleRefreshSubTask = async () => {
    if (selectedSubTask?.name) {
      try {
        await refreshSubTask();
      } catch (error) {
        console.error('Error refreshing subtask data:', error);
      }
    }
  };

  // Function to refresh task data after update
  const handleRefreshTask = async () => {
    if (selectedTask?.name) {
      try {
        await refreshTask();
      } catch (error) {
        console.error('Error refreshing task data:', error);
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

  // Auto-update project progress when phases or tasks change
  useEffect(() => {
    if (calculatedProgress.source !== 'manual' && project?.name) {
      const currentDbProgress = fullProjectData?.percent_complete || project?.percent_complete || 0;
      if (Math.abs(calculatedProgress.progress - currentDbProgress) > 1) {
        // Only update if there's a significant difference (more than 1%)
        handleRecalculateProgress();
      }
    }
  }, [calculatedProgress.progress, projectPhases, projectTasks]);

  // Form hooks for member management
  const addMemberForm = useForm<MemberFormData>();
  const editMemberForm = useForm<MemberFormData>();
  const editOwnerForm = useForm<OwnerFormData>();

  // Loading state for operations
  const [updatingProject, setUpdatingProject] = useState(false);

  // Functions for member management
  const handleAddMember = async (data: MemberFormData) => {
    if (!project?.name) return;

    setUpdatingProject(true);
    try {
      const currentUsers = projectUsers || [];

      // Check if user already exists
      const existingUser = currentUsers.find((u: any) => u.user === data.user);
      if (existingUser) {
        alert('User is already a member of this project');
        return;
      }

      // Use direct API call to add child table row  
      await insertCall({
        doc: {
          doctype: 'Project User',
          parent: project.name,
          parenttype: 'Project',
          parentfield: 'users',
          user: data.user,
          view_attachments: 1,
          hide_timesheets: 0,
          project_status: 'Open',
          welcome_email_sent: 1, // Flag to skip email
        }
      });

      // Refresh data and close dialog
      setTimeout(() => refreshProject(), 1000);
      setShowAddMemberDialog(false);
      addMemberForm.reset();
    } catch (error) {
      console.error('Error adding member:', error);

      // Check if it's email error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Email Account') || errorMessage.includes('OutgoingEmailError') || errorMessage.includes('email')) {
        // Email error - member might still be added, just email failed
        alert('Member may have been added, but welcome email failed. Please check the project members list and refresh if needed.');
        // Refresh data to see if member was actually added
        setTimeout(() => refreshProject(), 1000);
        setShowAddMemberDialog(false);
        addMemberForm.reset();
      } else {
        alert('Failed to add member: ' + errorMessage);
      }
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleEditMember = async (data: MemberFormData) => {
    if (!editingMember || !project?.name) return;

    setUpdatingProject(true);
    try {
      // Find the Project User record to update
      const userRecord = projectUsers.find((u: any) => u.user === editingMember.user);
      if (!userRecord?.name) {
        alert('User record not found');
        return;
      }

      // Use direct API call to update child table row
      await saveCall({
        doc: {
          doctype: 'Project User',
          name: userRecord.name,
          view_attachments: data.view_attachments ? 1 : 0,
          hide_timesheets: data.hide_timesheets ? 1 : 0,
          project_status: data.project_status || '',
        }
      });

      // Refresh data and close dialog
      setTimeout(() => refreshProject(), 1000);
      setShowEditMemberDialog(false);
      setEditingMember(null);
      editMemberForm.reset();
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member');
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleRemoveMember = async (userToRemove: string) => {
    if (!project?.name) return;

    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      // Find the Project User record to delete
      const userRecord = projectUsers.find((u: any) => u.user === userToRemove);
      if (!userRecord?.name) {
        alert('User record not found');
        return;
      }

      // Use direct API call to delete child table row
      await deleteCall({
        doctype: 'Project User',
        name: userRecord.name
      });

      // Refresh data
      setTimeout(() => refreshProject(), 1000);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const openEditMemberDialog = (member: ProjectUser) => {
    setEditingMember(member);
    editMemberForm.reset({
      user: member.user,
      view_attachments: !!member.view_attachments,
      hide_timesheets: !!member.hide_timesheets,
      project_status: member.project_status || '',
    });
    setShowEditMemberDialog(true);
  };

  // Check if current user is the project owner
  const isCurrentUserOwner = () => {
    return project?.owner === currentUser || currentUser === 'Administrator';
  };

  const handleEditOwner = async (data: OwnerFormData) => {
    if (!project?.name) return;

    setUpdatingProject(true);
    try {
      // Refresh to get latest data first
      await refreshProject();

      // Get the complete project document
      const fullProject = fullProjectData || project;

      // Method 1: Try updating with complete document including owner change
      try {
        await saveCall({
          doc: {
            doctype: 'Project',
            name: project.name,
            owner: data.owner,
            // Include all existing fields to avoid data loss
            project_name: fullProject?.project_name,
            status: fullProject?.status,
            priority: fullProject?.priority,
            company: fullProject?.company,
            customer: fullProject?.customer,
            expected_start_date: fullProject?.expected_start_date,
            expected_end_date: fullProject?.expected_end_date,
            description: fullProject?.description,
            // Include any other fields that exist
            modified: new Date().toISOString(),
            modified_by: data.owner
          }
        });
      } catch (saveError) {
        console.log('Save method failed:', saveError);
        // Method 2: Try using set_value (this might work in some ERPNext versions)
        try {
          await setValueCall({
            doctype: 'Project',
            name: project.name,
            fieldname: 'owner',
            value: data.owner
          });
        } catch (setValueError) {
          console.log('Set value failed, falling back to Project Manager approach:', setValueError);

          // Fallback: Add user as Project Manager since owner field cannot be changed
          const currentUsers = projectUsers || [];
          const existingUser = currentUsers.find((u: any) => u.user === data.owner);

          if (existingUser) {
            alert('Cannot change owner field (protected by ERPNext), but user is already a project member. Please edit their role manually.');
            return;
          }

          // Add as Project Manager
          await insertCall({
            doc: {
              doctype: 'Project User',
              parent: project.name,
              parenttype: 'Project',
              parentfield: 'users',
              user: data.owner,
              view_attachments: 1,
              hide_timesheets: 0,
              project_status: 'Project Manager (Owner Substitute)',
              welcome_email_sent: 1,
            }
          });

          alert('Owner field is protected by ERPNext. Added user as "Project Manager (Owner Substitute)" instead with full permissions.');
        }
      }

      // Refresh data and close dialog
      setTimeout(() => refreshProject(), 1000);
      setShowEditOwnerDialog(false);
      editOwnerForm.reset();

    } catch (error) {
      console.error('Error changing owner:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Cannot edit standard fields') || errorMessage.includes('protects this field')) {
        alert(`Cannot change project owner: ERPNext protects the owner field from modification.

Alternative solutions:
1. Add the user as Project Manager in the team members
2. Contact system administrator to manually update via backend
3. Use project permissions to grant the user full access

Admin command (run in ERPNext console):
frappe.db.sql("UPDATE tabProject SET owner = '${data.owner}' WHERE name = '${project.name}'")`);
      } else {
        alert('Failed to change owner: ' + errorMessage);
      }
    } finally {
      setUpdatingProject(false);
    }
  };

  const getStatusColor = (status?: "Open" | "Completed" | "Cancelled") => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

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
    onClose(); // Close the detail drawer after successful deletion
  };

  if (!project) return null;

  // Use fullProjectData if available, fallback to project prop
  const currentProject = fullProjectData || project;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent>
        <div className="w-full h-full overflow-y-auto p-6">
          <DrawerHeader className="px-0 pb-6">
            <DrawerTitle className="flex gap-4 justify-between">
              <div className='flex items-center gap-4'>
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {currentProject.project_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentProject.project_name}</h2>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(currentProject.status)}`}>
                      {currentProject.status || 'Open'}
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
                <Button variant="ghost" size="sm" onClick={onClose}>
                  X
                </Button>
              </div>
            </DrawerTitle>
            <DrawerDescription className="text-lg text-gray-600 mt-4">
              Project Details and Progress Overview
            </DrawerDescription>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mt-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Tasks & Phases
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'team'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Users className="h-4 w-4" />
                Team ({(projectUsers?.length || 0) + 1})
              </button>
              {selectedPhase && (
                <button
                  onClick={() => setActiveTab('phase-details')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'phase-details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  📋 {selectedPhase.subject}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhase(null);
                      setActiveTab('tasks');
                    }}
                    className="ml-2 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                    title="Close phase details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                </button>
              )}
              {selectedTask && (
                <button
                  onClick={() => setActiveTab('task-details')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'task-details'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  📝 {selectedTask.subject || selectedTask.name}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(null);
                      setActiveTab('tasks');
                    }}
                    className="ml-2 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                    title="Close task details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                </button>
              )}
              {selectedSubTask && (
                <button
                  onClick={() => setActiveTab('subtask-details')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'subtask-details'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  📌 {selectedSubTask.subject || selectedSubTask.name}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubTask(null);
                      setActiveTab('tasks');
                    }}
                    className="ml-2 hover:bg-gray-200 rounded-full p-1 transition-colors cursor-pointer"
                    title="Close subtask details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          </DrawerHeader>

          <div className="space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Progress Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-gray-700">Overall Progress</span>
                        {calculatedProgress.source !== 'manual' && (
                          <span className="text-xs text-gray-500">
                            (from {calculatedProgress.count} {calculatedProgress.source})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">{calculatedProgress.progress}%</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRecalculateProgress}
                          disabled={isCalculatingProgress}
                          className="h-8 w-8 p-0"
                          title="Recalculate progress"
                        >
                          <RefreshCw className={`h-4 w-4 ${isCalculatingProgress ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${calculatedProgress.progress}%` }}
                      ></div>
                    </div>
                    {calculatedProgress.source === 'phases' && projectPhases && (
                      <div className="mt-3 text-xs text-gray-500">
                        <div className="font-medium mb-1">Phase progress breakdown:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {projectPhases.map((phase: any, index: number) => (
                            <div key={phase.name} className="flex justify-between">
                              <span>Phase {index + 1}:</span>
                              <span>{phase.progress || 0}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {calculatedProgress.source === 'tasks' && (
                      <div className="mt-3 text-xs text-gray-500">
                        Progress calculated from {calculatedProgress.count} direct tasks (no phases)
                      </div>
                    )}
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
                        <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Customer</p>
                        <p className="text-xl font-bold text-gray-900">{currentProject.customer || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Budget</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(currentProject.estimated_costing)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Calendar className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Deadline</p>
                        <p className="text-xl font-bold text-gray-900">{formatDate(currentProject.expected_end_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Start Date</span>
                        <span className="text-gray-900 font-semibold">{formatDate(currentProject.expected_start_date)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Priority</span>
                        <span className="text-gray-900 font-semibold">{currentProject.priority || 'Medium'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Department</span>
                        <span className="text-gray-900 font-semibold">{currentProject.department || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-600 font-medium">Company</span>
                        <span className="text-gray-900 font-semibold">{currentProject.company || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Financial Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Cost</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(currentProject.total_costing_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Sales</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(currentProject.total_sales_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Billable Amount</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(currentProject.total_billable_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-600 font-medium">Gross Margin</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(currentProject.gross_margin)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                {/* Project Owner Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Crown className="h-6 w-6 text-yellow-600" />
                      <h3 className="text-xl font-semibold text-gray-900">Project Owner</h3>
                    </div>
                    {isCurrentUserOwner() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          editOwnerForm.reset({ owner: project?.owner || '' });
                          setShowEditOwnerDialog(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Change Owner
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">
                        {ownerLoading ? (
                          "Loading..."
                        ) : ownerData?.full_name ? (
                          ownerData.full_name
                        ) : currentProject?.owner ? (
                          currentProject.owner
                        ) : (
                          'No Owner'
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ownerLoading ? (
                          "Loading email..."
                        ) : ownerData?.email ? (
                          ownerData.email
                        ) : currentProject?.owner ? (
                          currentProject.owner
                        ) : (
                          'No email'
                        )}
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
                      <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
                      <span className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                        {projectUsers?.length || 0} members
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
                      <span className="ml-3 text-gray-600">Loading team members...</span>
                    </div>
                  ) : projectUsers && projectUsers.length > 0 ? (
                    <div className="grid gap-4">
                      {projectUsers.map((member: any, index: number) => (
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
                                {(member.full_name || member.user || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {member.full_name || member.user || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {member.email || member.user || 'No email'}
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
                              className="text-xs"
                              onClick={() => openEditMemberDialog(member)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
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
                      <p className="text-gray-600 text-lg font-medium">No team members added yet</p>
                      <p className="text-gray-500 text-sm mt-2">Add team members to collaborate on this project</p>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddMemberDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Member
                      </Button>
                    </div>
                  )}
                </div>

                {/* Project Statistics */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{(projectUsers?.length || 0) + 1}</p>
                      <p className="text-sm text-gray-600">Total Members</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">1</p>
                      <p className="text-sm text-gray-600">Project Owner</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{projectUsers?.length || 0}</p>
                      <p className="text-sm text-gray-600">Team Members</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{project?.percent_complete || 0}%</p>
                      <p className="text-sm text-gray-600">Progress</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <ProjectTaskManagement
                  projectName={project.name}
                  onViewPhaseDetails={(phase) => {
                    setSelectedPhase(phase);
                    setActiveTab('phase-details');
                  }}
                  onViewTaskDetails={(task) => {
                    setSelectedTask(task);
                    setActiveTab('task-details');
                  }}
                  onViewSubTaskDetails={(subtask) => {
                    setSelectedSubTask(subtask);
                    setActiveTab('subtask-details');
                  }}
                />
              </div>
            )}

            {activeTab === 'phase-details' && selectedPhase && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <PhaseDetails
                  phase={selectedPhase}
                  projectName={project.name}
                  onBack={() => setActiveTab('tasks')}
                  onViewTaskDetails={(task) => {
                    setSelectedTask(task);
                    setActiveTab('task-details');
                  }}
                  onPhaseUpdated={async () => {
                    // Refresh project data when phase is updated
                    refreshProject();
                    // Also recalculate project progress
                    setTimeout(async () => {
                      await handleRecalculateProgress();
                    }, 500);
                  }}
                  onPhaseDeleted={async () => {
                    // Refresh project data and go back to tasks when phase is deleted
                    refreshProject();
                    setActiveTab('tasks');
                    setSelectedPhase(null);
                    // Also recalculate project progress
                    setTimeout(async () => {
                      await handleRecalculateProgress();
                    }, 500);
                  }}
                  onTaskCreated={async () => {
                    // Refresh project data when task is created
                    refreshProject();
                    // Also recalculate project progress
                    setTimeout(async () => {
                      await handleRecalculateProgress();
                    }, 500);
                  }}
                />
              </div>
            )}

            {activeTab === 'task-details' && selectedTask && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <TaskDetails
                  task={selectedTask}
                  projectName={project.name}
                  onBack={() => setActiveTab('tasks')}
                  onViewSubTaskDetails={(subtask) => {
                    setSelectedSubTask(subtask);
                    setActiveTab('subtask-details');
                  }}
                  onTaskUpdated={async () => {
                    // Refresh project data when task is updated
                    refreshProject();
                    // Refresh task data to show updated information
                    await handleRefreshTask();
                    // Also recalculate project progress
                    setTimeout(async () => {
                      await handleRecalculateProgress();
                    }, 500);
                  }}
                  onTaskDeleted={async () => {
                    // Refresh project data and go back to tasks when task is deleted
                    refreshProject();
                    setActiveTab('tasks');
                    setSelectedTask(null);
                    // Also recalculate project progress
                    setTimeout(async () => {
                      await handleRecalculateProgress();
                    }, 500);
                  }}
                />
              </div>
            )}

            {activeTab === 'subtask-details' && selectedSubTask && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <SubTaskDetails
                  subtask={selectedSubTask}
                  projectName={project.name}
                  onBack={() => setActiveTab('tasks')}
                  onSubTaskUpdated={async () => {
                    // Refresh project data when subtask is updated
                    refreshProject();
                    // Refresh subtask data to show updated information
                    await handleRefreshSubTask();
                    // Refresh parent task data to update task progress
                    if (selectedSubTask?.task) {
                      await handleRefreshTaskByName(selectedSubTask.task);
                    }
                    // Also recalculate project progress
                    setTimeout(async () => {
                      await handleRecalculateProgress();
                    }, 500);
                  }}
                  onSubTaskDeleted={async () => {
                    // Refresh project data and go back to tasks when subtask is deleted
                    refreshProject();
                    setActiveTab('tasks');
                    setSelectedSubTask(null);
                    // Also recalculate project progress
                    setTimeout(async () => {
                      await handleRecalculateProgress();
                    }, 500);
                  }}
                />
              </div>
            )}
          </div>

          <DrawerFooter className="px-0 mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 h-12 text-lg font-semibold"
                onClick={() => setActiveTab('tasks')}
              >
                View Tasks
              </Button>
              <Button variant="outline" className="flex-1 h-12 text-lg font-semibold">
                View Timeline
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={addMemberForm.handleSubmit(handleAddMember)}>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to the project team.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>User <span className="text-red-500">*</span></Label>
                <Controller
                  name="user"
                  control={addMemberForm.control}
                  rules={{ required: "Please select a user" }}
                  render={({ field }) => (
                    <Combobox
                      doctype="User"
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select user..."
                      displayField="full_name"
                      valueField="name"
                      filters={[["enabled", "=", 1], ["user_type", "!=", "Website User"]]}
                      fields={["name", "full_name", "email"]}
                      className="w-full"
                    />
                  )}
                />
                {addMemberForm.formState.errors.user && (
                  <span className="text-red-500 text-sm">
                    {addMemberForm.formState.errors.user.message}
                  </span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddMemberDialog(false);
                  addMemberForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingProject}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updatingProject ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditMemberDialog} onOpenChange={setShowEditMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={editMemberForm.handleSubmit(handleEditMember)}>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update member settings for {editingMember?.full_name || editingMember?.user}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>User</Label>
                <Input
                  value={editingMember?.full_name || editingMember?.user || ""}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="grid gap-2">
                <Label>Project Status</Label>
                <Input
                  {...editMemberForm.register("project_status")}
                  placeholder="Enter project status for this member..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_view_attachments"
                  {...editMemberForm.register("view_attachments")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit_view_attachments" className="text-sm">
                  Can view attachments
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_hide_timesheets"
                  {...editMemberForm.register("hide_timesheets")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit_hide_timesheets" className="text-sm">
                  Hide timesheets from this user
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditMemberDialog(false);
                  setEditingMember(null);
                  editMemberForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingProject}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updatingProject ? "Updating..." : "Update Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Owner Dialog */}
      <Dialog open={showEditOwnerDialog} onOpenChange={setShowEditOwnerDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={editOwnerForm.handleSubmit(handleEditOwner)}>
            <DialogHeader>
              <DialogTitle>Change Project Owner</DialogTitle>
              <DialogDescription>
                Attempt to change the project owner. Note: ERPNext may protect this field, in which case we'll add the user as Project Manager instead.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>New Owner <span className="text-red-500">*</span></Label>
                <Controller
                  name="owner"
                  control={editOwnerForm.control}
                  rules={{ required: "Please select a new owner" }}
                  render={({ field }) => (
                    <Combobox
                      doctype="User"
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select new owner..."
                      displayField="full_name"
                      valueField="name"
                      filters={[["enabled", "=", 1], ["user_type", "!=", "Website User"]]}
                      fields={["name", "full_name", "email"]}
                      className="w-full"
                    />
                  )}
                />
                {editOwnerForm.formState.errors.owner && (
                  <span className="text-red-500 text-sm">
                    {editOwnerForm.formState.errors.owner.message}
                  </span>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will attempt to change the actual project owner. If that fails (due to ERPNext protection), the user will be added as "Project Manager (Owner Substitute)" with full permissions.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditOwnerDialog(false);
                  editOwnerForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingProject}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {updatingProject ? "Changing Owner..." : "Change Owner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </Drawer>
  )
}
