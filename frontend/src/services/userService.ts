import { useFrappeGetDocList, useFrappeAuth } from 'frappe-react-sdk';

// User Service for managing user-related API calls
export class UserService {
  // Standard user fields
  static readonly USER_FIELDS = [
    'name',
    'email', 
    'full_name',
    'first_name',
    'last_name',
    'user_image',
    'enabled',
    'user_type',
    'role_profile_name'
  ];

  // Get all active users
  static useUsers() {
    const { data, isLoading, error } = useFrappeGetDocList('User', {
      fields: UserService.USER_FIELDS,
      filters: [['enabled', '=', 1], ['user_type', '=', 'System User']],
      limit: 0
    });

    return {
      data: data || [],
      isLoading,
      error
    };
  }

  // Get current user info
  static useCurrentUser() {
    const { currentUser, isLoading } = useFrappeAuth();
    
    return {
      currentUser,
      isLoading
    };
  }
}

// Export hooks for easier usage
export const useUsers = UserService.useUsers;
export const useCurrentUser = UserService.useCurrentUser;
