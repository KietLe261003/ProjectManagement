import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, subtitle: 'Tổng quan hệ thống' },
  { name: 'Dự án', href: '/projects', icon: FolderOpen, subtitle: 'Quản lý dự án R&D' },
  { name: 'Công việc', href: '/tasks', icon: CheckSquare, subtitle: 'Quản lý task và tiến độ' },
  { name: 'Tài liệu', href: '/documents', icon: FileText, subtitle: 'Quản lý biểu mẫu và tài liệu' },
  { name: 'Ngân sách', href: '/budget', icon: DollarSign, subtitle: 'Quản lý chi phí và ngân sách' },
  { name: 'Rủi ro', href: '/risk', icon: AlertTriangle, subtitle: 'Quản lý rủi ro dự án' },
  { name: 'Lịch họp', href: '/meetings', icon: Calendar, subtitle: 'Quản lý cuộc họp và gate review' },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3, subtitle: 'Báo cáo và thống kê' },
  { name: 'Cài đặt', href: '/settings', icon: Settings, subtitle: 'Cài đặt hệ thống' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const location = useLocation();

  return (
    <div
      className={`flex flex-col bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-20" : "w-85"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img
                src="https://ctuav.vn/wp-content/uploads/2024/08/Logo-moi-ctuav-e1755917887778.png"
                alt="R&D"
                className="w-full h-full object-contain bg-white"
              />
            </div>
            <span className="text-xl font-bold text-gray-800">
              R&D Management
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-12 h-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">RD</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                group flex items-start rounded-lg transition-all duration-200 relative
                ${collapsed ? "px-2 py-3 justify-center" : "px-3 py-3"}
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={`
                  h-5 w-5 transition-colors duration-200 flex-shrink-0
                  ${collapsed ? "mr-0" : "mr-3 mt-0.5"}
                  ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-500 group-hover:text-gray-700"
                  }
                `}
              />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{item.name}</span>
                  <span
                    className={`text-xs mt-0.5 ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.subtitle}
                  </span>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3"
          }`}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">AU</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Admin User
              </p>
              <p className="text-xs text-gray-500 truncate">
                System Administrator
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
