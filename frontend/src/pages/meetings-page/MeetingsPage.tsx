import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, Video, FileText, CheckCircle } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  type: 'gate-review' | 'progress' | 'planning' | 'technical';
  project: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  attendees: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  isOnline: boolean;
  meetingLink?: string;
}

const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Gate Review 4 - UAV Control System',
    type: 'gate-review',
    project: 'Hệ thống Điều khiển UAV Tự động',
    date: '2024-01-15',
    time: '09:00',
    duration: 120,
    location: 'Phòng họp A',
    attendees: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'],
    status: 'scheduled',
    description: 'Đánh giá tiến độ và chất lượng giai đoạn Thiết kế Chi tiết',
    isOnline: false
  },
  {
    id: '2',
    title: 'Weekly Progress Meeting',
    type: 'progress',
    project: 'Cảm biến Nhiệt độ IoT',
    date: '2024-01-16',
    time: '14:00',
    duration: 60,
    location: 'Microsoft Teams',
    attendees: ['Trần Thị B', 'Phạm Văn D'],
    status: 'scheduled',
    description: 'Họp tiến độ hàng tuần cho dự án IoT',
    isOnline: true,
    meetingLink: 'https://teams.microsoft.com/...'
  },
  {
    id: '3',
    title: 'Technical Review - AI Platform',
    type: 'technical',
    project: 'Platform AI cho Robot',
    date: '2024-01-18',
    time: '10:30',
    duration: 90,
    location: 'Phòng họp B',
    attendees: ['Lê Văn C', 'Hoàng Thị E', 'Vũ Văn F'],
    status: 'completed',
    description: 'Đánh giá kỹ thuật kiến trúc hệ thống AI',
    isOnline: false
  }
];

const meetingTypes = [
  { value: 'all', label: 'Tất cả cuộc họp' },
  { value: 'gate-review', label: 'Gate Review' },
  { value: 'progress', label: 'Họp tiến độ' },
  { value: 'planning', label: 'Họp lập kế hoạch' },
  { value: 'technical', label: 'Họp kỹ thuật' }
];

export const MeetingsPage: React.FC = () => {
  const [meetings] = useState<Meeting[]>(mockMeetings);
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const filteredMeetings = meetings.filter(meeting => 
    selectedType === 'all' || meeting.type === selectedType
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gate-review': return 'bg-red-100 text-red-800';
      case 'progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'gate-review': return 'Gate Review';
      case 'progress': return 'Họp tiến độ';
      case 'planning': return 'Lập kế hoạch';
      case 'technical': return 'Kỹ thuật';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'in-progress': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Statistics
  const todayMeetings = meetings.filter(m => m.date === '2024-01-15').length;
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;
  const gateReviews = meetings.filter(m => m.type === 'gate-review').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch họp</h1>
          <p className="text-gray-600">Quản lý cuộc họp và gate review</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Lịch
            </button>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" />
            Tạo cuộc họp
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">{todayMeetings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sắp tới</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingMeetings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">{completedMeetings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gate Review</p>
              <p className="text-2xl font-bold text-gray-900">{gateReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Loại cuộc họp:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {meetingTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Meetings Content */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div key={meeting.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(meeting.type)}`}>
                      {getTypeText(meeting.type)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                      {getStatusText(meeting.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{meeting.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(meeting.date)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {meeting.time} ({meeting.duration} phút)
                    </div>
                    <div className="flex items-center">
                      {meeting.isOnline ? (
                        <Video className="h-4 w-4 mr-2" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-2" />
                      )}
                      {meeting.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {meeting.attendees.length} người tham gia
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Dự án: <span className="font-medium">{meeting.project}</span></p>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendees.map((attendee, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  {meeting.isOnline && meeting.meetingLink && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Tham gia
                    </button>
                  )}
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lịch cuộc họp</h3>
          <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Lịch cuộc họp sẽ được hiển thị tại đây</p>
          </div>
        </div>
      )}

      {/* Upcoming Meetings Sidebar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cuộc họp sắp tới</h3>
        <div className="space-y-3">
          {meetings.filter(m => m.status === 'scheduled').slice(0, 3).map((meeting) => (
            <div key={meeting.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{meeting.title}</p>
                <p className="text-xs text-gray-500">{meeting.date} - {meeting.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
