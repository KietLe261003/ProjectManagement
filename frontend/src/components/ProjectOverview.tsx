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
import { MetricCard } from './MetricCard';
import { StatusBadge } from './StatusBadge';
import { LoadingSpinner } from './LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ProjectOverviewProps {
  projects: Project[];
  selectedProject: string;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects, selectedProject }) => {
  const [summaryText, setSummaryText] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const activeProjects = projects.filter(p => p.is_active).length;
  const totalProjectCost = projects.reduce((sum, p) => sum + p.project_cost, 0);
  const totalProjectHours = projects.reduce((sum, p) => sum + p.total_hours, 0);

  // Tính toán dữ liệu cho biểu đồ tỷ lệ hoàn thành
  const completionData = [0, 0, 0, 0, 0];
  projects.forEach(p => {
    if (p.percent_complete <= 25) completionData[0]++;
    else if (p.percent_complete <= 50) completionData[1]++;
    else if (p.percent_complete <= 75) completionData[2]++;
    else if (p.percent_complete <= 99) completionData[3]++;
    else completionData[4]++;
  });

  const chartData = {
    labels: ['0-25%', '26-50%', '51-75%', '76-99%', '100%'],
    datasets: [{
      data: completionData,
      backgroundColor: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'],
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Tỷ lệ hoàn thành dự án',
        font: {
          size: 16
        }
      },
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  // Tìm các dự án sắp đến hạn
  const today = new Date();
  const upcomingProjects = projects.filter(p => {
    const endDate = new Date(p.expected_end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30 && p.status !== 'Hoàn thành' && p.status !== 'Hủy';
  }).sort((a, b) => new Date(a.expected_end_date).getTime() - new Date(b.expected_end_date).getTime());

  const generateProjectSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryText('');

    try {
      let projectsToSummarize;
      let prompt;

      if (selectedProject === 'all') {
        projectsToSummarize = projects.map(p => ({
          project_name: p.project_name,
          status: p.status,
          percent_complete: p.percent_complete,
          expected_end_date: p.expected_end_date,
          is_active: p.is_active,
          project_cost: p.project_cost,
          total_hours: p.total_hours
        }));
        prompt = `Tóm tắt tổng quan về tình trạng của các dự án sau đây, tập trung vào tỷ lệ hoàn thành, trạng thái, và các dự án sắp đến hạn. Hãy viết một đoạn văn ngắn gọn, súc tích, và chuyên nghiệp bằng tiếng Việt. Dữ liệu dự án: ${JSON.stringify(projectsToSummarize)}`;
      } else {
        projectsToSummarize = projects.find(p => p.project_name === selectedProject);
        if (!projectsToSummarize) {
          setSummaryText('Không tìm thấy dữ liệu cho dự án này.');
          return;
        }
        prompt = `Tóm tắt chi tiết về dự án sau đây, bao gồm tên, trạng thái, tỷ lệ hoàn thành, ngày dự kiến kết thúc, chi phí, và tổng số giờ làm việc. Hãy viết một đoạn văn ngắn gọn, súc tích, và chuyên nghiệp bằng tiếng Việt. Dữ liệu dự án: ${JSON.stringify(projectsToSummarize)}`;
      }

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          value={activeProjects} 
          label="Tổng dự án đang hoạt động" 
        />
        <MetricCard 
          value={formatCurrency(totalProjectCost)} 
          label="Tổng chi phí dự án" 
        />
        <MetricCard 
          value={`${totalProjectHours} giờ`} 
          label="Tổng giờ làm việc dự án" 
        />
      </div>

      {/* Gemini API Integration */}
      <div className="mt-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div>
          <Pie data={chartData} options={chartOptions} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Các dự án sắp đến hạn</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase">Tên dự án</th>
                  <th className="p-3 text-left border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase">Ngày kết thúc dự kiến</th>
                  <th className="p-3 text-left border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {upcomingProjects.map((project) => (
                  <tr key={project.name} className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-100">{project.project_name}</td>
                    <td className="p-3 border-b border-gray-100">{formatDate(project.expected_end_date)}</td>
                    <td className="p-3 border-b border-gray-100">
                      <StatusBadge status={project.status} type="status" />
                    </td>
                  </tr>
                ))}
                {upcomingProjects.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-gray-500">
                      Không có dự án nào sắp đến hạn
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
};
