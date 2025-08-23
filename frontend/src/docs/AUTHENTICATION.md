# 🔐 Authentication System - Auto Token Validation & Logout

## 📋 Tổng quan

Hệ thống authentication tự động kiểm tra token validity và redirect về trang đăng nhập khi token hết hạn.

## 🎯 Tính năng chính

### ✅ **Auto Token Validation**
- Kiểm tra token validity định kỳ (mặc định 5 phút)
- Tự động phát hiện khi session hết hạn
- Không chạy trên trang login để tránh infinite loop

### ✅ **Smart Logout Handling**
- Tự động clear cookies, localStorage, sessionStorage
- Toast notification thông báo user
- Redirect về đúng login URL (dev/prod)
- Graceful error handling

### ✅ **API Interceptor**
- Tự động detect 401/403 errors từ API responses
- Double-check token validity trước khi logout
- Enhanced fetch utilities với auth handling

### ✅ **React Integration**
- AuthWrapper component tự động wrap toàn bộ app
- useAuthWatcher hook có thể dùng trong component riêng lẻ
- Service layer với các utility functions

## 🔧 Cách sử dụng

### 1. **App Level (Đã setup)**
```tsx
// App.tsx
import { AuthWrapper } from './components/AuthWrapper';

function App() {
  return (
    <FrappeProvider>
      <AuthWrapper checkInterval={5} showNotifications={true}>
        <Layout />
      </AuthWrapper>
    </FrappeProvider>
  );
}
```

### 2. **Component Level**
```tsx
import { useAuthWatcher } from '@/hooks/useAuthWatcher';

function MyComponent() {
  const { checkAuth, forceLogout, isWatching } = useAuthWatcher({
    checkIntervalMinutes: 5,
    showNotifications: true,
    onTokenExpired: () => {
      console.log('Custom callback when token expires');
    }
  });

  return (
    <div>
      <button onClick={() => checkAuth()}>Check Auth</button>
      <button onClick={forceLogout}>Force Logout</button>
      <p>Watching: {isWatching ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 3. **Service Level**
```tsx
import { useAuthWithWatcher, validateToken, forceLogout } from '@/services';

function AdminPanel() {
  const { isLoggedIn, isWatching, currentUser } = useAuthWithWatcher({
    checkIntervalMinutes: 2, // Check more frequently for admin
    showNotifications: true
  });

  const handleManualCheck = async () => {
    const tokenInfo = await validateToken();
    if (!tokenInfo.isValid) {
      forceLogout();
    }
  };

  return (
    <div>
      <p>Status: {isLoggedIn ? 'Logged In' : 'Not Logged In'}</p>
      <p>Watching: {isWatching ? 'Active' : 'Inactive'}</p>
      <button onClick={handleManualCheck}>Manual Check</button>
    </div>
  );
}
```

### 4. **API Calls với Auth Handling**
```tsx
import { createAuthenticatedFetch } from '@/utils/apiUtils';

async function makeAPICall() {
  try {
    const response = await createAuthenticatedFetch('/api/method/my.method', {
      method: 'POST',
      body: { data: 'example' }
    });
    
    // Response sẽ tự động handle 401/403 errors
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
  }
}
```

## ⚙️ Configuration

### **AuthWrapper Options**
```tsx
interface AuthWrapperProps {
  children: React.ReactNode;
  checkInterval?: number;        // Minutes, default: 5
  showNotifications?: boolean;   // Default: true
}
```

### **useAuthWatcher Options**
```tsx
interface UseAuthWatcherOptions {
  checkIntervalMinutes?: number;     // Default: 5
  showNotifications?: boolean;       // Default: true
  enabled?: boolean;                 // Default: true
  onTokenExpired?: () => void;       // Custom callback
  warningTimeMinutes?: number;       // Default: 10 (reserved for future)
}
```

## 🛠️ Architecture

### **Files Created:**

1. **`utils/authUtils.ts`** - Core authentication utilities
   - `checkTokenValidity()` - Check if token is still valid
   - `handleTokenExpiry()` - Clean up and redirect to login
   - `setupTokenValidation()` - Setup periodic checking

2. **`hooks/useAuthWatcher.ts`** - React hook for auth monitoring
   - Automatic token checking with intervals
   - Toast notifications for auth events
   - Manual check and force logout methods

3. **`components/AuthWrapper.tsx`** - HOC component
   - Wraps entire app with auth monitoring
   - Handles loading states
   - Skips monitoring on login pages

4. **`services/authService.ts`** - Service layer
   - Enhanced auth hook with watcher
   - Utility methods for manual operations
   - Consistent API patterns

5. **`utils/apiUtils.ts`** - Enhanced API utilities
   - Auto-detect auth errors in responses
   - CSRF token management
   - Auth error handling

### **Flow Diagram:**
```
App Start
    ↓
AuthWrapper initialized
    ↓
useAuthWatcher hook starts
    ↓
Periodic token validation (every 5 mins)
    ↓
Token invalid? → Yes → handleTokenExpiry() → Redirect to login
    ↓
Token valid? → Yes → Continue normal operation
    ↓
API calls → 401/403 error → Auto token check → Logout if needed
```

## 🚨 Error Handling

### **Scenarios Covered:**

1. **Token naturally expires** → Automatic detection and logout
2. **Network errors during check** → Retry logic, don't immediately logout
3. **API calls return 401/403** → Double-check token validity before logout
4. **User manually logs out** → Clean logout with notifications
5. **Session invalidated on server** → Immediate detection and cleanup

### **Fallback Mechanisms:**

- If auth check fails due to network: Don't immediately logout
- If logout API fails: Force redirect anyway
- If token check endpoint unavailable: Use alternative validation methods
- If all else fails: Force redirect to login URL

## 🧪 Testing

### **Manual Testing:**

1. **Normal flow:** Login → Use app → Auto token validation works
2. **Token expiry:** Wait for token to expire → Should auto logout
3. **Manual logout:** Click logout button → Should redirect properly
4. **Network issues:** Disconnect internet during check → Should handle gracefully
5. **API errors:** Make API call that returns 401 → Should trigger logout

### **Console Logs:**

- Auth watcher status and configuration
- Token validation results
- Error handling steps
- Redirect actions

## 📝 Notes

- **Production Ready**: Handles both dev and production environments
- **Performance Optimized**: Minimal overhead, configurable intervals
- **User Friendly**: Toast notifications, smooth transitions
- **Developer Friendly**: Comprehensive logging, easy configuration
- **Secure**: Proper cleanup of all auth data

## 🔄 Future Enhancements

- [ ] Token refresh before expiry
- [ ] Multiple tab synchronization
- [ ] Remember login preference
- [ ] Activity-based token extension
- [ ] Biometric authentication support
