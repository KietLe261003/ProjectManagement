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
import type { Project } from '../types';
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

interface CostAnalysisProps {
  projects: Project[];
}

export const CostAnalysis: React.FC<CostAnalysisProps> = ({ projects }) => {
  const totalGrossMargin = projects.reduce((sum, p) => sum + p.gross_margin, 0);
  const totalBilledAmount = projects.reduce((sum, p) => sum + p.total_billed_amount, 0);

  // Dữ liệu cho biểu đồ so sánh chi phí
  const projectNames = projects.map(p => p.project_name);
  const estimatedCosts = projects.map(p => p.project_cost);
  const billedAmounts = projects.map(p => p.total_billed_amount);

  const chartData = {
    labels: projectNames,
    datasets: [
      {
        label: 'Chi phí ước tính',
        data: estimatedCosts,
        backgroundColor: '#34495e',
        borderColor: '#2c3e50',
        borderWidth: 1
      },
      {
        label: 'Số tiền đã thanh toán',
        data: billedAmounts,
        backgroundColor: '#1abc9c',
        borderColor: '#16a085',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'So sánh chi phí ước tính và số tiền đã thanh toán theo dự án',
        font: {
          size: 16
        }
      },
      legend: {
        position: 'bottom' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <Card title="Phân tích chi phí">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MetricCard 
          value={formatCurrency(totalGrossMargin)} 
          label="Tổng biên lợi nhuận gộp" 
        />
        <MetricCard 
          value={formatCurrency(totalBilledAmount)} 
          label="Tổng số tiền đã thanh toán" 
        />
      </div>
      
      <div className="mt-8">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
};
