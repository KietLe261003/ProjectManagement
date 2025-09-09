/**
 * Authentication service for managing user sessions and token validation
 */

import { useFrappeAuth } from 'frappe-react-sdk';
import { checkTokenValidity, handleTokenExpiry, getLoginUrl, isLoginPage } from '@/utils/authUtils';
import { useAuthWatcher } from '@/hooks/useAuthWatcher';

export class AuthService {
  /**
   * Enhanced auth hook with automatic token monitoring
   */
  static useAuthWithWatcher(options?: {
    checkIntervalMinutes?: number;
    showNotifications?: boolean;
  }) {
    const authData = useFrappeAuth();
    const watcherData = useAuthWatcher(options);
    
    return {
      ...authData,
      ...watcherData,
      // Helper methods
      isLoggedIn: !!authData.currentUser && !authData.isLoading,
      isOnLoginPage: isLoginPage(),
    };
  }
  
  /**
   * Manual token validation
   */
  static async validateToken() {
    return checkTokenValidity();
  }
  
  /**
   * Force logout and redirect
   */
  static forceLogout() {
    handleTokenExpiry();
  }
  
  /**
   * Get appropriate login URL
   */
  static getLoginUrl() {
    return getLoginUrl();
  }
  
  /**
   * Check if current page is login
   */
  static isLoginPage() {
    return isLoginPage();
  }
}

// Export hooks for easier usage
export const useAuthWithWatcher = AuthService.useAuthWithWatcher;
export const validateToken = AuthService.validateToken;
export const forceLogout = AuthService.forceLogout;
