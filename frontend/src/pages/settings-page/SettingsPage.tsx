import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Save } from 'lucide-react';
import GeneralSettings from './components/GeneralSettings';
import UserSettings from './components/UserSettings';
import NotificationSettings from './components/NotificationSettings';
import SecuritySettings from './components/SecuritySettings';
interface SettingsSection {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}
const settingsSections: SettingsSection[] = [
  { id: 'general', name: 'Cài đặt chung', icon: Settings, component: GeneralSettings },
  { id: 'user', name: 'Tài khoản', icon: User, component: UserSettings },
  { id: 'notifications', name: 'Thông báo', icon: Bell, component: NotificationSettings },
  { id: 'security', name: 'Bảo mật', icon: Shield, component: SecuritySettings },
];

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');

  const ActiveComponent = settingsSections.find(section => section.id === activeSection)?.component || GeneralSettings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          <p className="text-gray-600">Cài đặt hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Save className="h-4 w-4" />
          Lưu thay đổi
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <nav className="space-y-1 p-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      activeSection === section.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
};
