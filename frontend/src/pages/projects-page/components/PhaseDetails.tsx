import React, { useState } from 'react';
import { ArrowLeft, Calendar, DollarSign, Target, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTask } from './CreateTask';
import { useFrappeGetDocList } from 'frappe-react-sdk';

interface PhaseDetailsProps {
  phase: any;
  projectName: string;
  onBack: () => void;
  onViewTaskDetails?: (task: any) => void;
}

export const PhaseDetails: React.FC<PhaseDetailsProps> = ({ phase, projectName, onBack, onViewTaskDetails }) => {
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  // Fetch tasks for this phase
  const { data: allTasks, isLoading: tasksLoading, mutate: mutateTasks } = useFrappeGetDocList('Task', {
    fields: ['name', 'subject', 'status', 'priority', 'project', 'exp_start_date', 'exp_end_date', 'progress'],
    filters: [['project', '=', projectName]],
    orderBy: { field: 'exp_start_date', order: 'asc' }
  });

  // Filter tasks that belong to this phase (from phase.tasks child table)
  const phaseTasks = React.useMemo(() => {
    if (!allTasks) return [];
    
    // If phase has tasks child table data, filter based on that
    if (phase.tasks && phase.tasks.length > 0) {
      const phaseTaskNames = phase.tasks.map((phaseTask: any) => phaseTask.task);
      return allTasks.filter((task: any) => phaseTaskNames.includes(task.name));
    }
    
    // If no child table data, show all project tasks as fallback
    // (This can happen if child table is not loaded or empty)
    return allTasks;
  }, [allTasks, phase.tasks]);
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </div>

      {/* Phase Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{phase.subject}</h1>
                <p className="text-sm text-gray-600">Phase Details</p>
              </div>
            </div>
            
            {phase.details && (
              <p className="text-gray-700 leading-relaxed">{phase.details}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(phase.status || 'Open')}`}>
              {getStatusIcon(phase.status || 'Open')}
              <span className="font-medium">{phase.status || 'Open'}</span>
            </div>
            {phase.priority && (
              <div className={`px-3 py-1 rounded-full border ${getPriorityColor(phase.priority)}`}>
                <span className="text-sm font-medium">{phase.priority}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Phase Progress</span>
            <span className="text-lg font-bold text-blue-600">{phase.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${phase.progress || 0}%` }}
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
              <p className="text-lg font-bold text-gray-900">{formatDate(phase.start_date)}</p>
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
              <p className="text-lg font-bold text-gray-900">{formatDate(phase.end_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Estimated Cost</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(phase.costing)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Phase Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Phase ID</span>
              <span className="text-gray-900 font-semibold">{phase.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Project</span>
              <span className="text-gray-900 font-semibold">{projectName}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Status</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(phase.status || 'Open')}`}>
                {getStatusIcon(phase.status || 'Open')}
                <span className="font-medium">{phase.status || 'Open'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Priority</span>
              <div className={`px-3 py-1 rounded-full ${getPriorityColor(phase.priority || 'Medium')}`}>
                <span className="font-medium">{phase.priority || 'Medium'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Tasks Count</span>
              <span className="text-gray-900 font-semibold">{phase.tasks?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Duration</span>
              <span className="text-gray-900 font-semibold">
                {phase.start_date && phase.end_date
                  ? `${Math.ceil(
                      (new Date(phase.end_date).getTime() - new Date(phase.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="text-xl font-bold text-blue-600">{phase.progress || 0}%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Estimated Cost</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(phase.costing)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks in this Phase */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Tasks in this Phase</h3>
        </div>

        {tasksLoading ? (
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
                <div className="col-span-5 text-sm font-medium text-gray-700">Task</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Project</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Status</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 text-center">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {phaseTasks && phaseTasks.length > 0 ? (
                phaseTasks.map((task: any, index: number) => (
                  <div key={task.name} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-gray-600">{index + 1}</span>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="p-1 bg-orange-100 rounded">
                        <span className="text-sm">📝</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{task.subject || task.name}</div>
                        <div className="text-sm text-gray-500">{task.name}</div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-sm text-gray-600">{projectName}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status || 'Open')}`}>
                        {task.status || 'Open'}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      {onViewTaskDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTaskDetails(task)}
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
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-lg font-medium mb-1">No tasks yet</div>
                  <div className="text-sm">Click "Add Task" to create the first task for this phase</div>
                </div>
              )}

              {/* Add Task Row */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="col-span-12 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    onClick={() => setIsCreateTaskModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add new task to this phase
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTask
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectName={projectName}
        phaseId={phase.name}
        onSuccess={() => {
          mutateTasks(); // Refresh tasks data
        }}
      />
    </div>
  );
};
