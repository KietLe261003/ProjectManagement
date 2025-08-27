/**
 * Global toast utilities and configuration
 */

import { toast as sonnerToast } from 'sonner';

// Configure default toast options
const DEFAULT_TOAST_OPTIONS = {
  duration: 4000,
  position: 'top-right' as const,
};

/**
 * Enhanced toast utility with duplicate prevention
 */
class ToastManager {
  private static activeToasts = new Set<string>();
  private static readonly DUPLICATE_TIMEOUT = 1000; // 1 second

  /**
   * Show success toast with duplicate prevention
   */
  static success(title: string, options?: { description?: string; duration?: number }) {
    const key = `success-${title}`;
    
    if (this.activeToasts.has(key)) {
      return;
    }
    
    this.activeToasts.add(key);
    
    const toastId = sonnerToast.success(title, {
      description: options?.description,
      duration: options?.duration || DEFAULT_TOAST_OPTIONS.duration,
      onDismiss: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      },
      onAutoClose: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      }
    });
    
    return toastId;
  }

  /**
   * Show error toast with duplicate prevention
   */
  static error(title: string, options?: { description?: string; duration?: number }) {
    const key = `error-${title}`;
    
    if (this.activeToasts.has(key)) {
      return;
    }
    
    this.activeToasts.add(key);
    
    const toastId = sonnerToast.error(title, {
      description: options?.description,
      duration: options?.duration || DEFAULT_TOAST_OPTIONS.duration,
      onDismiss: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      },
      onAutoClose: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      }
    });
    
    return toastId;
  }

  /**
   * Show info toast with duplicate prevention
   */
  static info(title: string, options?: { description?: string; duration?: number }) {
    const key = `info-${title}`;
    
    if (this.activeToasts.has(key)) {
      return;
    }
    
    this.activeToasts.add(key);
    
    const toastId = sonnerToast.info(title, {
      description: options?.description,
      duration: options?.duration || DEFAULT_TOAST_OPTIONS.duration,
      onDismiss: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      },
      onAutoClose: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      }
    });
    
    return toastId;
  }

  /**
   * Show warning toast with duplicate prevention
   */
  static warning(title: string, options?: { description?: string; duration?: number }) {
    const key = `warning-${title}`;
    
    if (this.activeToasts.has(key)) {
      return;
    }
    
    this.activeToasts.add(key);
    
    const toastId = sonnerToast.warning(title, {
      description: options?.description,
      duration: options?.duration || DEFAULT_TOAST_OPTIONS.duration,
      onDismiss: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      },
      onAutoClose: () => {
        setTimeout(() => {
          this.activeToasts.delete(key);
        }, this.DUPLICATE_TIMEOUT);
      }
    });
    
    return toastId;
  }

  /**
   * Dismiss all toasts
   */
  static dismissAll() {
    sonnerToast.dismiss();
    this.activeToasts.clear();
  }

  /**
   * Clear duplicate protection cache (useful for testing)
   */
  static clearCache() {
    this.activeToasts.clear();
  }
}

// Export the enhanced toast
export const toast = ToastManager;

// Also export the original toast for cases where duplicate prevention is not needed
export const originalToast = sonnerToast;
