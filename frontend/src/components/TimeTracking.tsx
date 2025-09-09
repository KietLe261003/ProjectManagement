import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Timesheet } from '../types';
import { Card } from './Card';
import { MetricCard } from './MetricCard';
import { formatCurrency } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TimeTrackingProps {
  timesheets: Timesheet[];
}

export const TimeTracking: React.FC<TimeTrackingProps> = ({ timesheets }) => {
  const totalRecordedHours = timesheets.reduce((sum, ts) => sum + ts.total_hours, 0);
  const totalBillableHours = timesheets.reduce((sum, ts) => sum + ts.billing_hours, 0);
  const totalBillingAmount = timesheets.reduce((sum, ts) => sum + ts.billing_amount, 0);

  // Dữ liệu cho biểu đồ tổng số giờ làm việc theo dự án
  const hoursByProject = timesheets.reduce((acc, ts) => {
    if (ts.project) {
      acc[ts.project] = (acc[ts.project] || 0) + ts.total_hours;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(hoursByProject),
    datasets: [{
      label: 'Tổng giờ làm việc',
      data: Object.values(hoursByProject),
      backgroundColor: '#9b59b6',
      borderColor: '#8e44ad',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Tổng giờ làm việc theo dự án',
        font: {
          size: 16
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <Card title="Theo dõi thời gian">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          value={`${totalRecordedHours} giờ`} 
          label="Tổng giờ đã ghi nhận" 
        />
        <MetricCard 
          value={`${totalBillableHours} giờ`} 
          label="Tổng giờ có thể tính phí" 
        />
        <MetricCard 
          value={formatCurrency(totalBillingAmount)} 
          label="Tổng doanh thu từ giờ làm việc" 
        />
      </div>
      
      <div className="mt-8">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
};
