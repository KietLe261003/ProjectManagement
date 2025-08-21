import React from 'react';
import { Activity, CheckCircle, DollarSign, Clock, CurrencyIcon, PiggyBank } from 'lucide-react';
import type { Project, Task } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface DashboardMetricsProps {
  projects: Project[];
  tasks: Task[];
  selectedProject?: string | null; // Thêm prop để biết có filter theo dự án cụ thể không
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ projects, tasks, selectedProject }) => {
  // Kiểm tra xem có đang filter theo dự án cụ thể không (selectedProject !== 'all')
  const isProjectSpecific = selectedProject && selectedProject !== 'all';
  const entityLabel = isProjectSpecific ? 'Task' : 'Dự án';
  
  let activeCount, completedCount, overdueCount, totalCost;
  
  if (isProjectSpecific) {
    // Logic tính toán cho Tasks (khi đã chọn dự án cụ thể)
    activeCount = tasks.filter(t => 
      t.status === 'Open' || t.status === 'Working' || 
      (t.status !== 'Completed' && t.status !== 'Cancelled')
    ).length;
    
    completedCount = tasks.filter(t => 
      t.status === 'Completed'
    ).length;
    
    // Tasks quá hạn
    const today = new Date();
    overdueCount = tasks.filter(t => {
      if (!t.exp_end_date) return false;
      const endDate = new Date(t.exp_end_date);
      return endDate < today && t.status !== 'Completed';
    }).length;
    
    // Tổng thời gian tasks (expected_time)
    totalCost = tasks.reduce((sum, t) => sum + (t.expected_time || 0), 0);
  } else {
    // Logic tính toán cho Projects (khi xem "tất cả dự án")
    activeCount = projects.filter(p => 
      p.status === 'Đang thực hiện' || 
      (p.status !== 'Hoàn thành' && p.status !== 'Hủy' && p.percent_complete < 100)
    ).length;
    
    completedCount = projects.filter(p => 
      p.status === 'Hoàn thành' || p.percent_complete === 100
    ).length;
    
    // Projects quá hạn
    const today = new Date();
    overdueCount = projects.filter(p => {
      const endDate = new Date(p.expected_end_date);
      return endDate < today && p.status !== 'Hoàn thành' && p.percent_complete < 100;
    }).length;
  }
  
  // Chi phí luôn tính từ projects (không phụ thuộc vào filter)
  const totalProjectCost = projects.reduce((sum, p) => sum + (p.estimated_costing || 0), 0);

  const metrics = [
    {
      title: `${entityLabel} đang hoạt động`,
      value: activeCount,
      icon: Activity,
      iconColor: 'text-white',
      iconBg: 'bg-gradient-to-br  from-blue-500 to-blue-600',
      cardBg: 'bg-white',
      shadow: 'shadow-lg shadow-blue-500/20',
      change: '+55%',
      changeText: 'than last week',
      changeColor: 'text-green-500'
    },
    {
      title: `${entityLabel} hoàn thành`,
      value: completedCount,
      icon: CheckCircle,
      iconColor: 'text-white',
      iconBg: 'bg-gradient-to-br  from-green-500 to-green-600',
      cardBg: 'bg-white',
      shadow: 'shadow-lg shadow-green-500/20',
      change: '+3%',
      changeText: 'than last month',
      changeColor: 'text-green-500'
    },
    {
      title: `${entityLabel} quá hạn`,
      value: overdueCount,
      icon: Clock,
      iconColor: 'text-white',
      iconBg: 'bg-gradient-to-br  from-pink-500 to-pink-600',
      cardBg: 'bg-white',
      shadow: 'shadow-lg shadow-pink-500/20',
      change: '+1%',
      changeText: 'than yesterday',
      changeColor: 'text-green-500'
    },
    {
      title: 'Chi phí Dự án',
      value: formatCurrency(totalProjectCost),
      icon: PiggyBank,
      iconColor: 'text-white',
      iconBg: 'bg-gradient-to-br from-yellow-200 to-yellow-600',
      cardBg: 'bg-white',
      shadow: 'shadow-lg shadow-yellow-500/20',
      change: '+91',
      changeText: 'Just updated',
      changeColor: 'text-gray-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={index}
            className={`${metric.cardBg} ${metric.shadow} rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.iconBg} ${metric.iconColor} p-3 rounded-2xl shadow-lg`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {metric.title}
                </p>
                <p className={`${metric.title.includes('Chi phí') ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
                  {metric.value}
                </p>
              </div>
            </div>
            {/* <div>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${metric.changeColor}`}>
                  {metric.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  {metric.changeText}
                </span>
              </div>
            </div> */}
          </div>
        );
      })}
    </div>
  );
};
