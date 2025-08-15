import React, { useState } from 'react';
import { ArrowLeft, Calendar, Target, AlertCircle, CheckCircle2, Clock, FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditSubTask from './EditSubTask';
import DeleteSubTask from './DeleteSubTask';

interface SubTaskDetailsProps {
  subtask: any;
  projectName: string;
  onBack: () => void;
  onSubTaskUpdated?: () => void;
  onSubTaskDeleted?: () => void;
}

export const SubTaskDetails: React.FC<SubTaskDetailsProps> = ({ 
  subtask, 
  projectName, 
  onBack,
  onSubTaskUpdated,
  onSubTaskDeleted
}) => {
  const [isEditSubTaskOpen, setIsEditSubTaskOpen] = useState(false);
  const [isDeleteSubTaskOpen, setIsDeleteSubTaskOpen] = useState(false);

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

  const handleEditSuccess = () => {
    if (onSubTaskUpdated) {
      onSubTaskUpdated();
    }
  };

  const handleDeleteSuccess = () => {
    if (onSubTaskDeleted) {
      onSubTaskDeleted();
    }
    onBack(); // Navigate back after deletion
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
            onClick={() => setIsEditSubTaskOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit SubTask
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteSubTaskOpen(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete SubTask
          </Button>
        </div>
      </div>

      {/* SubTask Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-lg bg-green-500 flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{subtask.subject}</h1>
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
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">SubTask Progress</span>
            <span className="text-lg font-bold text-green-600">{subtask.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${subtask.progress || 0}%` }}
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
              <p className="text-lg font-bold text-gray-900">{formatDate(subtask.start_date)}</p>
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
              <p className="text-lg font-bold text-gray-900">{formatDate(subtask.end_date)}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">Parent Task</p>
              <p className="text-lg font-bold text-gray-900">{subtask.task || 'N/A'}</p>
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
              <span className="text-gray-600 font-medium">Start Date</span>
              <span className="text-gray-900 font-semibold">{formatDate(subtask.start_date)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">End Date</span>
              <span className="text-gray-900 font-semibold">{formatDate(subtask.end_date)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Duration</span>
              <span className="text-gray-900 font-semibold">
                {subtask.start_date && subtask.end_date
                  ? `${Math.ceil(
                      (new Date(subtask.end_date).getTime() - new Date(subtask.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="text-xl font-bold text-green-600">{subtask.progress || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {subtask.description && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {subtask.description}
            </p>
          </div>
        </div>
      )}

      {/* Activity Timeline Placeholder */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Activity Timeline</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-lg font-medium mb-1">No activity yet</div>
          <div className="text-sm">Activity and updates will appear here when available</div>
        </div>
      </div>

      {/* Edit SubTask Dialog */}
      <EditSubTask
        subtask={subtask}
        isOpen={isEditSubTaskOpen}
        onClose={() => setIsEditSubTaskOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete SubTask Dialog */}
      <DeleteSubTask
        subtask={subtask}
        isOpen={isDeleteSubTaskOpen}
        onClose={() => setIsDeleteSubTaskOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};
