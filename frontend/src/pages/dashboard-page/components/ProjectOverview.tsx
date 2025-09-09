import React, { useState } from 'react';
import type { Project, Task } from '../../../types';
import { Card } from '../../../components/Card';
// import { LoadingSpinner } from '../../../components/LoadingSpinner';

interface ProjectOverviewProps {
  projects: Project[];
  tasks: Task[];
  selectedProject?: string | null;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects, tasks, selectedProject }) => {
  // const [summaryText, setSummaryText] = useState<string>('');
  // const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Toggle collapse state for a category - only one section can be open at a time
  const toggleCollapse = (categoryKey: string) => {
    setActiveSection(prev => prev === categoryKey ? null : categoryKey);
  };

  // Kiểm tra xem có đang filter theo dự án cụ thể không
  const isProjectSpecific = selectedProject && selectedProject !== 'all';
  // const entityLabel = isProjectSpecific ? 'Task' : 'Dự án';

  // Phân loại dữ liệu theo trạng thái
  const categorizeData = () => {
    if (isProjectSpecific) {
      // Phân loại Tasks theo 5 trạng thái
      const categories: {
        [key: string]: {
          projects: Task[]; // Sẽ chứa tasks thay vì projects
          color: string;
          lightColor: string;
          darkColor: string;
          label: string;
          height: number;
        }
      } = {
        open: { 
          projects: [], 
          color: '#3b82f6', 
          lightColor: '#60a5fa',
          darkColor: '#1d4ed8',
          label: 'Open', 
          height: 30 
        },
        working: { 
          projects: [], 
          color: '#f59e0b', 
          lightColor: '#fbbf24',
          darkColor: '#d97706',
          label: 'Working', 
          height: 25 
        },
        completed: { 
          projects: [], 
          color: '#22c55e', 
          lightColor: '#4ade80',
          darkColor: '#15803d',
          label: 'Completed', 
          height: 20 
        },
        overdue: { 
          projects: [], 
          color: '#ef4444', 
          lightColor: '#f87171',
          darkColor: '#dc2626',
          label: 'Overdue', 
          height: 40 
        },
        cancelled: { 
          projects: [], 
          color: '#6b7280', 
          lightColor: '#9ca3af',
          darkColor: '#4b5563',
          label: 'Cancelled', 
          height: 35 
        }
      };

      tasks.forEach(task => {
        // Kiểm tra overdue trước
        const today = new Date();
        const isOverdue = task.exp_end_date && 
          new Date(task.exp_end_date) < today && 
          task.status !== 'Completed' && 
          task.status !== 'Cancelled';
        
        if (isOverdue) {
          categories.overdue.projects.push(task);
        } else if (task.status === 'Completed') {
          categories.completed.projects.push(task);
        } else if (task.status === 'Working') {
          categories.working.projects.push(task);
        } else if (task.status === 'Cancelled') {
          categories.cancelled.projects.push(task);
        } else {
          // Tất cả các trạng thái khác đều được coi là Open
          categories.open.projects.push(task);
        }
      });

      return categories;
    } else {
      // Logic cũ cho Projects
      const categories: {
        [key: string]: {
          projects: Project[];
          color: string;
          lightColor: string;
          darkColor: string;
          label: string;
          height: number;
        }
      } = {
        open: { 
          projects: [], 
          color: '#3b82f6', 
          lightColor: '#60a5fa',
          darkColor: '#1d4ed8',
          label: 'Đang mở', 
          height: 30 
        },
        completed: { 
          projects: [], 
          color: '#22c55e', 
          lightColor: '#4ade80',
          darkColor: '#15803d',
          label: 'Hoàn thành', 
          height: 20 
        },
        cancelled: { 
          projects: [], 
          color: '#ef4444', 
          lightColor: '#f87171',
          darkColor: '#dc2626',
          label: 'Đã hủy', 
          height: 40 
        }
      };

      projects.forEach(project => {
        if (project.status === 'Completed' || project.status === 'Hoàn thành') {
          categories.completed.projects.push(project);
        } else if (project.status === 'Cancelled' || project.status === 'Canceled' || project.status === 'Hủy') {
          categories.cancelled.projects.push(project);
        } else {
          // Tất cả các trạng thái khác đều được coi là Open
          categories.open.projects.push(project);
        }
      });

      return categories;
    }
  };

  const categories = categorizeData();
  const total = isProjectSpecific ? tasks.length : projects.length;

  // Function to sort by priority
  const sortByPriority = (items: (Project | Task)[]) => {
    const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return items.sort((a, b) => {
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      return priorityB - priorityA; // Descending order (Urgent first)
    });
  };

  // Sort items in each category by priority
  Object.values(categories).forEach(category => {
    category.projects = sortByPriority(category.projects as (Project | Task)[]) as any;
  });

  // Component 2D Pie Chart đơn giản
  const PieChart2D = () => {
  const [tooltip, setTooltip] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    categoryKey: string;
  }>({ visible: false, x: 0, y: 0, categoryKey: '' });
    
    const size = 360; // Tăng kích thước pie chart
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 170; // Tăng bán kính
    
    let currentAngle = 0;
    const activeCategories = Object.entries(categories).filter(([, category]) => category.projects.length > 0);
    
  const handleMouseEnter = (categoryKey: string, event: React.MouseEvent) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setTooltip({
      visible: true,
      x: mouseX + 15,
      y: mouseY - 10,
      categoryKey
    });
  };
  
  const handleMouseMove = (categoryKey: string, event: React.MouseEvent) => {
    if (tooltip.visible && tooltip.categoryKey === categoryKey) {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      
      setTooltip(prev => ({
        ...prev,
        x: mouseX + 15,
        y: mouseY - 10
      }));
    }
  };
  
  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, categoryKey: '' });
  };
    
    return (
      <div className="relative flex flex-col items-center">
        <p className="text-sm text-gray-600 mb-6 text-center max-w-xs">
          {isProjectSpecific ? 'Biểu đồ phân bố Tasks theo trạng thái' : 'Biểu đồ phân bố dự án theo trạng thái'}
        </p>
        
        {/* Pie Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="absolute top-0 left-0">
            {/* Drop shadow filter */}
            <defs>
              <filter id="dropshadow2d" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.2"/>
              </filter>
            </defs>

            {/* Render pie segments */}
            {(() => {
              currentAngle = 0;
              return activeCategories.map(([key, category]) => {
                const percentage = (category.projects.length / total) * 100;
                const startAngle = currentAngle;
                const endAngle = currentAngle + (percentage / 100) * 360;
                
                currentAngle = endAngle;
                
                // Convert to radians
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const midRad = ((startAngle + endAngle) / 2 * Math.PI) / 180;
                
                // Calculate points
                const x1 = centerX + radius * Math.cos(startRad);
                const y1 = centerY + radius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(endRad);
                const y2 = centerY + radius * Math.sin(endRad);
                
                const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                
                // Xử lý trường hợp chỉ có 1 segment (full circle)
                const isFullCircle = activeCategories.length === 1;
                
                // Create path for pie slice
                let pathData: string;
                if (isFullCircle) {
                  // Vẽ đường tròn hoàn chỉnh khi chỉ có 1 segment
                  pathData = `M ${centerX} ${centerY + radius} A ${radius} ${radius} 0 1 1 ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius} Z`;
                } else {
                  pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                }
                
                // Label position (closer to chart)
                const labelRadius = radius * 0.7;
                const labelX = isFullCircle 
                  ? centerX 
                  : centerX + labelRadius * Math.cos(midRad);
                const labelY = isFullCircle 
                  ? centerY 
                  : centerY + labelRadius * Math.sin(midRad);
                
                return (
                  <g key={`segment-${key}`}>
                    {/* Pie slice */}
                    <path
                      d={pathData}
                      fill={category.color}
                      stroke="white"
                      strokeWidth="2"
                      filter="url(#dropshadow2d)"
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                      onMouseEnter={(e) => handleMouseEnter(key, e)}
                      onMouseMove={(e) => handleMouseMove(key, e)}
                      onMouseLeave={handleMouseLeave}
                    />
                    
                    {/* Percentage label inside pie slice */}
                    {percentage > 5 && ( // Only show label if slice is big enough
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-white pointer-events-none"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {Math.round(percentage)}%
                      </text>
                    )}
                  </g>
                );
              });
            })()}
          </svg>
        </div>
        
        {/* Tooltip */}
        {tooltip.visible && tooltip.categoryKey && categories[tooltip.categoryKey] && (
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs pointer-events-none"
            style={{ 
              left: tooltip.x, 
              top: tooltip.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="font-semibold text-gray-800 mb-2 flex items-center">
              <div 
                className="w-3 h-3 rounded mr-2" 
                style={{ backgroundColor: categories[tooltip.categoryKey].color }}
              ></div>
              {categories[tooltip.categoryKey].label} ({categories[tooltip.categoryKey].projects.length})
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {categories[tooltip.categoryKey].projects.map((item, idx) => (
                <div key={idx} className="text-xs border-b border-gray-100 pb-1 last:border-b-0">
                  <div className="font-medium text-gray-700">
                    {isProjectSpecific ? (item as Task).subject : (item as Project).project_name}
                  </div>
                  <div className="text-gray-500 flex justify-between">
                    <span>
                      {isProjectSpecific 
                        ? `${(item as Task).progress || 0}% hoàn thành` 
                        : `${(item as Project).percent_complete}% hoàn thành`
                      }
                    </span>
                    <span className="font-medium">
                      Priority: {(item as Task | Project).priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  // const generateProjectSummary = async () => {
  //   setIsGeneratingSummary(true);
  //   setSummaryText('');

  //   try {
  //     const projectsToSummarize = projects.map(p => ({
  //       project_name: p.project_name,
  //       status: p.status,
  //       percent_complete: p.percent_complete,
  //       expected_end_date: p.expected_end_date,
  //       is_active: p.is_active,
  //       project_cost: p.estimated_costing,
  //       total_hours: p.total_hours
  //     }));
      
  //     const prompt = `Tóm tắt tổng quan về tình trạng của các dự án sau đây, tập trung vào tỷ lệ hoàn thành, trạng thái, và các dự án sắp đến hạn. Hãy viết một đoạn văn ngắn gọn, súc tích, và chuyên nghiệp bằng tiếng Việt. Dữ liệu dự án: ${JSON.stringify(projectsToSummarize)}`;

  //     const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
  //     const payload = { contents: chatHistory };
  //     const apiKey = ""; // Sẽ được cung cấp trong runtime
  //     const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  //     const response = await fetch(apiUrl, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(payload)
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
  //     }

  //     const result = await response.json();
  //     if (result.candidates && result.candidates.length > 0 &&
  //         result.candidates[0].content && result.candidates[0].content.parts &&
  //         result.candidates[0].content.parts.length > 0) {
  //       const text = result.candidates[0].content.parts[0].text;
  //       setSummaryText(text);
  //     } else {
  //       setSummaryText('Không thể tạo tóm tắt. Cấu trúc phản hồi API không mong muốn.');
  //     }
  //   } catch (error) {
  //     console.error('Lỗi khi gọi Gemini API:', error);
  //     setSummaryText(`Đã xảy ra lỗi khi tạo tóm tắt: ${error instanceof Error ? error.message : 'Unknown error'}. Vui lòng thử lại.`);
  //   } finally {
  //     setIsGeneratingSummary(false);
  //   }
  // };

  return (
    <Card 
      title={
        <div 
          className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-md transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center">
            <span>
              {isProjectSpecific ? (
                <>Tổng quan <span className="font-bold bg-yellow-200 px-1 rounded">Tasks</span></>
              ) : (
                <>Tổng quan <span className="font-bold bg-yellow-200 px-1 rounded">dự án</span></>
              )}
            </span>
          </div>
        </div>
      }
    >
      {/* Content khi mở rộng */}
      {isExpanded && (
        <div>
          {/* Gemini API Integration */}
            {/* <div className="mb-6">
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
            </div> */}

          {/* Kiểm tra nếu không có dữ liệu - hiển thị thông báo ở giữa toàn bộ card */}
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <div className="text-8xl text-gray-300 mb-6">📊</div>
                <p className="text-xl font-medium text-gray-600 mb-3">
                  {isProjectSpecific ? 'Không có task nào' : 'Không có dự án nào'}
                </p>
                <p className="text-base text-gray-500 max-w-md">
                  {isProjectSpecific 
                    ? 'Không có task nào đang thực hiện trong dự án này' 
                    : 'Không có dự án nào đang thực hiện'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 2D Pie Chart */}
              <div className="flex flex-col items-center">
                <PieChart2D />
              </div>

              {/* Danh sách dự án theo màu - Collapsible */}
              <div className="space-y-4">
              {Object.entries(categories).map(([key, category]) => (
                category.projects.length > 0 && (
                  <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header - Clickable để toggle */}
                    <button
                      onClick={() => toggleCollapse(key)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between border-l-4"
                      style={{ borderLeftColor: category.color }}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <h4 className="font-semibold text-gray-800">
                          {category.label} ({category.projects.length})
                        </h4>
                      </div>
                      <div className="flex items-center">
                        {/* Chevron icon */}
                        <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                            activeSection === key ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Content - Collapsible */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      activeSection === key ? 'max-h-96' : 'max-h-0'
                    }`}>
                      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                        {category.projects.map((item: Project | Task) => (
                          <div key={isProjectSpecific ? (item as Task).name : (item as Project).name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {isProjectSpecific ? (item as Task).subject : (item as Project).project_name}
                                </p>
                                {/* Priority Badge */}
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0 ${
                                  (item as Task | Project).priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                  (item as Task | Project).priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                  (item as Task | Project).priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {(item as Task | Project).priority}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end ml-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min(
                                        isProjectSpecific ? ((item as Task).progress || 0) : ((item as Project).percent_complete || 0), 
                                        100
                                      )}%`,
                                      backgroundColor: (() => {
                                        const progress = isProjectSpecific ? ((item as Task).progress || 0) : ((item as Project).percent_complete || 0);
                                        return progress >= 100 ? '#22c55e' : 
                                               progress >= 70 ? '#3b82f6' : 
                                               progress >= 30 ? '#f59e0b' : '#ef4444';
                                      })()
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs font-semibold text-gray-600 min-w-[35px] text-right">
                                  {isProjectSpecific ? ((item as Task).progress || 0) : ((item as Project).percent_complete || 0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
