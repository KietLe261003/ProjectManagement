import React, { useState } from 'react';
import { AlertTriangle, Shield, TrendingUp, Eye, Plus, Filter, Search } from 'lucide-react';

interface Risk {
  id: string;
  title: string;
  project: string;
  category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'identified' | 'analyzing' | 'mitigating' | 'closed';
  owner: string;
  description: string;
  mitigation: string;
  createdDate: string;
  dueDate: string;
}

const mockRisks: Risk[] = [
  {
    id: '1',
    title: 'Thiếu linh kiện cảm biến chính',
    project: 'Hệ thống Điều khiển UAV Tự động',
    category: 'Kỹ thuật',
    probability: 'high',
    impact: 'high',
    status: 'mitigating',
    owner: 'Nguyễn Văn A',
    description: 'Nhà cung cấp chính gặp vấn đề sản xuất, có thể ảnh hưởng đến tiến độ dự án',
    mitigation: 'Tìm nhà cung cấp thay thế và đàm phán gia hạn giao hàng',
    createdDate: '2024-01-10',
    dueDate: '2024-02-15'
  },
  {
    id: '2',
    title: 'Thay đổi yêu cầu từ khách hàng',
    project: 'Cảm biến Nhiệt độ IoT',
    category: 'Yêu cầu',
    probability: 'medium',
    impact: 'medium',
    status: 'analyzing',
    owner: 'Trần Thị B',
    description: 'Khách hàng có thể thay đổi thông số kỹ thuật trong quá trình phát triển',
    mitigation: 'Thiết lập quy trình quản lý thay đổi chặt chẽ',
    createdDate: '2024-01-12',
    dueDate: '2024-01-30'
  },
  {
    id: '3',
    title: 'Nhân sự chủ chốt nghỉ việc',
    project: 'Platform AI cho Robot',
    category: 'Nhân sự',
    probability: 'low',
    impact: 'high',
    status: 'identified',
    owner: 'Lê Văn C',
    description: 'Rủi ro mất đi nhân sự có kinh nghiệm trong quá trình phát triển',
    mitigation: 'Xây dựng kế hoạch đào tạo và chuyển giao kiến thức',
    createdDate: '2024-01-08',
    dueDate: '2024-03-01'
  }
];

const categories = ['Tất cả', 'Kỹ thuật', 'Yêu cầu', 'Nhân sự', 'Tài chính', 'Lịch trình'];
const statusOptions = ['Tất cả', 'identified', 'analyzing', 'mitigating', 'closed'];

export const RiskPage: React.FC = () => {
  const [risks] = useState<Risk[]>(mockRisks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || risk.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Tất cả' || risk.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getRiskLevel = (probability: string, impact: string) => {
    const probabilityScore = probability === 'high' ? 3 : probability === 'medium' ? 2 : 1;
    const impactScore = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
    const total = probabilityScore * impactScore;
    
    if (total >= 6) return { level: 'Cao', color: 'bg-red-100 text-red-800' };
    if (total >= 3) return { level: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Thấp', color: 'bg-green-100 text-green-800' };
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified': return 'bg-blue-100 text-blue-800';
      case 'analyzing': return 'bg-yellow-100 text-yellow-800';
      case 'mitigating': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'identified': return 'Đã xác định';
      case 'analyzing': return 'Đang phân tích';
      case 'mitigating': return 'Đang giảm thiểu';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  };

  const getProbabilityText = (probability: string) => {
    switch (probability) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return probability;
    }
  };

  const getImpactText = (impact: string) => {
    switch (impact) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return impact;
    }
  };

  // Risk statistics
  const highRisks = risks.filter(risk => getRiskLevel(risk.probability, risk.impact).level === 'Cao').length;
  const mediumRisks = risks.filter(risk => getRiskLevel(risk.probability, risk.impact).level === 'Trung bình').length;
  const lowRisks = risks.filter(risk => getRiskLevel(risk.probability, risk.impact).level === 'Thấp').length;
  const activeRisks = risks.filter(risk => risk.status !== 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rủi ro</h1>
          <p className="text-gray-600">Quản lý rủi ro dự án</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="h-4 w-4" />
          Thêm rủi ro
        </button>
      </div>

      {/* Risk Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rủi ro cao</p>
              <p className="text-2xl font-bold text-red-600">{highRisks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rủi ro trung bình</p>
              <p className="text-2xl font-bold text-yellow-600">{mediumRisks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rủi ro thấp</p>
              <p className="text-2xl font-bold text-green-600">{lowRisks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
              <p className="text-2xl font-bold text-blue-600">{activeRisks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm rủi ro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'Tất cả' ? 'Tất cả trạng thái' : getStatusText(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Risks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rủi ro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xác suất
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tác động
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mức độ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người phụ trách
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạn xử lý
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRisks.map((risk) => {
                const riskLevel = getRiskLevel(risk.probability, risk.impact);
                return (
                  <tr key={risk.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{risk.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{risk.project}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getProbabilityColor(risk.probability)}`}>
                        {getProbabilityText(risk.probability)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${getImpactColor(risk.impact)}`}>
                        {getImpactText(risk.impact)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${riskLevel.color}`}>
                        {riskLevel.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(risk.status)}`}>
                        {getStatusText(risk.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {risk.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {risk.dueDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ma trận rủi ro</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Ma trận rủi ro sẽ được hiển thị tại đây</p>
        </div>
      </div>
    </div>
  );
};
