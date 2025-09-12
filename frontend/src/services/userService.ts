import { useFrappeGetDocList, useFrappeAuth, useFrappeGetDoc, useFrappeUpdateDoc, useFrappePostCall } from 'frappe-react-sdk';
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

  // Extended user profile fields for settings page
  static readonly USER_PROFILE_FIELDS = [
    'name',
    'email',
    'full_name', 
    'first_name',
    'middle_name',
    'last_name',
    'user_image',
    'phone',
    'mobile_no',
    'gender',
    'birth_date',
    'location',
    'bio',
    'interest',
    'time_zone',
    'language',
    'desk_theme',
    'role_profile_name',
    'enabled',
    'user_type',
    'last_login',
    'last_active'
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
    
    const { data, isLoading, error, mutate } = useFrappeGetDoc('User', currentUser || undefined, {
      fields: UserService.USER_PROFILE_FIELDS
    });

    return {
      currentUserProfile: data as User | undefined,
      isLoading,
      error,
      mutate
    };
  }

  // Update user profile
  static useUpdateUserProfile() {
    const { updateDoc, loading, isCompleted, error, reset } = useFrappeUpdateDoc();
    
    const updateProfile = async (userId: string, profileData: Partial<User>) => {
      try {
        const result = await updateDoc('User', userId, profileData);
        return result;
      } catch (err) {
        console.error('Error updating user profile:', err);
        throw err;
      }
    };

    return {
      updateProfile,
      loading,
      isCompleted,
      error,
      reset
    };
  }

  // Change password
  static useChangePassword() {
    const { call, loading, error } = useFrappePostCall('frappe.core.doctype.user.user.update_password');

    const changePassword = async (oldPassword: string, newPassword: string) => {
      try {
        const result = await call({
          old_password: oldPassword,
          new_password: newPassword
        });
        return result;
      } catch (err) {
        console.error('Error changing password:', err);
        throw err;
      }
    };

    return {
      changePassword,
      loading,
      error
    };
  }

  // Upload user image
  static useUploadUserImage() {
    const { call, loading, error } = useFrappePostCall('frappe.handler.upload_file');

    const uploadImage = async (file: File, userId: string) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('doctype', 'User');
        formData.append('docname', userId);
        formData.append('fieldname', 'user_image');

        const result = await call(formData);
        return result;
      } catch (err) {
        console.error('Error uploading user image:', err);
        throw err;
      }
    };

    return {
      uploadImage,
      loading,
      error
    };
  }

  // Get user roles
  static useUserRoles(userId?: string) {
    const { data, isLoading, error } = useFrappeGetDocList('Has Role', {
      fields: ['role', 'parent'],
      filters: userId ? [['parent', '=', userId]] : [],
      limit: 0
    });

    return {
      roles: data || [],
      isLoading,
      error
    };
  }

  // Get user permissions and settings
  static useUserPermissions() {
    const { call, loading, error } = useFrappePostCall('frappe.core.doctype.user.user.get_user_permissions');

    const getUserPermissions = async (user: string) => {
      try {
        const result = await call({ user });
        return result;
      } catch (err) {
        console.error('Error getting user permissions:', err);
        throw err;
      }
    };

    return {
      getUserPermissions,
      loading,
      error
    };
  }
}

// Export hooks for easier usage
export const useUsers = UserService.useUsers;
export const useCurrentUser = UserService.useCurrentUser;
export const useCurrentUserProfile = UserService.useCurrentUserProfile;
export const useUpdateUserProfile = UserService.useUpdateUserProfile;
export const useChangePassword = UserService.useChangePassword;
export const useUploadUserImage = UserService.useUploadUserImage;
export const useUserRoles = UserService.useUserRoles;
export const useUserPermissions = UserService.useUserPermissions;
