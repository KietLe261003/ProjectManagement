import { useState, useEffect } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';

export interface UserRolesData {
  roles: string[];
  hasProjectsManager: boolean;
  isAdministrator: boolean;
  isLoading: boolean;
  error?: string;
}

export function useUserRoles(): UserRolesData {
  const { currentUser } = useFrappeAuth();
  const [rolesData, setRolesData] = useState<UserRolesData>({
    roles: [],
    hasProjectsManager: false,
    isAdministrator: false,
    isLoading: true
  });

  useEffect(() => {
    if (!currentUser) {
      setRolesData({
        roles: [],
        hasProjectsManager: false,
        isAdministrator: false,
        isLoading: false
      });
      return;
    }

    const checkUserRoles = async () => {
      try {
        setRolesData(prev => ({ ...prev, isLoading: true }));

        // Method 1: Administrator check (most reliable)
        if (currentUser === 'Administrator') {
          setRolesData({
            roles: ['Administrator'],
            hasProjectsManager: true, // Administrator has all permissions
            isAdministrator: true,
            isLoading: false
          });
          return;
        }

        // Method 2: Try client-side role checking
        if (typeof window !== 'undefined') {
          const frappe = (window as any).frappe;
          
          // Try session roles first
          if (frappe?.session?.user_roles && Array.isArray(frappe.session.user_roles)) {
            const userRoles = frappe.session.user_roles;
            console.log('User roles from session:', userRoles);
            setRolesData({
              roles: userRoles,
              hasProjectsManager: userRoles.includes('Projects Manager'),
              isAdministrator: userRoles.includes('Administrator'),
              isLoading: false
            });
            return;
          }

          // Try frappe.user.has_role method
          if (frappe?.user?.has_role && typeof frappe.user.has_role === 'function') {
            try {
              const hasProjectsManager = frappe.user.has_role('Projects Manager');
              const isAdmin = frappe.user.has_role('Administrator');
              console.log('Role check via frappe.user.has_role - Projects Manager:', hasProjectsManager, 'Administrator:', isAdmin);
              
              setRolesData({
                roles: [], // We don't have the full list, but we have the important checks
                hasProjectsManager,
                isAdministrator: isAdmin,
                isLoading: false
              });
              return;
            } catch (roleError) {
              console.warn('frappe.user.has_role failed:', roleError);
            }
          }
        }

        // Method 3: Manual API call using fetch as last resort
        console.log('Client-side role check failed, trying manual API call...');
        try {
          const response = await fetch('/api/method/todo.api.get_current_user_roles', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Manual API response:', data);
          
          if (data?.message?.success) {
            const result = data.message;
            setRolesData({
              roles: result.roles || [],
              hasProjectsManager: result.has_projects_manager || false,
              isAdministrator: result.is_administrator || false,
              isLoading: false
            });
            return;
          } else {
            throw new Error(data?.message?.message || 'API returned unsuccessful response');
          }
        } catch (fetchError) {
          console.error('Manual API call failed:', fetchError);
          throw fetchError;
        }
        
      } catch (error) {
        console.error('Error getting user roles:', error);
        
        // Better error message handling
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          errorMessage = JSON.stringify(error);
        }
        
        console.log('Processed error message:', errorMessage);
        
        // Final fallback: basic Administrator check
        setRolesData({
          roles: [],
          hasProjectsManager: false,
          isAdministrator: currentUser === 'Administrator',
          isLoading: false,
          error: errorMessage
        });
      }
    };

    checkUserRoles();
  }, [currentUser]);

  return rolesData;
}