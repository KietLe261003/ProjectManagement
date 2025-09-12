import React from 'react';
import { Bell, Search, Menu, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrentUser, useCurrentUserProfile } from '@/services/userService';
import { useFrappeAuth } from 'frappe-react-sdk';
import { handleTokenExpiry, getLoginUrl } from '@/utils/authUtils';
import { toast } from '@/utils/toastUtils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { currentUser, isLoading } = useCurrentUser();
  const { currentUserProfile } = useCurrentUserProfile();
  const { logout } = useFrappeAuth();

  const handleLogout = async () => {
    try {
      toast.success('Logging out...', {
        description: 'You will be redirected to the login page.',
        duration: 2000,
      });
      
      // Use Frappe's logout method
      await logout();
      
      // Small delay to show the toast before redirect
      setTimeout(() => {
        // Use our centralized logout handling
        handleTokenExpiry();
      }, 1000);
    } catch (error) {
      console.error('Logout failed:', error);
      
      toast.error('Logout failed', {
        description: 'Please try again or contact support.',
      });
      
      // Fallback: force redirect anyway
      setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 2000);
    }
  };

  const getUserDisplayName = () => {
    if (currentUserProfile) {
      return currentUserProfile.full_name || currentUserProfile.first_name || currentUserProfile.email || 'User';
    }
    if (!currentUser || typeof currentUser === 'string') return currentUser || 'Guest';
    return (currentUser as any).full_name || (currentUser as any).first_name || (currentUser as any).email || 'User';
  };

  const getUserInitials = () => {
    if (!currentUser) return 'G';
    const name = getUserDisplayName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserAvatar = () => {
    if (currentUserProfile?.user_image) {
      return currentUserProfile.user_image;
    }
    return null;
  };

  const getUserEmail = () => {
    if (currentUserProfile) {
      return currentUserProfile.email;
    }
    if (currentUser && typeof currentUser !== 'string') {
      return (currentUser as any).email;
    }
    return currentUser || 'No email';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Search */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Tìm kiếm dự án, task, tài liệu..."
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    {getUserAvatar() ? (
                      <img 
                        src={getUserAvatar()!} 
                        alt="User avatar" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {getUserInitials()}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {isLoading ? 'Loading...' : getUserDisplayName()}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      {getUserAvatar() ? (
                        <img 
                          src={getUserAvatar()!} 
                          alt="User avatar" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {getUserInitials()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-sm text-gray-500">
                        {getUserEmail()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Settings</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-red-50 transition-colors duration-200 text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
};
