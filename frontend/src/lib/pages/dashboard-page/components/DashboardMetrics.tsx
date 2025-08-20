import React from 'react';
import { Activity, CheckCircle, DollarSign, Clock, CurrencyIcon, PiggyBank } from 'lucide-react';
import type { Project } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';

interface DashboardMetricsProps {
  projects: Project[];
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ projects }) => {
  // Tính toán các metrics theo yêu cầu mới
  const activeProjects = projects.filter(p => 
    p.status === 'Đang thực hiện' || 
    (p.status !== 'Hoàn thành' && p.status !== 'Hủy' && p.percent_complete < 100)
  ).length;
  
  const completedProjects = projects.filter(p => 
    p.status === 'Hoàn thành' || p.percent_complete === 100
  ).length;
  
  // Projects quá hạn (expected_end_date đã qua và chưa hoàn thành)
  const today = new Date();
  const overdueProjects = projects.filter(p => {
    const endDate = new Date(p.expected_end_date);
    return endDate < today && p.status !== 'Hoàn thành' && p.percent_complete < 100;
  }).length;
  
  const totalProjectCost = projects.reduce((sum, p) => sum + (p.estimated_costing || 0), 0);

  const metrics = [
    {
      title: 'Tổng dự án đang hoạt động',
      value: activeProjects,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Dự án hoàn thành',
      value: completedProjects,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Dự án quá hạn',
      value: overdueProjects,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Chi phí Dự án',
      value: formatCurrency(totalProjectCost),
      icon: PiggyBank,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={index}
            className={`${metric.bgColor} ${metric.borderColor} border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </p>
              </div>
              <div className={`${metric.color} ${metric.bgColor} p-3 rounded-full`}>
                <IconComponent className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
