import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus, Filter, Download } from 'lucide-react';

interface BudgetItem {
  id: string;
  project: string;
  category: string;
  planned: number;
  actual: number;
  remaining: number;
  status: 'on-track' | 'over-budget' | 'under-budget';
  lastUpdated: string;
}

const mockBudgetData: BudgetItem[] = [
  {
    id: '1',
    project: 'Hệ thống Điều khiển UAV Tự động',
    category: 'Thiết kế Chi tiết',
    planned: 500000000,
    actual: 360000000,
    remaining: 140000000,
    status: 'on-track',
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    project: 'Cảm biến Nhiệt độ IoT',
    category: 'Nghiên cứu Tính khả thi',
    planned: 200000000,
    actual: 240000000,
    remaining: -40000000,
    status: 'over-budget',
    lastUpdated: '2024-01-16'
  },
  {
    id: '3',
    project: 'Platform AI cho Robot',
    category: 'Phát triển Sản phẩm',
    planned: 800000000,
    remaining: 576000000,
    actual: 224000000,
    status: 'under-budget',
    lastUpdated: '2024-01-14'
  }
];

const categories = ['Tất cả', 'Thiết kế Chi tiết', 'Nghiên cứu Tính khả thi', 'Phát triển Sản phẩm'];

export const BudgetPage: React.FC = () => {
  const [budgetData] = useState<BudgetItem[]>(mockBudgetData);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const filteredData = budgetData.filter(item => 
    selectedCategory === 'Tất cả' || item.category === selectedCategory
  );

  const totalPlanned = budgetData.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = budgetData.reduce((sum, item) => sum + item.actual, 0);
  const totalRemaining = budgetData.reduce((sum, item) => sum + item.remaining, 0);
  const usagePercentage = Math.round((totalActual / totalPlanned) * 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₫', 'đ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'over-budget': return 'bg-red-100 text-red-800';
      case 'under-budget': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-track': return 'Đúng kế hoạch';
      case 'over-budget': return 'Vượt ngân sách';
      case 'under-budget': return 'Dưới ngân sách';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'over-budget': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'under-budget': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ngân sách</h1>
          <p className="text-gray-600">Quản lý chi phí và ngân sách</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" />
            Thêm ngân sách
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng ngân sách</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPlanned)}</p>
              <p className="text-xs text-gray-500 mt-1">Kế hoạch năm 2024</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã sử dụng</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActual)}</p>
              <p className="text-xs text-green-600 mt-1">{usagePercentage}% đã sử dụng</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Còn lại</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRemaining)}</p>
              <p className="text-xs text-blue-600 mt-1">{100 - usagePercentage}% còn lại</p>
            </div>
            <TrendingDown className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dự án vượt ngân sách</p>
              <p className="text-2xl font-bold text-red-600">
                {budgetData.filter(item => item.status === 'over-budget').length}
              </p>
              <p className="text-xs text-red-600 mt-1">Cần chú ý</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giai đoạn
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kế hoạch
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thực tế
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Còn lại
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiến độ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cập nhật
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => {
                const progressPercentage = Math.round((item.actual / item.planned) * 100);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.project}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(item.planned)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(item.actual)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={item.remaining < 0 ? 'text-red-600' : 'text-gray-900'}>
                        {formatCurrency(item.remaining)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              progressPercentage > 100 ? 'bg-red-500' : 
                              progressPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-600">{progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{getStatusText(item.status)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {item.lastUpdated}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Overview Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Biểu đồ ngân sách theo thời gian</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Biểu đồ sẽ được hiển thị tại đây</p>
        </div>
      </div>
    </div>
  );
};
