import type { TaskItem } from "@/types";
import { Calendar, Flag, User, Clock, BarChart3, ArrowRight } from "lucide-react";
import { useState } from "react";
import TaskEditModal from "./TaskEditModal";

interface ListTaskProps {
    filteredTasks: TaskItem[];
    isLoading: boolean;
    searchTerm: string;
    selectedStatus: string;
    selectedPriority: string;
    onTaskUpdate?: () => void; // Add callback for task updates
}
const statusColors = {
  'Open': 'bg-gray-100 text-gray-800',
  'Working': 'bg-blue-100 text-blue-800',
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
  'Overdue': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-orange-100 text-orange-800',
  'Urgent': 'bg-red-100 text-red-800'
};

const typeColors = {
  'Task': 'bg-blue-100 text-blue-800',
  'SubTask': 'bg-purple-100 text-purple-800'
};
const ListTask: React.FC<ListTaskProps> = ({ 
  filteredTasks, 
  isLoading, 
  searchTerm, 
  selectedStatus, 
  selectedPriority, 
  onTaskUpdate 
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };
function truncateString(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + "...";
}
  const handleTaskUpdated = () => {
    if (onTaskUpdate) {
      onTaskUpdate();
    }
    handleCloseModal();
  };
    return (
       <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              My Assigned Tasks ({filteredTasks.length})
            </h3>
            {isLoading && (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </div>
        </div>
         <div className="divide-y divide-gray-200">
          {isLoading && filteredTasks.length === 0 ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading your tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">
                {searchTerm || selectedStatus !== 'All' || selectedPriority !== 'All' 
                  ? 'No tasks match your current filters.' 
                  : 'No tasks assigned to you yet.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div 
                key={task.id} 
                className="p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start space-x-4">
                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${typeColors[task.type as keyof typeof typeColors]}`}>
                            {task.type}
                          </span>
                          {task.title}
                        </h4>
                        
                        {/* Parent Task Info for SubTasks */}
                        {task.type === 'SubTask' && task.parentTask && (
                          <p className="text-xs text-gray-500 mb-1 flex items-center">
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Parent Task: {task.parentTask}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {truncateString(task.description, 100)}
                        </p>
                        
                        {/* Task Progress and Time Info for Tasks */}
                        {task.type === 'Task' && (
                          <div className="flex items-center space-x-4 mb-2 text-xs text-gray-600">
                            {task.taskProgress !== undefined && (
                              <div className="flex items-center">
                                <BarChart3 className="mr-1 h-3 w-3" />
                                Progress: {task.taskProgress}%
                              </div>
                            )}
                            {task.expectedTime && (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                Expected: {task.expectedTime}h
                              </div>
                            )}
                            {task.actualTime && (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                Actual: {task.actualTime}h
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Labels */}
                        <div className="flex items-center space-x-2 mb-3">
                          {task.labels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {label}
                            </span>
                          ))}
                          {task.referenceName && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {task.referenceName}
                            </span>
                          )}
                        </div>

                        {/* Task Meta */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {task.type === 'SubTask' ? (
                              task.startDate && task.endDate ? 
                                `${task.startDate} → ${task.endDate}` : 
                                task.dueDate
                            ) : (
                              task.dueDate
                            )}
                          </div>
                          <div className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            {task.assignee}
                          </div>
                          <div className="flex items-center">
                            <span>{task.project}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status and Priority */}
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {task.status}
                        </span>
                        {task.type === 'Task' && task.priority && (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}`}>
                            <Flag className="mr-1 h-3 w-3" />
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Task Edit Modal */}
        <TaskEditModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleTaskUpdated}
        />
      </div>
    );
};

export default ListTask;