import React, { useState } from 'react';
import { BarChart3, FileText, Download, Calendar, Filter, TrendingUp, PieChart, Users, DollarSign } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: 'project' | 'financial' | 'resource' | 'performance';
  description: string;
  lastGenerated: string;
  status: 'ready' | 'generating' | 'error';
  format: 'PDF' | 'Excel' | 'PowerPoint';
}

const mockReports: Report[] = [
  {
    id: '1',
    name: 'Báo cáo tiến độ dự án tháng 1',
    type: 'project',
    description: 'Tổng hợp tiến độ thực hiện các dự án R&D trong tháng 1/2024',
    lastGenerated: '2024-01-15',
    status: 'ready',
    format: 'PDF'
  },
  {
    id: '2',
    name: 'Phân tích chi phí quý 1',
    type: 'financial',
    description: 'Báo cáo chi tiết về tình hình tài chính và ngân sách dự án',
    lastGenerated: '2024-01-14',
    status: 'ready',
    format: 'Excel'
  },
  {
    id: '3',
    name: 'Báo cáo hiệu suất nhân sự',
    type: 'resource',
    description: 'Đánh giá hiệu suất làm việc và phân bổ nguồn lực',
    lastGenerated: '2024-01-13',
    status: 'generating',
    format: 'PowerPoint'
  },
  {
    id: '4',
    name: 'Dashboard KPI tổng quan',
    type: 'performance',
    description: 'Các chỉ số hiệu suất chính của tổ chức',
    lastGenerated: '2024-01-12',
    status: 'ready',
    format: 'PDF'
  }
];

const reportTypes = [
  { value: 'all', label: 'Tất cả báo cáo', icon: FileText },
  { value: 'project', label: 'Báo cáo dự án', icon: BarChart3 },
  { value: 'financial', label: 'Báo cáo tài chính', icon: DollarSign },
  { value: 'resource', label: 'Báo cáo nguồn lực', icon: Users },
  { value: 'performance', label: 'Báo cáo hiệu suất', icon: TrendingUp }
];

export const ReportsPage: React.FC = () => {
  const [reports] = useState<Report[]>(mockReports);
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState('this-month');

  const filteredReports = reports.filter(report => 
    selectedType === 'all' || report.type === selectedType
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'resource': return 'bg-purple-100 text-purple-800';
      case 'performance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'project': return 'Dự án';
      case 'financial': return 'Tài chính';
      case 'resource': return 'Nguồn lực';
      case 'performance': return 'Hiệu suất';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Sẵn sàng';
      case 'generating': return 'Đang tạo';
      case 'error': return 'Lỗi';
      default: return status;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return '📄';
      case 'Excel': return '📊';
      case 'PowerPoint': return '📽️';
      default: return '📄';
    }
  };

  // Statistics
  const readyReports = reports.filter(r => r.status === 'ready').length;
  const generatingReports = reports.filter(r => r.status === 'generating').length;
  const projectReports = reports.filter(r => r.type === 'project').length;
  const financialReports = reports.filter(r => r.type === 'financial').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
          <p className="text-gray-600">Báo cáo và thống kê</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <FileText className="h-4 w-4" />
          Tạo báo cáo mới
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Báo cáo sẵn sàng</p>
              <p className="text-2xl font-bold text-gray-900">{readyReports}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đang tạo</p>
              <p className="text-2xl font-bold text-gray-900">{generatingReports}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <PieChart className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Báo cáo dự án</p>
              <p className="text-2xl font-bold text-gray-900">{projectReports}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Báo cáo tài chính</p>
              <p className="text-2xl font-bold text-gray-900">{financialReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại báo cáo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="this-week">Tuần này</option>
              <option value="this-month">Tháng này</option>
              <option value="this-quarter">Quý này</option>
              <option value="this-year">Năm này</option>
              <option value="custom">Tùy chọn</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Filter className="h-4 w-4" />
              Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button className="bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 text-left transition-colors">
          <BarChart3 className="h-8 w-8 text-blue-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Báo cáo tiến độ</h3>
          <p className="text-sm text-gray-500 mt-1">Tổng quan tiến độ các dự án</p>
        </button>
        
        <button className="bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 text-left transition-colors">
          <DollarSign className="h-8 w-8 text-green-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Báo cáo tài chính</h3>
          <p className="text-sm text-gray-500 mt-1">Chi phí và ngân sách</p>
        </button>
        
        <button className="bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 text-left transition-colors">
          <Users className="h-8 w-8 text-purple-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Báo cáo nhân sự</h3>
          <p className="text-sm text-gray-500 mt-1">Hiệu suất và phân bổ</p>
        </button>
        
        <button className="bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 text-left transition-colors">
          <TrendingUp className="h-8 w-8 text-orange-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Dashboard KPI</h3>
          <p className="text-sm text-gray-500 mt-1">Chỉ số hiệu suất</p>
        </button>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Báo cáo gần đây</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`}>
                      {getTypeText(report.type)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{report.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Tạo: {report.lastGenerated}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">{getFormatIcon(report.format)}</span>
                      {report.format}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {report.status === 'ready' && (
                    <>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        Tải xuống
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                        Xem
                      </button>
                    </>
                  )}
                  {report.status === 'generating' && (
                    <div className="flex items-center text-yellow-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent mr-2"></div>
                      Đang tạo...
                    </div>
                  )}
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                    Tạo lại
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tiến độ dự án theo thời gian</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Biểu đồ tiến độ sẽ được hiển thị tại đây</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bổ ngân sách theo dự án</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Biểu đồ ngân sách sẽ được hiển thị tại đây</p>
          </div>
        </div>
      </div>
    </div>
  );
};
