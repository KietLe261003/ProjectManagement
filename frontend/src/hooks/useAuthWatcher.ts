import { useEffect, useRef, useCallback } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';
import { checkTokenValidity, handleTokenExpiry, isLoginPage } from '../utils/authUtils';
import { toast } from '../utils/toastUtils';

interface UseAuthWatcherOptions {
  /**
   * Interval in minutes to check token validity
   * @default 5
   */
  checkIntervalMinutes?: number;
  
  /**
   * Whether to show toast notifications for auth events
   * @default true
   */
  showNotifications?: boolean;
  
  /**
   * Whether to enable automatic token checking
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Callback when token expires
   */
  onTokenExpired?: () => void;
  
  /**
   * Warning time in minutes before showing expiry warning
   * @default 10
   */
  warningTimeMinutes?: number;
}

/**
 * Hook to automatically watch authentication status and handle token expiry
 */
export const useAuthWatcher = (options: UseAuthWatcherOptions = {}) => {
  const {
    checkIntervalMinutes = 5,
    showNotifications = true,
    enabled = true,
    onTokenExpired
  } = options;

  const { currentUser, isLoading } = useFrappeAuth();
  const intervalRef = useRef<number | null>(null);
  const warningShownRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleTokenExpiredInternal = useCallback(() => {
    cleanup();
    
    if (showNotifications) {
      toast.error('Session Expired', {
        description: 'Your session has expired. Please log in again.',
        duration: 3000,
      });
    }
    
    // Call custom callback if provided
    onTokenExpired?.();
    
    // Handle the expiry
    setTimeout(() => {
      handleTokenExpiry();
    }, 1000); // Small delay to show the toast
  }, [cleanup, onTokenExpired, showNotifications]);

  const checkAuth = useCallback(async () => {
    try {
      const tokenInfo = await checkTokenValidity();
      
      if (!tokenInfo.isValid) {
        console.warn('Authentication check failed - token invalid');
        handleTokenExpiredInternal();
        return false;
      }
      
      // Reset warning flag if token is valid
      warningShownRef.current = false;
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      
      // On network errors, don't immediately log out
      // Give it a few chances before forcing logout
      return true;
    }
  }, [handleTokenExpiredInternal]);

  const startWatching = useCallback(() => {
    // Don't start if disabled, loading, no user, or on login page
    if (!enabled || isLoading || !currentUser || isLoginPage()) {
      return;
    }

    cleanup(); // Clear any existing interval

    // Initial check
    checkAuth();

    // Set up periodic checking
    const intervalMs = checkIntervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(checkAuth, intervalMs);

    console.log(`Auth watcher started - checking every ${checkIntervalMinutes} minutes`);
  }, [enabled, isLoading, currentUser, checkIntervalMinutes, checkAuth, cleanup]);

  // Effect to start/stop watching based on auth state
  useEffect(() => {
    if (currentUser && !isLoading) {
      startWatching();
    } else {
      cleanup();
    }

    return cleanup;
  }, [currentUser, isLoading, startWatching, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Manual methods
  const manualCheck = useCallback(() => {
    return checkAuth();
  }, [checkAuth]);

  const forceLogout = useCallback(() => {
    handleTokenExpiredInternal();
  }, [handleTokenExpiredInternal]);

  return {
    /**
     * Manually trigger an authentication check
     */
    checkAuth: manualCheck,
    
    /**
     * Force logout and redirect to login page
     */
    forceLogout,
    
    /**
     * Whether the watcher is currently active
     */
    isWatching: !!intervalRef.current,
    
    /**
     * Current user from auth
     */
    currentUser,
    
    /**
     * Whether auth is loading
     */
    isLoading
  };
};
