import { useFrappeGetDocList, useFrappeAuth } from 'frappe-react-sdk';
import type { User } from '@/types/Core/User';
import { useMemo } from 'react';

export interface SimpleTeamMember {
  id: string;
  name: string;
  role: 'Leader' | 'Member';
  avatar: string;
}

// Alternative team service that doesn't rely on team_member doctype
export const useAlternativeTeamData = () => {
  const { currentUser } = useFrappeAuth();
  
  // Get all users as potential team members
  const { data: users, isLoading, error } = useFrappeGetDocList<User>('User', {
    fields: ['name', 'full_name', 'user_image', 'first_name', 'last_name', 'email'],
    filters: [['enabled', '=', 1], ['user_type', '=', 'System User']],
    limit: 20 // Limit to prevent too many users
  });

  // Create simple team data from users
  const simpleTeamData = useMemo((): SimpleTeamMember[] => {
    if (!users) return [];

    return users.map(user => ({
      id: user.name,
      name: user.full_name || user.first_name || user.name || 'Unknown User',
      role: user.name === currentUser ? 'Leader' : 'Member', // Simple role assignment
      avatar: user.user_image || 
        `https://placehold.co/40x40/e2e8f0/475569?text=${(user.first_name || user.full_name || 'U').charAt(0).toUpperCase()}`
    }));
  }, [users, currentUser]);

  return {
    simpleTeamData,
    users,
    isLoading,
    error
  };
};
