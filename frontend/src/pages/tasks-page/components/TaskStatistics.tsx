interface TaskStatisticsProps {
    transformedTasks: Array<{ status: string }>;
}
const TaskStatistics: React.FC<TaskStatisticsProps> = ({ transformedTasks }) => {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {transformedTasks.filter(t => t.status === 'Todo').length}
            </div>
            <div className="text-sm text-gray-500">Todo</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {transformedTasks.filter(t => t.status === 'In Progress').length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {transformedTasks.filter(t => t.status === 'Done').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {transformedTasks.length}
            </div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
        </div>
      </div>
    );
};

export default TaskStatistics;