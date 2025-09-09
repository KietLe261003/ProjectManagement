import { useFrappeGetDocList, useFrappeAuth, useFrappeGetDoc } from 'frappe-react-sdk';
import type { User } from '@/types/Core/User';

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

  // Get current user info (basic from auth)
  static useCurrentUser() {
    const { currentUser, isLoading } = useFrappeAuth();
    
    return {
      currentUser,
      isLoading
    };
  }

  // Get current user full profile data
  static useCurrentUserProfile() {
    const { currentUser } = useFrappeAuth();
    
    const { data, isLoading, error } = useFrappeGetDoc('User', currentUser || undefined, {
      fields: UserService.USER_FIELDS
    });

    return {
      currentUserProfile: data as User | undefined,
      isLoading,
      error
    };
  }
}

// Export hooks for easier usage
export const useUsers = UserService.useUsers;
export const useCurrentUser = UserService.useCurrentUser;
export const useCurrentUserProfile = UserService.useCurrentUserProfile;
