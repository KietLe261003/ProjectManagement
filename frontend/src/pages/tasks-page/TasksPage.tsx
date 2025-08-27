import React from 'react';
import { useUserAssignedTasks } from '../../services';
import TaskStatistics from './components/TaskStatistics';
import ListTask from './components/ListTask';
import type { TaskItem } from '@/types';
import FiltersAndSearch from './components/FiltersAndSearch';
import HeaderTask from './components/HeaderTask';

export const TasksPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = React.useState<string>('All');
  const [selectedPriority, setSelectedPriority] = React.useState<string>('All');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [selectedType, setSelectedType] = React.useState<string>('All'); // New filter for Task/SubTask

  // Fetch user's assigned tasks and subtasks
  const { tasks, subTasks, isLoading, error, mutate, currentUser } = useUserAssignedTasks();
  // Transform tasks and subtasks to match the expected TaskItem structure
  const transformedTasks = React.useMemo((): TaskItem[] => {
    const taskItems: TaskItem[] = [];

    // Transform Tasks
    tasks.forEach((task) => {
      taskItems.push({
        id: task.name,
        title: task.subject || 'Untitled Task',
        description: task.description || 'No description available',
        project: task.project_name || task.project || 'Unknown Project',
        assignee: currentUser || 'Unknown',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        dueDate: task.exp_end_date || new Date().toISOString().split('T')[0],
        labels: [task.type || 'Task'],
        todoId: task.assignedTodo?.name || '',
        referenceName: task.name,
        referenceType: 'Task',
        type: 'Task',
        taskProgress: task.progress,
        expectedTime: task.expected_time,
        actualTime: task.actual_time,
        startDate: task.exp_start_date,
        endDate: task.exp_end_date
      });
    });

    // Transform SubTasks
    subTasks.forEach((subTask) => {
      taskItems.push({
        id: subTask.name,
        title: subTask.subject || 'Untitled SubTask',
        description: subTask.description || 'No description available',
        project: subTask.project_name || 'Unknown Project',
        assignee: currentUser || 'Unknown',
        status: subTask.status || 'Open',
        priority: 'Medium', // SubTasks don't have priority field
        dueDate: subTask.end_date || new Date().toISOString().split('T')[0],
        labels: ['SubTask'],
        todoId: subTask.assignedTodo?.name || '',
        referenceName: subTask.name,
        referenceType: 'SubTask',
        type: 'SubTask',
        parentTask: subTask.task_subject,
        startDate: subTask.start_date,
        endDate: subTask.end_date
      });
    });

    return taskItems.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [tasks, subTasks, currentUser]);

  const filteredTasks = React.useMemo((): TaskItem[] => {
    return transformedTasks.filter(task => {
      const statusMatch = selectedStatus === 'All' || task.status === selectedStatus;
      const priorityMatch = selectedPriority === 'All' || task.priority === selectedPriority;
      const typeMatch = selectedType === 'All' || task.type === selectedType;
      const searchMatch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.parentTask && task.parentTask.toLowerCase().includes(searchTerm.toLowerCase()));
      return statusMatch && priorityMatch && typeMatch && searchMatch;
    });
  }, [transformedTasks, selectedStatus, selectedPriority, selectedType, searchTerm]);

  const handleRefresh = () => {
    mutate();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <HeaderTask
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message || 'Failed to load your tasks. Please try again.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <FiltersAndSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />
      {/* Tasks List */}
      <ListTask
        filteredTasks={filteredTasks}
        isLoading={isLoading}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        selectedPriority={selectedPriority}
        onTaskUpdate={handleRefresh}
      />
      <TaskStatistics transformedTasks={transformedTasks} />
    </div>
  );
};
