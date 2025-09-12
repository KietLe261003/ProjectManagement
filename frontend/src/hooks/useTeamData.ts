import { useMemo } from 'react';
import {  useFrappeGetDoc, useFrappeGetDocList, useFrappeAuth } from 'frappe-react-sdk';
import type { User } from '@/types/Core/User';
import type { TaskItem } from '@/types';
import { useAllTeamTasks } from '@/services/teamTaskService';
import { useAlternativeTeamData } from '@/services/alternativeTeamService';
import { useAllTodos } from '@/services/todoService';
import type { Team } from '@/types/Todo/Team';

export interface TeamMemberData {
  id: string;
  name: string;
  role: 'Leader' | 'Member';
  taskCount: number;
  avatar: string;
  tasks: TaskItem[];
  user: User | undefined;
}

export const useTeamData = ({team}:{team:string}) => {
  const {data: teamMember1,isLoading: isLoadingTeamMembers, error: teamMembersError }=useFrappeGetDoc<Team>('Team',team)
  const teamMembers=teamMember1?.team_member || [];
  
  // Check if current user is Administrator
  const { currentUser } = useFrappeAuth();
  const isAdmin = currentUser === "Administrator";
  
  // Fetch user data to get full names and avatars
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useFrappeGetDocList<User>('User', {
    fields: ['name', 'full_name', 'user_image', 'first_name', 'last_name', 'email'],
    limit: 0
  });

  // Alternative team data for when team_member permission is denied
  const { simpleTeamData, isLoading: isLoadingAlternative } = useAlternativeTeamData();

  // Check if team_member error is permission related
  const hasTeamMemberPermission = !teamMembersError || !teamMembersError.message?.includes('PermissionError');

  // Fetch all team tasks
  const { allTasks, allSubTasks, isLoading: isLoadingTasks, error: tasksError } = useAllTeamTasks();

  // Fetch all todos to get correct task assignments
  const { todos, isLoading: isLoadingTodos, error: todosError } = useAllTodos();

  // Transform all tasks to TaskItem format
  const allTransformedTasks = useMemo((): TaskItem[] => {
    const taskItems: TaskItem[] = [];

    // Transform Tasks - use TODO allocated_to for correct assignment
    allTasks.forEach((task) => {
      // Find corresponding TODO to get allocated_to
      const relatedTodo = todos?.find(todo => 
        todo.reference_type === 'Task' && todo.reference_name === task.name
      );
      
      taskItems.push({
        id: task.name,
        title: task.subject || 'Untitled Task',
        description: task.description || 'No description available',
        project: task.project || 'Unknown Project',
        assignee: relatedTodo?.allocated_to || task.completed_by || task.owner || 'Unknown',
        status: task.status || 'Open',
        priority: task.priority || 'Medium',
        dueDate: task.exp_end_date || new Date().toISOString().split('T')[0],
        labels: [task.type || 'Task'],
        todoId: relatedTodo?.name || '',
        referenceName: task.name,
        referenceType: 'Task',
        type: 'Task',
        taskProgress: task.progress,
        expectedTime: task.expected_time,
        actualTime: 0,
        startDate: task.exp_start_date,
        endDate: task.exp_end_date
      });
    });

    // Transform SubTasks - use TODO allocated_to for correct assignment
    allSubTasks.forEach((subTask) => {
      // Find corresponding TODO to get allocated_to
      const relatedTodo = todos?.find(todo => 
        todo.reference_type === 'SubTask' && todo.reference_name === subTask.name
      );
      
      taskItems.push({
        id: subTask.name,
        title: subTask.subject || 'Untitled SubTask',
        description: subTask.description || 'No description available',
        project: 'Unknown Project', // SubTasks don't have direct project link
        assignee: relatedTodo?.allocated_to || subTask.assigned_to || subTask.owner || 'Unknown',
        status: subTask.status || 'Open',
        priority: 'Medium', // SubTasks don't have priority field
        dueDate: subTask.end_date || new Date().toISOString().split('T')[0],
        labels: ['SubTask'],
        todoId: relatedTodo?.name || '',
        referenceName: subTask.name,
        referenceType: 'SubTask',
        type: 'SubTask',
        parentTask: subTask.task,
        startDate: subTask.start_date,
        endDate: subTask.end_date
      });
    });
    return taskItems.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [allTasks, allSubTasks, todos]);

  // Process team members data with fallback for permission errors
  const teamMembersData = useMemo((): TeamMemberData[] => {
    // If admin, return all system users
    if (isAdmin && users) {
      return users.map(user => {
        const userTasks = allTransformedTasks.filter(task => task.assignee === user.name);
        
        // Generate avatar URL or use placeholder
        const avatar = user.user_image || 
          `https://placehold.co/40x40/e2e8f0/475569?text=${(user.first_name || user.full_name || 'U').charAt(0).toUpperCase()}`;
        
        return {
          id: user.name || '',
          name: user.full_name || user.first_name || user.name || 'Unknown User',
          role: user.name === currentUser ? 'Leader' : 'Member', // Admin is leader, others are members
          taskCount: userTasks.length,
          avatar,
          tasks: userTasks,
          user
        };
      });
    }

    // If we don't have team members data due to permission error, use alternative data
    if (!teamMembers || teamMembersError?.message?.includes('PermissionError')) {
      // Use simple team data from alternative service
      if (simpleTeamData && simpleTeamData.length > 0) {
        return simpleTeamData.map(member => {
          const userTasks = allTransformedTasks.filter(task => task.assignee === member.id);
          
          return {
            id: member.id,
            name: member.name,
            role: member.role,
            taskCount: userTasks.length,
            avatar: member.avatar,
            tasks: userTasks,
            user: users?.find(u => u.name === member.id)
          };
        });
      }
      
      // Final fallback: create a simple entry for current user if we have user data
      if (users && users.length > 0) {
        const currentUserData = users[0]; // Use first user as fallback
        const userTasks = allTransformedTasks.filter(task => task.assignee === currentUserData?.name);
        
        return [{
          id: currentUserData?.name || 'unknown',
          name: currentUserData?.full_name || currentUserData?.first_name || 'Current User',
          role: 'Member' as const,
          taskCount: userTasks.length,
          avatar: currentUserData?.user_image || 
            `https://placehold.co/40x40/e2e8f0/475569?text=${(currentUserData?.first_name || 'U').charAt(0).toUpperCase()}`,
          tasks: userTasks,
          user: currentUserData
        }];
      }
      return [];
    }

    if (!users) return [];

    return teamMembers.map(member => {
      const user = users.find(u => u.name === member.user);
      const memberTasks = allTransformedTasks.filter(task => task.assignee === member.user);
      
      // Generate avatar URL or use placeholder
      const avatar = user?.user_image || 
        `https://placehold.co/40x40/e2e8f0/475569?text=${(user?.first_name || user?.full_name || 'U').charAt(0).toUpperCase()}`;
      
      return {
        id: member.user || '',
        name: user?.full_name || user?.first_name || member.user || 'Unknown User',
        role: member.role || 'Member',
        taskCount: memberTasks.length,
        avatar,
        tasks: memberTasks,
        user
      };
    });
  }, [teamMembers, users, allTransformedTasks, teamMembersError, simpleTeamData, isAdmin, currentUser]);
  return {
    teamMembersData,
    allTransformedTasks,
    isLoading: isLoadingTeamMembers || isLoadingUsers || isLoadingTasks || isLoadingAlternative || isLoadingTodos,
    error: (teamMembersError && !teamMembersError.message?.includes('PermissionError')) ? teamMembersError : (usersError || tasksError || todosError),
    teamMembers,
    users,
    hasTeamMemberPermission
  };
};
