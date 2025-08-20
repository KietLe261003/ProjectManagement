import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card } from '../../../../components/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProjectIssuesSummaryProps {
  // projects: Project[]; // Có thể sử dụng sau để tính toán issues thực tế
}

export const ProjectIssuesSummary: React.FC<ProjectIssuesSummaryProps> = () => {
  const [activeTab, setActiveTab] = useState<'thisWeek' | 'lastWeek'>('thisWeek');

  // Dữ liệu giả cho issues (trong thực tế sẽ lấy từ API)
  const issuesData = {
    thisWeek: {
      newIssues: 214,
      closed: 75,
      fixed: 3,
      wontFix: 4,
      reopened: 8,
      needsTriage: 6,
      lineData: [42, 28, 43, 34, 20, 25, 22],
      barData: [12, 10, 8, 11, 8, 10, 17],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    lastWeek: {
      newIssues: 189,
      closed: 62,
      fixed: 5,
      wontFix: 2,
      reopened: 6,
      needsTriage: 4,
      lineData: [38, 32, 41, 29, 18, 23, 19],
      barData: [9, 8, 11, 9, 6, 8, 14],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  };

  const currentData = issuesData[activeTab];

  const lineChartData = {
    labels: currentData.days,
    datasets: [
      {
        label: 'New vs. Closed',
        data: currentData.lineData,
        borderColor: '#1f2937',
        backgroundColor: 'transparent',
        borderWidth: 3,
        pointBackgroundColor: '#1f2937',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.4
      }
    ]
  };

  const barChartData = {
    labels: currentData.days,
    datasets: [
      {
        label: 'Issues per day',
        data: currentData.barData,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barThickness: 20
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: '#f3f4f6'
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          stepSize: 10
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          color: '#f3f4f6'
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          stepSize: 5
        },
        beginAtZero: true
      }
    }
  };

  return (
    <Card title="Tổng quan vấn đề dự án">
      <div className="mb-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('thisWeek')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'thisWeek'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setActiveTab('lastWeek')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'lastWeek'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tuần trước
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Line Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Mới vs. Đã đóng</h3>
          <div className="h-64 mb-4">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
          <div className="h-32">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Right side - Overview Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-6 text-gray-700">Tổng quan</h3>
          
          {/* Large numbers */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {currentData.newIssues}
              </div>
              <div className="text-sm text-blue-600 font-medium">Vấn đề mới</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {currentData.closed}
              </div>
              <div className="text-sm text-blue-600 font-medium">Đã đóng</div>
            </div>
          </div>

          {/* Small stats grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700 mb-1">
                {currentData.fixed}
              </div>
              <div className="text-sm text-gray-600">Đã sửa</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700 mb-1">
                {currentData.wontFix}
              </div>
              <div className="text-sm text-gray-600">Không thực hiện</div>  {/* Won't Fix */}
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700 mb-1">
                {currentData.reopened}
              </div>
              <div className="text-sm text-gray-600">Tái mở issue</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700 mb-1">
                {currentData.needsTriage}
              </div>
              <div className="text-sm text-gray-600">Cần phân loại</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
