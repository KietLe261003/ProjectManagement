import React, { useState } from 'react';
import { ArrowLeft, Calendar, Target, AlertCircle, CheckCircle2, Clock, User, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateSubTask } from '../subtask/CreateSubTask';
import { useFrappeGetDocList, useFrappeGetDoc } from 'frappe-react-sdk';
import EditTask from './EditTask';
import DeleteTask from './DeleteTask';
import { useProjectProgressUpdate } from '@/hooks/useProjectProgressUpdate';
import { useTaskProgressCalculation } from '@/services/taskProgressService';
import { FileAttachments } from '@/components/FileAttachments';

interface TaskDetailsProps {
  task: any;
  projectName: string;
  onBack: () => void;
  onViewSubTaskDetails?: (subtask: any) => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({ 
  task, 
  projectName, 
  onBack, 
  onViewSubTaskDetails,
  onTaskUpdated,
  onTaskDeleted
}) => {
  const [isCreateSubTaskModalOpen, setIsCreateSubTaskModalOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);

  // Hook for updating phase progress when task changes
  const { updatePhaseProgressForTask } = useProjectProgressUpdate();
  
  // Hook for updating task progress when subtasks change
  const { calculateAndUpdateTaskProgress } = useTaskProgressCalculation();

  // Fetch subtasks for this task
  const { data: taskSubTasks, isLoading: subtasksLoading, mutate: mutateSubTasks } = useFrappeGetDocList('SubTask', {
    fields: ['name', 'subject', 'task', 'status', 'progress', 'start_date', 'end_date', 'description'],
    filters: [['task', '=', task.name]],
    orderBy: { field: 'start_date', order: 'asc' },
    limit: 0 // Get all subtasks
  });

  // Fetch assignment information for this task
  const { data: taskAssignment } = useFrappeGetDocList('ToDo', {
    fields: ['name', 'allocated_to', 'status'],
    filters: [['reference_type', '=', 'Task'], ['reference_name', '=', task.name]],
    limit: 1
  });

  // Get assigned user info if available
  const assignedUser = taskAssignment && taskAssignment.length > 0 ? taskAssignment[0].allocated_to : null;
  const { data: userInfo } = useFrappeGetDoc('User', assignedUser || undefined, {
    fields: ['name', 'full_name', 'email', 'user_image']
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'Working':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Open':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Working':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditSuccess = () => {
    if (onTaskUpdated) {
      onTaskUpdated();
    }
    // Update phase progress when task is updated
    updatePhaseProgressForTask(task.name, projectName).catch(console.error);
  };

  const handleDeleteSuccess = () => {
    if (onTaskDeleted) {
      onTaskDeleted();
    }
    // Update phase progress when task is deleted
    updatePhaseProgressForTask(task.name, projectName).catch(console.error);
    onBack(); // Navigate back after deletion
  };

  // Component riêng cho SubTask Assignment để tránh vi phạm Rules of Hooks
  const SubTaskAssignment: React.FC<{ subtask: any }> = ({ subtask }) => {
    const { data: assignmentData } = useFrappeGetDocList('ToDo', {
      fields: ['name', 'allocated_to'],
      filters: [['reference_type', '=', 'SubTask'], ['reference_name', '=', subtask?.name || '']],
    });
    const assignedUser = assignmentData?.[0]?.allocated_to;
    return (
      <div className="flex items-center gap-2">
        <span>{assignedUser}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
        
        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditTaskOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteTaskOpen(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Task
          </Button>
        </div>
      </div>

      {/* Task Header */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-lg bg-orange-500 flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.subject}</h1>
                <p className="text-sm text-gray-600">Task Details</p>
              </div>
            </div>
            
            {task.description && (
              <p className="text-gray-700 leading-relaxed">{task.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(task.status || 'Open')}`}>
              {getStatusIcon(task.status || 'Open')}
              <span className="font-medium">{task.status || 'Open'}</span>
            </div>
            {task.priority && (
              <div className={`px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                <span className="text-sm font-medium">{task.priority}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Task Progress</span>
            <span className="text-lg font-bold text-orange-600">{task.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-500 to-yellow-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${task.progress || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Start Date</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(task.exp_start_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">End Date</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(task.exp_end_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Assigned To</p>
              {taskAssignment && taskAssignment.length > 0 ? (
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {userInfo?.full_name || assignedUser}
                  </p>
                  {userInfo?.email && (
                    <p className="text-sm text-gray-600">{userInfo.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-900">Unassigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Task Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Task ID</span>
              <span className="text-gray-900 font-semibold">{task.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Project</span>
              <span className="text-gray-900 font-semibold">{projectName}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Status</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(task.status || 'Open')}`}>
                {getStatusIcon(task.status || 'Open')}
                <span className="font-medium">{task.status || 'Open'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Priority</span>
              <div className={`px-3 py-1 rounded-full ${getPriorityColor(task.priority || 'Medium')}`}>
                <span className="font-medium">{task.priority || 'Medium'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Subtasks Count</span>
              <span className="text-gray-900 font-semibold">{taskSubTasks?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Duration</span>
              <span className="text-gray-900 font-semibold">
                {task.exp_start_date && task.exp_end_date
                  ? `${Math.ceil(
                      (new Date(task.exp_end_date).getTime() - new Date(task.exp_start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="text-xl font-bold text-orange-600">{task.progress || 0}%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Assigned To</span>
              {taskAssignment && taskAssignment.length > 0 ? (
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {userInfo?.full_name || assignedUser}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-900">Unassigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SubTasks */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">SubTasks</h3>
        </div>

        {subtasksLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-3">
                <div className="col-span-1 text-sm font-medium text-gray-700">#</div>
                <div className="col-span-5 text-sm font-medium text-gray-700">SubTask</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Status</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Assign To</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {taskSubTasks && taskSubTasks.length > 0 ? (
                taskSubTasks.map((subtask: any, index: number) => (
                  <div key={subtask.name} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-gray-600">{index + 1}</span>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="p-1 bg-green-100 rounded">
                        <span className="text-sm">✅</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{subtask.subject || subtask.name}</div>
                        <div className="text-sm text-gray-500">{subtask.name}</div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subtask.status || 'Open')}`}>
                        {subtask.status || 'Open'}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <SubTaskAssignment subtask={subtask} />
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      {onViewSubTaskDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewSubTaskDetails(subtask)}
                          className="h-7 px-2 text-xs"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-lg font-medium mb-1">No subtasks yet</div>
                  <div className="text-sm">Click "Add SubTask" to create the first subtask for this task</div>
                </div>
              )}

              {/* Add SubTask Row */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="col-span-12 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    onClick={() => setIsCreateSubTaskModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add new subtask to this task
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Files Section */}
      <FileAttachments
        doctype="Task"
        docname={task.name}
        title="Task Files"
        allowUpload={true}
        allowDelete={true}
        className="mt-8"
      />

      {/* Create SubTask Modal */}
      <CreateSubTask
        isOpen={isCreateSubTaskModalOpen}
        onClose={() => setIsCreateSubTaskModalOpen(false)}
        projectName={projectName}
        parentTask={task.name}
        onSuccess={async () => {
          // console.log('SubTask created successfully for task:', task.name);
          mutateSubTasks(); // Refresh subtasks data
          
          // Recalculate task progress based on subtasks
          setTimeout(async () => {
            // console.log('Recalculating task progress after subtask creation...');
            await calculateAndUpdateTaskProgress(task.name);
            
            // Then update phase progress
            setTimeout(async () => {
              // console.log('Updating phase progress after task progress update...');
              await updatePhaseProgressForTask(task.name, projectName);
            }, 500);
          }, 500);
        }}
      />

      {/* Edit Task Dialog */}
      <EditTask
        task={task}
        projectName={projectName}
        isOpen={isEditTaskOpen}
        onClose={() => setIsEditTaskOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Task Dialog */}
      <DeleteTask
        task={task}
        isOpen={isDeleteTaskOpen}
        onClose={() => setIsDeleteTaskOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};
