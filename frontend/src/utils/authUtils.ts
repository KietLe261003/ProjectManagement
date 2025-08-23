/**
 * Authentication utilities for token management and auto-logout
 */

export interface AuthTokenInfo {
  isValid: boolean;
  expiresAt?: Date;
  remainingTime?: number;
}

/**
 * Check if user session/token is valid
 */
export const checkTokenValidity = async (): Promise<AuthTokenInfo> => {
  try {
    // Try to make a simple authenticated request to check session
    const response = await fetch('/api/method/frappe.auth.get_logged_user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': (window as any).csrf_token || '',
      },
    });

    if (response.status === 401 || response.status === 403) {
      return {
        isValid: false
      };
    }

    if (response.ok) {
      const data = await response.json();
      
      // If we get a valid response with user data, token is valid
      if (data && !data.exc) {
        return {
          isValid: true
        };
      }
    }

    return {
      isValid: false
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      isValid: false
    };
  }
};

/**
 * Clear all authentication data and redirect to login
 */
export const handleTokenExpiry = () => {
  try {
    // Clear any local storage data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies by setting them to expire
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // Show notification
    console.warn('Session expired. Redirecting to login...');
    
    // Redirect to login page
    const loginUrl = import.meta.env.DEV 
      ? 'http://localhost:8007/login'
      : '/login';
    
    window.location.href = loginUrl;
  } catch (error) {
    console.error('Error handling token expiry:', error);
    // Force redirect anyway
    window.location.href = '/login';
  }
};

/**
 * Get the expected login URL based on environment
 */
export const getLoginUrl = (): string => {
  if (import.meta.env.DEV) {
    return 'http://localhost:8007/login';
  }
  return '/login';
};

/**
 * Check if current page is login page
 */
export const isLoginPage = (): boolean => {
  return window.location.pathname.includes('/login') || 
         window.location.pathname.includes('/signin');
};

/**
 * Setup periodic token validation
 */
export const setupTokenValidation = (intervalMinutes: number = 5) => {
  // Don't setup on login pages
  if (isLoginPage()) {
    return null;
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  
  const intervalId = setInterval(async () => {
    const tokenInfo = await checkTokenValidity();
    
    if (!tokenInfo.isValid) {
      console.warn('Token expired or invalid. Logging out...');
      clearInterval(intervalId);
      handleTokenExpiry();
    }
  }, intervalMs);

  // Also check immediately
  checkTokenValidity().then(tokenInfo => {
    if (!tokenInfo.isValid) {
      clearInterval(intervalId);
      handleTokenExpiry();
    }
  });

  return intervalId;
};
