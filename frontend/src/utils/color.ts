export const getStatusColor = (status: string) => {
  switch (status) {
    case "Working":
      return "text-orange-800 bg-orange-100";
    case "Open":
      return "text-sky-800 bg-sky-100";
    case "Completed":
      return "text-emerald-800 bg-emerald-100";
    case "Cancelled":
      return "text-red-800 bg-red-100";
    default:
      return "text-slate-800 bg-slate-100";
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "text-red-800 bg-red-100";
    case "Medium":
      return "text-amber-800 bg-amber-100";
    case "Low":
      return "text-green-800 bg-green-100";
    default:
      return "text-slate-800 bg-slate-100";
  }
};
