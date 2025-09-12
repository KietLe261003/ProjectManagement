import { useTeamData } from '@/hooks/useTeamData';
import { getStatusColor } from '@/utils/color';
import React, { useState, useMemo } from 'react';
import { useFrappeGetDocList, useFrappeGetDoc } from 'frappe-react-sdk';
import type { Team } from '@/types/Todo/Team';
import type { Project } from '@/types/Projects/Project';

interface AdminTasksViewProps {
  teamDataError: any;
  teamMembersData: any[];
  selectedMember: string | null;
  setSelectedMember: (id: string | null) => void;
  formatDate: (dateString: string) => { formatted: string; isOverdue: boolean; display: string };
  handleTaskClick: (task: any) => void;
}

const AdminTasksView: React.FC<AdminTasksViewProps> = ({
  teamDataError,
  teamMembersData,
  selectedMember,
  setSelectedMember,
  formatDate,
  handleTaskClick,
}) => {
  // For admin, we'll use the first team or create a comprehensive view
  // Admin should see all data, so we use team data with empty string to get all
  const { allTransformedTasks, isLoading } = useTeamData({
    team: '' // Empty team to get all users data
  });

  // First, get list of all team names
  const { data: teamsList } = useFrappeGetDocList<Team>('Team', {
    fields: ['name'],
    limit: 0
  });

  // Get all team details dynamically - use a safer approach with fixed hooks
  const teamNames = teamsList?.map(t => t.name).filter(Boolean) || [];
  
  // Fetch all projects to get team information
  const { data: projectsList } = useFrappeGetDocList<Project>('Project', {
    fields: ['name', 'project_name', 'team'],
    limit: 0
  });

  // Get unique teams from projects
  const projectTeams = useMemo(() => {
    if (!projectsList) return [];
    const teams = projectsList
      .map(project => project.team)
      .filter(Boolean)
      .filter((team, index, arr) => arr.indexOf(team) === index); // Remove duplicates
    return teams;
  }, [projectsList]);
  
  // Create up to 20 hooks (should be enough for most cases)
  // Only enable the hook if we have a valid team name at that index
  const team1Data = useFrappeGetDoc<Team>('Team', teamNames[0], teamNames[0] ? undefined : { disabled: true });
  const team2Data = useFrappeGetDoc<Team>('Team', teamNames[1], teamNames[1] ? undefined : { disabled: true });
  const team3Data = useFrappeGetDoc<Team>('Team', teamNames[2], teamNames[2] ? undefined : { disabled: true });
  const team4Data = useFrappeGetDoc<Team>('Team', teamNames[3], teamNames[3] ? undefined : { disabled: true });
  const team5Data = useFrappeGetDoc<Team>('Team', teamNames[4], teamNames[4] ? undefined : { disabled: true });
  const team6Data = useFrappeGetDoc<Team>('Team', teamNames[5], teamNames[5] ? undefined : { disabled: true });
  const team7Data = useFrappeGetDoc<Team>('Team', teamNames[6], teamNames[6] ? undefined : { disabled: true });
  const team8Data = useFrappeGetDoc<Team>('Team', teamNames[7], teamNames[7] ? undefined : { disabled: true });
  const team9Data = useFrappeGetDoc<Team>('Team', teamNames[8], teamNames[8] ? undefined : { disabled: true });
  const team10Data = useFrappeGetDoc<Team>('Team', teamNames[9], teamNames[9] ? undefined : { disabled: true });
  const team11Data = useFrappeGetDoc<Team>('Team', teamNames[10], teamNames[10] ? undefined : { disabled: true });
  const team12Data = useFrappeGetDoc<Team>('Team', teamNames[11], teamNames[11] ? undefined : { disabled: true });
  const team13Data = useFrappeGetDoc<Team>('Team', teamNames[12], teamNames[12] ? undefined : { disabled: true });
  const team14Data = useFrappeGetDoc<Team>('Team', teamNames[13], teamNames[13] ? undefined : { disabled: true });
  const team15Data = useFrappeGetDoc<Team>('Team', teamNames[14], teamNames[14] ? undefined : { disabled: true });
  const team16Data = useFrappeGetDoc<Team>('Team', teamNames[15], teamNames[15] ? undefined : { disabled: true });
  const team17Data = useFrappeGetDoc<Team>('Team', teamNames[16], teamNames[16] ? undefined : { disabled: true });
  const team18Data = useFrappeGetDoc<Team>('Team', teamNames[17], teamNames[17] ? undefined : { disabled: true });
  const team19Data = useFrappeGetDoc<Team>('Team', teamNames[18], teamNames[18] ? undefined : { disabled: true });
  const team20Data = useFrappeGetDoc<Team>('Team', teamNames[19], teamNames[19] ? undefined : { disabled: true });

  // Combine all team details we have
  const allTeams = useMemo(() => {
    const teams: any[] = [];
    if (team1Data.data) teams.push(team1Data.data);
    if (team2Data.data) teams.push(team2Data.data);
    if (team3Data.data) teams.push(team3Data.data);
    if (team4Data.data) teams.push(team4Data.data);
    if (team5Data.data) teams.push(team5Data.data);
    if (team6Data.data) teams.push(team6Data.data);
    if (team7Data.data) teams.push(team7Data.data);
    if (team8Data.data) teams.push(team8Data.data);
    if (team9Data.data) teams.push(team9Data.data);
    if (team10Data.data) teams.push(team10Data.data);
    if (team11Data.data) teams.push(team11Data.data);
    if (team12Data.data) teams.push(team12Data.data);
    if (team13Data.data) teams.push(team13Data.data);
    if (team14Data.data) teams.push(team14Data.data);
    if (team15Data.data) teams.push(team15Data.data);
    if (team16Data.data) teams.push(team16Data.data);
    if (team17Data.data) teams.push(team17Data.data);
    if (team18Data.data) teams.push(team18Data.data);
    if (team19Data.data) teams.push(team19Data.data);
    if (team20Data.data) teams.push(team20Data.data);
    
    return teams;
  }, [
    team1Data.data, team2Data.data, team3Data.data, team4Data.data, team5Data.data,
    team6Data.data, team7Data.data, team8Data.data, team9Data.data, team10Data.data,
    team11Data.data, team12Data.data, team13Data.data, team14Data.data, team15Data.data,
    team16Data.data, team17Data.data, team18Data.data, team19Data.data, team20Data.data
  ]);

  // Group users by team
  const groupedUsers = useMemo(() => {
    const groups: { [teamName: string]: any[] } = {};
    const unassignedUsers: any[] = [];

    // Initialize groups with teams
    allTeams?.forEach(team => {
      groups[team.team || team.name] = [];
      
      // Add team lead
      if (team.teamlead) {
        const existingUser = teamMembersData.find(user => user.id === team.teamlead);
        if (existingUser && !groups[team.team || team.name].find(u => u.id === existingUser.id)) {
          groups[team.team || team.name].push({
            ...existingUser,
            role: 'Leader'
          });
        }
      }

      // Add team members
      team.team_member?.forEach((member: any) => {
        const existingUser = teamMembersData.find(user => user.id === member.user);
        if (existingUser && !groups[team.team || team.name].find(u => u.id === existingUser.id)) {
          groups[team.team || team.name].push({
            ...existingUser,
            role: member.role || 'Member' // Use role from team_member or default to Member
          });
        }
      });
    });

    // Add users not in any team to unassigned
    teamMembersData.forEach(user => {
      const isInAnyTeam = Object.values(groups).some(teamUsers => 
        teamUsers.find((u: any) => u.id === user.id)
      );
      if (!isInAnyTeam) {
        unassignedUsers.push(user);
      }
    });

    if (unassignedUsers.length > 0) {
      groups['Không thuộc team nào'] = unassignedUsers;
    }

    return groups;
  }, [allTeams, teamMembersData]);
  
  // States for user search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // State for team selection
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  // State for project team filter
  const [selectedProjectTeam, setSelectedProjectTeam] = useState<string | null>(null);
  
  // State for team expansion (dropdown functionality)
  const [expandedTeams, setExpandedTeams] = useState<{ [teamName: string]: boolean }>({});
  
  // Function to toggle team expansion
  const toggleTeamExpansion = (teamName: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamName]: !prev[teamName]
    }));
  };
  
  // Function to expand/collapse all teams
  const toggleAllTeams = () => {
    const allExpanded = Object.values(expandedTeams).every(Boolean);
    const newState: { [teamName: string]: boolean } = {};
    Object.keys(groupedUsers).forEach(teamName => {
      newState[teamName] = !allExpanded;
    });
    setExpandedTeams(newState);
  };

  // Function to handle member selection
  const handleMemberSelection = (memberId: string) => {
    setSelectedMember(memberId);
    setSelectedTeam(null); // Clear team selection when selecting a user
    setSelectedProjectTeam(null); // Clear project team selection when selecting a user
  };
  
  // States for task search and filtering
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const [tasksPerPage] = useState(10);
  
  // Filter and paginate users by teams
  const filteredGroupedUsers = useMemo(() => {
    const filtered: { [teamName: string]: any[] } = {};
    
    Object.entries(groupedUsers).forEach(([teamName, users]) => {
      const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      
      if (filteredUsers.length > 0) {
        filtered[teamName] = filteredUsers;
      }
    });
    
    return filtered;
  }, [groupedUsers, userSearchTerm]);
  
  // Get tasks for selected member
  const selectedMemberTasks = useMemo(() => {
    if (!selectedMember) return [];
    
    // Filter tasks assigned to the selected member
    return allTransformedTasks.filter(task => 
      task.assignee === selectedMember
    );
  }, [selectedMember, allTransformedTasks]);

  // Get tasks for selected team
  const selectedTeamTasks = useMemo(() => {
    if (!selectedTeam || selectedMember) return [];
    
    // Get all user IDs in the selected team
    const teamUsers = groupedUsers[selectedTeam] || [];
    const teamUserIds = teamUsers.map(user => user.id);
    
    // Filter tasks assigned to any member of the selected team
    return allTransformedTasks.filter(task => 
      teamUserIds.includes(task.assignee)
    );
  }, [selectedTeam, selectedMember, allTransformedTasks, groupedUsers]);

  // Get tasks for selected project team
  const selectedProjectTeamTasks = useMemo(() => {
    if (!selectedProjectTeam || selectedMember || selectedTeam) return [];
    
    // Filter tasks by project team
    return allTransformedTasks.filter(task => {
      // Find the project for this task
      const project = projectsList?.find(p => 
        p.name === task.project || p.project_name === task.project
      );
      return project && project.team === selectedProjectTeam;
    });
  }, [selectedProjectTeam, selectedMember, selectedTeam, allTransformedTasks, projectsList]);

  // Calculate statistics for dashboard - changes based on selected user, team, or project team
  const statistics = useMemo(() => {
    // Priority: User > Team > Project Team > Global
    let tasksToAnalyze = allTransformedTasks; // Default to global stats
    
    if (selectedMember) {
      tasksToAnalyze = selectedMemberTasks;
    } else if (selectedTeam) {
      tasksToAnalyze = selectedTeamTasks;
    } else if (selectedProjectTeam) {
      tasksToAnalyze = selectedProjectTeamTasks;
    }
    
    const total = tasksToAnalyze.length;
    const working = tasksToAnalyze.filter(task => 
      task.status?.toLowerCase() === 'working'
    ).length;
    const completed = tasksToAnalyze.filter(task => 
      task.status?.toLowerCase() === 'completed'
    ).length;
    const overdue = tasksToAnalyze.filter(task => {
      if (task.status?.toLowerCase() === 'completed') return false;
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      return dueDate < today;
    }).length;

    return { total, working, completed, overdue };
  }, [selectedMember, selectedMemberTasks, selectedTeam, selectedTeamTasks, selectedProjectTeam, selectedProjectTeamTasks, allTransformedTasks]);

  // Filter and paginate tasks
  const filteredTasks = useMemo(() => {
    let tasks = selectedMemberTasks;
    
    // Apply search filter
    if (taskSearchTerm) {
      tasks = tasks.filter((task: any) =>
        task.title?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.subject?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(taskSearchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (taskStatusFilter) {
      tasks = tasks.filter((task: any) => task.status === taskStatusFilter);
    }
    
    // Apply type filter
    if (taskTypeFilter) {
      tasks = tasks.filter((task: any) => task.type === taskTypeFilter || task.referenceType === taskTypeFilter);
    }
    
    return tasks;
  }, [selectedMemberTasks, taskSearchTerm, taskStatusFilter, taskTypeFilter]);
  
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentTaskPage - 1) * tasksPerPage;
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [filteredTasks, currentTaskPage, tasksPerPage]);
  
  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage);
  
  // Safe pagination functions for tasks only
  const setCurrentTaskPageSafe = (page: number) => {
    setCurrentTaskPage(Math.max(1, Math.min(page, totalTaskPages)));
  };
  
  // Reset task pagination when member changes
  React.useEffect(() => {
    setCurrentTaskPage(1);
  }, [selectedMember]);

  // Reset team selection when member changes
  React.useEffect(() => {
    if (selectedMember) {
      setSelectedTeam(null);
      setSelectedProjectTeam(null);
    }
  }, [selectedMember]);

  // Reset member and team selection when project team changes
  React.useEffect(() => {
    if (selectedProjectTeam) {
      setSelectedMember(null);
      setSelectedTeam(null);
    }
  }, [selectedProjectTeam]);
  
  // Initialize expanded teams - expand all teams by default (only once)
  React.useEffect(() => {
    if (Object.keys(groupedUsers).length > 0 && Object.keys(expandedTeams).length === 0) {
      const initialExpanded: { [teamName: string]: boolean } = {};
      Object.keys(groupedUsers).forEach(teamName => {
        initialExpanded[teamName] = true; // Expand all teams by default
      });
      setExpandedTeams(initialExpanded);
    }
  }, [groupedUsers, expandedTeams]);
  
  // Get unique status and type values for filters
  const uniqueStatuses = useMemo(() => {
    return [...new Set(selectedMemberTasks.map((task: any) => task.status).filter(Boolean))];
  }, [selectedMemberTasks]);
  
  const uniqueTypes = useMemo(() => {
    return [...new Set(selectedMemberTasks.map((task: any) => task.type || task.referenceType).filter(Boolean))];
  }, [selectedMemberTasks]);

  if (teamDataError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Lỗi khi tải dữ liệu nhóm: {teamDataError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view">
      {/* Dashboard Statistics Section */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {selectedMember 
              ? `Thống kê công việc - ${teamMembersData.find(u => u.id === selectedMember)?.name || selectedMember}`
              : selectedTeam
              ? `Thống kê công việc - Team ${selectedTeam}`
              : selectedProjectTeam
              ? `Thống kê công việc - Project Team ${selectedProjectTeam}`
              : 'Dashboard Tổng Quan - Toàn hệ thống'
            }
          </h2>
          
          {/* Project Team Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Lọc theo Project Team:</label>
            <select
              value={selectedProjectTeam || ''}
              onChange={(e) => {
                const value = e.target.value || null;
                setSelectedProjectTeam(value);
                if (value) {
                  setSelectedMember(null);
                  setSelectedTeam(null);
                }
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[200px]"
            >
              <option value="">Tất cả Project Teams</option>
              {projectTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            {selectedProjectTeam && (
              <button
                onClick={() => setSelectedProjectTeam(null)}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                title="Xóa bộ lọc"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Tổng công việc</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{statistics.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Đang thực hiện</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">{statistics.working}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Hoàn thành</p>
            <p className="text-3xl font-bold text-emerald-500 mt-1">{statistics.completed}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">Trễ hạn</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{statistics.overdue}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  📋 Quản lý toàn bộ công việc (Admin)
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Xem và quản lý công việc của tất cả thành viên trong hệ thống
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Tổng số thành viên:</span>
                <span className="font-semibold text-slate-700">{teamMembersData.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row h-[600px]">
            {/* Danh sách thành viên bên trái */}
            <div className="lg:w-1/3 border-r border-slate-200 p-4">
              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm thành viên..."
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={toggleAllTeams}
                    className="px-3 py-2 text-xs bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                  >
                    {Object.values(expandedTeams).every(Boolean) ? '📁 Thu gọn' : '📂 Mở rộng'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-4 h-[400px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : Object.keys(filteredGroupedUsers).length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="mx-auto h-12 w-12 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p>Không tìm thấy thành viên nào.</p>
                  </div>
                ) : (
                  Object.entries(filteredGroupedUsers).map(([teamName, users]) => (
                    <div key={teamName} className="mb-4">
                      {/* Team Header - Clickable for expand/collapse */}
                      <div 
                        className={`flex items-center mb-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                          selectedTeam === teamName && !selectedMember
                            ? 'bg-blue-100 border border-blue-300 hover:bg-blue-200'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                        onClick={() => toggleTeamExpansion(teamName)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {/* Expand/Collapse Icon */}
                          <svg 
                            className={`w-4 h-4 text-slate-600 transition-transform ${
                              expandedTeams[teamName] ? 'rotate-90' : 'rotate-0'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          
                          {/* Team Info */}
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                              {teamName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {users.length} thành viên
                            </p>
                          </div>
                          
                          {/* Statistics Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering team expansion
                              setSelectedTeam(teamName);
                              setSelectedMember(null);
                            }}
                            className={`p-1.5 rounded-md transition-colors hover:bg-blue-200 ${
                              selectedTeam === teamName && !selectedMember
                                ? 'bg-blue-200 text-blue-700'
                                : 'text-slate-500 hover:text-blue-600'
                            }`}
                            title="Xem thống kê team"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Team Members - Collapsible */}
                      {expandedTeams[teamName] && (
                        <div className="space-y-2 ml-6 animate-in slide-in-from-top-2 duration-200">
                          {users.map((member: any) => (
                            <div
                              key={member.id}
                              onClick={() => handleMemberSelection(member.id)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedMember === member.id
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-slate-800 truncate text-sm">{member.name}</h4>
                                    {member.role === 'Leader' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Leader
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">{member.id}</p>
                                </div>
                                {selectedMember === member.id && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chi tiết công việc bên phải */}
            <div className="lg:w-2/3 p-4 flex flex-col">
              {selectedMember ? (
                (() => {
                  const member = teamMembersData.find(m => m.id === selectedMember);
                  return (
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {member?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{member?.name}</h3>
                            <p className="text-sm text-slate-500">Công việc được giao: {selectedMemberTasks.length}</p>
                          </div>
                        </div>

                        {/* Task filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                          <input
                            type="text"
                            placeholder="🔍 Tìm kiếm công việc..."
                            value={taskSearchTerm}
                            onChange={(e) => {
                              setTaskSearchTerm(e.target.value);
                              setCurrentTaskPage(1);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <select
                            value={taskStatusFilter}
                            onChange={(e) => {
                              setTaskStatusFilter(e.target.value);
                              setCurrentTaskPage(1);
                            }}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">Tất cả trạng thái</option>
                            {uniqueStatuses.map((status: any) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                          <select
                            value={taskTypeFilter}
                            onChange={(e) => {
                              setTaskTypeFilter(e.target.value);
                              setCurrentTaskPage(1);
                            }}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">Tất cả loại</option>
                            {uniqueTypes.map((type: any) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Tasks table */}
                      <div className="flex-1 overflow-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Công việc</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dự án</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Loại</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hạn chót</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center">
                                  <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-slate-500">Đang tải...</span>
                                  </div>
                                </td>
                              </tr>
                            ) : paginatedTasks.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                  {filteredTasks.length === 0 && selectedMemberTasks.length === 0 
                                    ? "Thành viên này chưa có công việc nào."
                                    : "Không tìm thấy công việc phù hợp với bộ lọc."
                                  }
                                </td>
                              </tr>
                            ) : (
                              paginatedTasks.map((task: any) => (
                                <tr
                                  key={task.id}
                                  onClick={() => handleTaskClick(task)}
                                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <div className="max-w-xs">
                                      <div className="font-medium text-slate-900 truncate text-sm">
                                        {task.title || task.subject}
                                      </div>
                                      {task.description && (
                                        <div className="text-slate-500 text-xs truncate mt-1">
                                          {task.description}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-slate-600 truncate block max-w-[100px]">
                                      {task.project || task.project_name || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {task.type === 'SubTask' || task.referenceType === 'SubTask' ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        SubTask
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Task
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(task.dueDate).display}</td>
                                  <td className="px-4 py-3">
                                    <span className={`status-badge ${getStatusColor(task.status)}`}>{task.status}</span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Task Pagination */}
                      {totalTaskPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm text-slate-500">
                            Hiển thị {((currentTaskPage - 1) * tasksPerPage) + 1} - {Math.min(currentTaskPage * tasksPerPage, filteredTasks.length)} trong số {filteredTasks.length} công việc
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentTaskPageSafe(currentTaskPage - 1)}
                              disabled={currentTaskPage === 1}
                              className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Trước
                            </button>
                            <span className="text-sm text-slate-600">
                              {currentTaskPage} / {totalTaskPages}
                            </span>
                            <button
                              onClick={() => setCurrentTaskPageSafe(currentTaskPage + 1)}
                              disabled={currentTaskPage === totalTaskPages}
                              className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p>Chọn một thành viên để xem công việc của họ.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminTasksView;
