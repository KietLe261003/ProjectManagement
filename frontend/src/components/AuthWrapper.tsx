import React, { useEffect } from 'react';
import { useAuthWatcher } from '../hooks/useAuthWatcher';
import { isLoginPage } from '../utils/authUtils';

interface AuthWrapperProps {
  children: React.ReactNode;
  /**
   * Check interval in minutes
   * @default 5
   */
  checkInterval?: number;
  /**
   * Whether to show toast notifications
   * @default true  
   */
  showNotifications?: boolean;
}

/**
 * Wrapper component that automatically monitors authentication status
 * and redirects to login when token expires
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({
  children,
  checkInterval = 5,
  showNotifications = true
}) => {
  const { isWatching, currentUser, isLoading } = useAuthWatcher({
    checkIntervalMinutes: checkInterval,
    showNotifications,
    enabled: !isLoginPage(), // Don't watch on login pages
    onTokenExpired: () => {
      console.log('Token expired callback triggered');
    }
  });

  useEffect(() => {
    if (!isLoginPage()) {
      console.log('Auth watcher initialized:', {
        isWatching,
        currentUser: !!currentUser,
        isLoading,
        checkInterval
      });
    }
  }, [isWatching, currentUser, isLoading, checkInterval]);

  // If we're on a login page, just render children
  if (isLoginPage()) {
    return <>{children}</>;
  }

  // If loading auth state, show a minimal loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user and not loading, the auth system should handle redirect
  // But render children anyway to prevent blank page
  return <>{children}</>;
};

export default AuthWrapper;
