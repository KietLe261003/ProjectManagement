import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import type { Project } from '../types';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { LoadingSpinner } from './LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ProjectOverviewProps {
  projects: Project[];
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects }) => {
  const [summaryText, setSummaryText] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Phân loại dự án theo trạng thái và tỷ lệ hoàn thành
  const categorizeProjects = () => {
    const categories: {
      [key: string]: {
        projects: Project[];
        color: string;
        label: string;
      }
    } = {
      completed: { projects: [], color: '#22c55e', label: 'Hoàn thành' },
      active: { projects: [], color: '#3b82f6', label: 'Đang hoạt động' },
      overdue: { projects: [], color: '#ef4444', label: 'Quá hạn' },
      paused: { projects: [], color: '#f59e0b', label: 'Tạm dừng' },
      cancelled: { projects: [], color: '#6b7280', label: 'Đã hủy' }
    };

    const today = new Date();

    projects.forEach(project => {
      if (project.status === 'Hoàn thành' || project.percent_complete === 100) {
        categories.completed.projects.push(project);
      } else if (project.status === 'Hủy') {
        categories.cancelled.projects.push(project);
      } else if (project.status === 'Tạm dừng') {
        categories.paused.projects.push(project);
      } else {
        const endDate = new Date(project.expected_end_date);
        if (endDate < today && project.percent_complete < 100) {
          categories.overdue.projects.push(project);
        } else {
          categories.active.projects.push(project);
        }
      }
    });

    return categories;
  };

  const categories = categorizeProjects();
  
  // Tạo dữ liệu cho pie chart
  const chartData = {
    labels: Object.values(categories).map(cat => `${cat.label} (${cat.projects.length})`),
    datasets: [{
      data: Object.values(categories).map(cat => cat.projects.length),
      backgroundColor: Object.values(categories).map(cat => cat.color),
      borderColor: Object.values(categories).map(cat => cat.color),
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Phân bố dự án theo trạng thái',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: 20
      },
      legend: {
        display: false // Ẩn legend mặc định vì chúng ta sẽ tạo custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    }
  };

  const generateProjectSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryText('');

    try {
      const projectsToSummarize = projects.map(p => ({
        project_name: p.project_name,
        status: p.status,
        percent_complete: p.percent_complete,
        expected_end_date: p.expected_end_date,
        is_active: p.is_active,
        project_cost: p.estimated_costing,
        total_hours: p.total_hours
      }));
      
      const prompt = `Tóm tắt tổng quan về tình trạng của các dự án sau đây, tập trung vào tỷ lệ hoàn thành, trạng thái, và các dự án sắp đến hạn. Hãy viết một đoạn văn ngắn gọn, súc tích, và chuyên nghiệp bằng tiếng Việt. Dữ liệu dự án: ${JSON.stringify(projectsToSummarize)}`;

      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = ""; // Sẽ được cung cấp trong runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setSummaryText(text);
      } else {
        setSummaryText('Không thể tạo tóm tắt. Cấu trúc phản hồi API không mong muốn.');
      }
    } catch (error) {
      console.error('Lỗi khi gọi Gemini API:', error);
      setSummaryText(`Đã xảy ra lỗi khi tạo tóm tắt: ${error instanceof Error ? error.message : 'Unknown error'}. Vui lòng thử lại.`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <Card title="Tổng quan dự án">
      {/* Gemini API Integration */}
      <div className="mb-6">
        <button
          onClick={generateProjectSummary}
          disabled={isGeneratingSummary}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
        >
          {isGeneratingSummary ? (
            <>
              <LoadingSpinner className="mr-2" />
              Đang tạo tóm tắt...
            </>
          ) : (
            '✨ Tạo Tóm Tắt Dự Án'
          )}
        </button>
        {summaryText && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
            {summaryText}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="flex flex-col">
          <div className="h-80 mb-4">
            <Pie data={chartData} options={chartOptions} />
          </div>
          
          {/* Custom Legend */}
          <div className="space-y-2">
            {Object.entries(categories).map(([key, category]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {category.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {category.projects.length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách dự án theo màu */}
        <div className="space-y-6">
          {Object.entries(categories).map(([key, category]) => (
            category.projects.length > 0 && (
              <div key={key} className="border-l-4 pl-4" style={{ borderLeftColor: category.color }}>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  {category.label} ({category.projects.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {category.projects.map(project => (
                    <div key={project.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.project_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {project.percent_complete}% hoàn thành
                        </p>
                      </div>
                      <StatusBadge status={project.status} type="status" />
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </Card>
  );
};
