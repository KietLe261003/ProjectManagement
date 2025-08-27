import { Plus, RefreshCw } from "lucide-react";
interface HeaderTaskProps {
  handleRefresh: () => void;
  isLoading: boolean;
}
const HeaderTask: React.FC<HeaderTaskProps> = ({ handleRefresh, isLoading }) => {
    return (
        <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Tasks
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all your assigned tasks
          </p>
        </div>
        <div className="mt-4 flex space-x-2 md:mt-0 md:ml-4">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </button>
        </div>
      </div>
    );
};

export default HeaderTask;