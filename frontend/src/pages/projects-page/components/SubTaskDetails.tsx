import React from 'react';
import { ArrowLeft, Calendar, Target, AlertCircle, CheckCircle2, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubTaskDetailsProps {
  subtask: any;
  projectName: string;
  onBack: () => void;
}

export const SubTaskDetails: React.FC<SubTaskDetailsProps> = ({ subtask, projectName, onBack }) => {
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
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
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

      {/* SubTask Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-lg bg-purple-500 flex items-center justify-center">
                <span className="text-xl">📌</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{subtask.subject || subtask.name}</h1>
                <p className="text-sm text-gray-600">SubTask Details</p>
              </div>
            </div>
            
            {subtask.description && (
              <p className="text-gray-700 leading-relaxed">{subtask.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(subtask.status || 'Open')}`}>
              {getStatusIcon(subtask.status || 'Open')}
              <span className="font-medium">{subtask.status || 'Open'}</span>
            </div>
            {subtask.priority && (
              <div className={`px-3 py-1 rounded-full border ${getPriorityColor(subtask.priority)}`}>
                <span className="text-sm font-medium">{subtask.priority}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">SubTask Progress</span>
            <span className="text-lg font-bold text-purple-600">{subtask.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${subtask.progress || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Expected Start</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(subtask.expected_start_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Target className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-pink-600 uppercase tracking-wide">Expected End</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(subtask.expected_end_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SubTask Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">SubTask Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">SubTask ID</span>
              <span className="text-gray-900 font-semibold">{subtask.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Project</span>
              <span className="text-gray-900 font-semibold">{projectName}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Parent Task</span>
              <span className="text-gray-900 font-semibold">{subtask.task || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Status</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(subtask.status || 'Open')}`}>
                {getStatusIcon(subtask.status || 'Open')}
                <span className="font-medium">{subtask.status || 'Open'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Priority</span>
              <div className={`px-3 py-1 rounded-full ${getPriorityColor(subtask.priority || 'Medium')}`}>
                <span className="font-medium">{subtask.priority || 'Medium'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="text-xl font-bold text-purple-600">{subtask.progress || 0}%</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Created</span>
              <span className="text-gray-900 font-semibold">{formatDate(subtask.creation)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Modified</span>
              <span className="text-gray-900 font-semibold">{formatDate(subtask.modified)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Information */}
      {(subtask.assigned_to || subtask.assigned_to_full_name) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Assignment</h3>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{subtask.assigned_to_full_name || subtask.assigned_to}</p>
              <p className="text-sm text-gray-500">Assigned To</p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {subtask.description && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Description
          </h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{subtask.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};
