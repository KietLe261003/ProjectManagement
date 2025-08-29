import { getPriorityColor } from "@/utils/color";

// Small Kanban card component to keep the parent clean
export const KanbanCard: React.FC<{
  task: any;
  onClick: () => void;
  formatDate: (d: string) => { formatted: string; isOverdue: boolean; display: string };
  barClass?: string;
  completed?: boolean;
}> = ({ task, onClick, formatDate, barClass = "bg-indigo-600", completed = false }) => {
  return (
    <div
      className={`kanban-card bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer ${
        completed ? "opacity-70" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <p className={`font-semibold text-slate-900 flex-1 ${completed ? "line-through" : ""}`}>{task.title}</p>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
            task.type === "Task" ? "text-blue-800 bg-blue-100" : "text-purple-800 bg-purple-100"
          }`}
        >
          {task.type}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">{task.project}</p>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-600">Tiến độ</span>
          <span className="text-xs text-slate-600 font-medium">
            {completed ? "100%" : `${task.taskProgress ?? 0}%`}
          </span>
        </div>
        <div className="bg-slate-200 rounded-full h-1.5">
          <div
            className={`${completed ? "bg-emerald-500" : barClass} h-1.5 rounded-full`}
            style={{ width: completed ? "100%" : `${task.taskProgress ?? 0}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`priority-badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
        <span className="text-xs text-slate-500">{formatDate(task.dueDate).formatted}</span>
      </div>
    </div>
  );
};