import { getPriorityColor, getStatusColor } from "@/utils/color";
import React, { useMemo, useState } from "react";
import { KanbanCard } from "./KanbanCard";
import { Filter, Search } from "lucide-react";


interface UserTasksViewProps {
  isLoading: boolean;
  handleRefresh: () => void;
  activeTab: "list" | "kanban" | "calendar";
  setActiveTab: (tab: "list" | "kanban" | "calendar") => void;
  transformedTasks: any[];
  formatDate: (dateString: string) => {
    formatted: string;
    isOverdue: boolean;
    display: string;
  };
  handleTaskClick: (task: any) => void;
}

const STATUSES = ["Open", "Working", "Overdue", "Pending Review", "Completed"] as const;
const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
const TYPES = ["Task", "SubTask"] as const;

// Bỏ dấu để search tiếng Việt
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const UserTasksView: React.FC<UserTasksViewProps> = ({
  isLoading,
  handleRefresh,
  activeTab,
  setActiveTab,
  transformedTasks,
  formatDate,
  handleTaskClick,
}) => {
  // ========== SEARCH & FILTER STATES ==========
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(""); // '' = all
  const [priority, setPriority] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [startDate, setStartDate] = useState<string>(""); // dueDate from
  const [endDate, setEndDate] = useState<string>(""); // dueDate to

  // Project options (unique)
  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    transformedTasks.forEach((t) => t.project && set.add(t.project));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [transformedTasks]);

  // ========== FILTER LOGIC ==========
  const visibleTasks = useMemo(() => {
    const nq = normalize(q.trim());

    const inRange = (due: string | undefined) => {
      if (!due) return true;
      const d = new Date(due);
      if (Number.isNaN(d.getTime())) return true;
      if (startDate) {
        const sd = new Date(startDate);
        if (d < new Date(sd.getFullYear(), sd.getMonth(), sd.getDate())) return false;
      }
      if (endDate) {
        const ed = new Date(endDate);
        // include end date full day
        const edEnd = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate(), 23, 59, 59, 999);
        if (d > edEnd) return false;
      }
      return true;
    };

    return (transformedTasks || []).filter((t) => {
      // Search (title, project)
      if (nq) {
        const blob =
          normalize(`${t.title || ""} ${t.project || ""} ${t.status || ""} ${t.priority || ""}`);
        if (!blob.includes(nq)) return false;
      }

      // Status
      if (status && t.status !== status) return false;

      // Priority
      if (priority && t.priority !== priority) return false;

      // Type
      if (type && t.type !== type) return false;

      // Project
      if (project && t.project !== project) return false;

      // Overdue toggle
      if (onlyOverdue && t.status !== "Overdue" && !formatDate(t.dueDate).isOverdue) return false;

      // Date range by dueDate
      if (!inRange(t.dueDate)) return false;

      return true;
    });
  }, [q, status, priority, type, project, onlyOverdue, startDate, endDate, transformedTasks, formatDate]);

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setPriority("");
    setType("");
    setProject("");
    setOnlyOverdue(false);
    setStartDate("");
    setEndDate("");
  };

  // Convenience counters for Kanban (the UI hiển thị theo danh sách đã lọc)
  const countByStatus = (s: string) => visibleTasks.filter((t) => t.status === s).length;
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Việc của tôi</h2>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12t1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20"
                />
              </svg>
            )}
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-slate-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("list")}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "list"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setActiveTab("kanban")}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "kanban"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Bảng Kanban
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === "calendar"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Lịch
            </button>
          </nav>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="mt-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
      {/* Header: search + filter toggle */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search box */}
        <div className="relative w-full md:max-w-sm">
          <label className="sr-only">Tìm kiếm</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, dự án, trạng thái..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
          </button>
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Xóa
          </button>
        </div>
      </div>

      {/* Filters area, chỉ hiển thị khi bật */}
      {showFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Tất cả</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Ưu tiên</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Tất cả</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Loại</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Tất cả</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Dự án</label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Tất cả</option>
              {projectOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Hạn từ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Hạn đến</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
      )}
    </div>

        {/* LIST VIEW */}
        {activeTab === "list" && (
          <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-100 rounded-t-lg">
                  <tr>
                    <th scope="col" className="px-6 py-3">Tên công việc</th>
                    <th scope="col" className="px-6 py-3">Loại</th>
                    <th scope="col" className="px-6 py-3">Dự án</th>
                    <th scope="col" className="px-6 py-3">Tiến độ</th>
                    <th scope="col" className="px-6 py-3">Ngày hết hạn</th>
                    <th scope="col" className="px-6 py-3">Ưu tiên</th>
                    <th scope="col" className="px-6 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        {isLoading ? "Đang tải..." : "Không có công việc nào"}
                      </td>
                    </tr>
                  ) : (
                    visibleTasks.map((task) => {
                      return (
                        <tr
                          key={task.id}
                          className="bg-white border-b border-slate-200 hover:bg-slate-50 table-row transition-all cursor-pointer"
                          onClick={() => handleTaskClick(task)}
                        >
                          <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {task.type === "SubTask" && (
                                <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              {task.title}
                            </div>
                            {task.parentTask && (
                              <div className="text-xs text-slate-500 mt-1">↳ Subtask của: {task.parentTask}</div>
                            )}
                          </th>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                task.type === "Task" ? "text-blue-800 bg-blue-100" : "text-purple-800 bg-purple-100"
                              }`}
                            >
                              {task.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">{task.project}</td>
                          <td className="px-6 py-4">
                            {task.taskProgress !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${task.taskProgress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-600 font-medium min-w-[3rem]">
                                  {task.taskProgress}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className={`px-6 py-4 ${formatDate(task.dueDate).isOverdue ? "text-red-600 font-medium" : ""}`}>
                            {formatDate(task.dueDate).display}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`priority-badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`status-badge ${getStatusColor(task.status)}`}>{task.status}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KANBAN */}
        {activeTab === "kanban" && (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Open */}
              <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Cần làm ({countByStatus("Open")})
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter((t) => t.status === "Open").map((task) => (
                    <KanbanCard key={task.id} task={task} onClick={() => handleTaskClick(task)} formatDate={formatDate} />
                  ))}
                </div>
              </div>

              {/* Working */}
              <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Đang làm ({countByStatus("Working")})
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter((t) => t.status === "Working").map((task) => (
                    <KanbanCard key={task.id} task={task} onClick={() => handleTaskClick(task)} formatDate={formatDate} barClass="bg-orange-500" />
                  ))}
                </div>
              </div>

              {/* Overdue */}
              <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Trễ ({countByStatus("Overdue")})
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter((t) => t.status === "Overdue").map((task) => (
                    <KanbanCard key={task.id} task={task} onClick={() => handleTaskClick(task)} formatDate={formatDate} barClass="bg-orange-500" />
                  ))}
                </div>
              </div>

              {/* Pending Review */}
              <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Review ({countByStatus("Pending Review")})
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter((t) => t.status === "Pending Review").map((task) => (
                    <KanbanCard key={task.id} task={task} onClick={() => handleTaskClick(task)} formatDate={formatDate} barClass="bg-orange-500" />
                  ))}
                </div>
              </div>

              {/* Completed */}
              <div className="bg-slate-100 rounded-xl p-4 min-h-[300px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Hoàn thành ({countByStatus("Completed")})
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter((t) => t.status === "Completed").map((task) => (
                    <KanbanCard key={task.id} task={task} onClick={() => handleTaskClick(task)} formatDate={formatDate} completed />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar placeholder */}
        {activeTab === "calendar" && (
          <div className="mt-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="text-center text-slate-500">
              <p>Giao diện lịch sẽ được phát triển trong tương lai</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};



export default UserTasksView;
