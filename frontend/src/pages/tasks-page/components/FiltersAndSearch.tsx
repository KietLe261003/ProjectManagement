import { Filter, Search } from "lucide-react";
interface  FiltersAndSearchProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    selectedPriority: string;
    setSelectedPriority: (priority: string) => void;
    selectedType: string;
    setSelectedType: (type: string) => void;
}
const FiltersAndSearch: React.FC<FiltersAndSearchProps> = ({
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    selectedType,
    setSelectedType
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Search tasks..."
              />
            </div>

            {/* Status Filter */}
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Working">Working</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Type Filter */}
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="Task">Tasks</option>
              <option value="SubTask">SubTasks</option>
            </select>

            {/* Priority Filter */}
            <select 
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </button>
        </div>
      </div>
    );
};

export default FiltersAndSearch;