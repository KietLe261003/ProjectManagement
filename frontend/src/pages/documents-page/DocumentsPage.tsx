import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, Users, FolderOpen, Calendar, CheckSquare, ExternalLink, 
  Download, User, Clock, Link, Upload, Eye, Trash2,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import type { Team } from '@/types/Todo/Team';
import type { Project } from '@/types';
import type { Phase } from '@/types';
import type { Task } from '@/types';
import { mockProjectDocuments } from '@/data/mockProjectDocuments';

interface FileAttachment {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  is_private: number;
  attached_to_doctype: string;
  attached_to_name: string;
  creation: string;
  owner: string;
  modified: string;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'team' | 'project' | 'phase' | 'task';
}

type ViewType = 'teams' | 'projects' | 'phases' | 'tasks' | 'files' | 'project-detail';

export const DocumentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('teams');
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set()); // For accordion state
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, string>>({});

  // Helper function to get status colors and styles
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          text: 'Đã duyệt'
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Chờ duyệt'
        };
      case 'draft':
        return {
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Nháp'
        };
      case 'empty':
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Trống'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Không xác định'
        };
    }
  };

  // Fetch team data
  const { data: teams, isLoading: teamsLoading } = useFrappeGetDocList<Team>('Team', {
    fields: ['name', 'team','teamlead'],
    limit: 0
  });

  // Fetch all projects
  const { data: projects, isLoading: projectsLoading } = useFrappeGetDocList<Project>('Project', {
    fields: ['name', 'project_name', 'owner', 'team'],
    limit: 0
  });

  // Fetch all phases with progress information
  const { data: phases, isLoading: phasesLoading } = useFrappeGetDocList<Phase>('project_phase', {
    fields: ['name', 'subject', 'project', 'progress', 'status'],
    limit: 0
  });

  // Fetch all tasks
  const { data: tasks, isLoading: tasksLoading } = useFrappeGetDocList<Task>('Task', {
    fields: ['name', 'subject', 'project', 'phase'],
    limit: 0
  });

  // Fetch all file attachments for tasks
  const { data: taskFiles, isLoading: filesLoading } = useFrappeGetDocList<FileAttachment>('File', {
    fields: ['name', 'file_name', 'file_url', 'file_size', 'is_private', 'attached_to_doctype', 'attached_to_name', 'creation', 'owner', 'modified'],
    filters: [['attached_to_doctype', '=', 'Task']],
    orderBy: { field: 'creation', order: 'desc' },
    limit: 0
  });

  // Navigation functions
  const navigateToProjects = (teamId: string, teamName: string) => {
    setSelectedTeam(teamId);
    setCurrentView('projects');
    setBreadcrumb([{ id: teamId, name: teamName, type: 'team' }]);
  };

  const navigateToPhases = (projectName: string, projectDisplayName: string) => {
    setSelectedProject(projectName);
    setCurrentView('project-detail');
    setBreadcrumb(prev => [...prev, { id: projectName, name: projectDisplayName, type: 'project' }]);
  };

  const navigateToTasks = (phaseName: string, phaseDisplayName: string) => {
    setSelectedPhase(phaseName);
    setCurrentView('tasks');
    setBreadcrumb(prev => [...prev, { id: phaseName, name: phaseDisplayName, type: 'phase' }]);
  };

  const navigateToFiles = (taskName: string, taskDisplayName: string) => {
    setSelectedTask(taskName);
    setCurrentView('files');
    setBreadcrumb(prev => [...prev, { id: taskName, name: taskDisplayName, type: 'task' }]);
  };

  const navigateBack = (targetIndex: number) => {
    const targetItem = breadcrumb[targetIndex];
    if (!targetItem) {
      // Navigate to teams
      setCurrentView('teams');
      setBreadcrumb([]);
      setSelectedTeam('');
      setSelectedProject('');
      setSelectedPhase('');
      setSelectedTask('');
      return;
    }

    switch (targetItem.type) {
      case 'team':
        setCurrentView('projects');
        setBreadcrumb(breadcrumb.slice(0, targetIndex + 1));
        setSelectedTeam(targetItem.id);
        setSelectedProject('');
        setSelectedPhase('');
        setSelectedTask('');
        break;
      case 'project':
        setCurrentView('project-detail');
        setBreadcrumb(breadcrumb.slice(0, targetIndex + 1));
        setSelectedPhase('');
        setSelectedTask('');
        break;
      case 'phase':
        setCurrentView('tasks');
        setBreadcrumb(breadcrumb.slice(0, targetIndex + 1));
        setSelectedTask('');
        break;
    }
  };

  // Helper functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileAttachment) => {
    const isLink = file.file_url.startsWith('http') && (file.file_size === 0 || !file.file_name.includes('.'));
    if (isLink) {
      return <Link className="h-5 w-5 text-blue-500" />;
    }

    const extension = file.file_name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const isLinkAttachment = (file: FileAttachment) => {
    return file.file_url.startsWith('http') && (file.file_size === 0 || !file.file_name.includes('.'));
  };

  // Function to update document status
  const updateDocumentStatus = (docId: string, newStatus: string) => {
    // Update local state immediately for UI responsiveness
    setDocumentStatuses(prev => ({
      ...prev,
      [docId]: newStatus
    }));
    // In real app, this would make an API call
    console.log(`Updating document ${docId} status to ${newStatus}`);
  };

  // Function to delete document
  const deleteDocument = (docId: string) => {
    // In real app, this would make an API call
    console.log(`Deleting document ${docId}`);
  };

  // Data filtering based on current selection
  const currentProjects = useMemo(() => {
    if (!projects || !selectedTeam) return [];
    // Filter projects that belong to the selected team
    return projects.filter(project => project.team === selectedTeam);
  }, [projects, selectedTeam]);

  const currentPhases = useMemo(() => {
    if (!phases || !selectedProject) return [];
    const projectPhases = phases.filter(phase => phase.project === selectedProject);
    
    // Hiển thị tất cả phases của dự án, giới hạn tối đa 8 phases
    return projectPhases.slice(0, 8);
  }, [phases, selectedProject]);

  // Generate documents for each phase dynamically
  const getPhaseDocuments = (phase: Phase) => {
    const phaseProgress = phase.progress || 0;
    
    // Get documents for this stage number (sử dụng thứ tự cố định từ mockProjectDocuments)
    const phaseIndex = currentPhases.findIndex(p => p.name === phase.name) + 1;
    const stageFilter = `GIAI ĐOẠN ${phaseIndex}`;
    
    // Sử dụng tài liệu cố định từ mockProjectDocuments theo thứ tự giai đoạn
    return mockProjectDocuments
      .filter(doc => doc.category.includes(stageFilter))
      .map((doc) => ({
        ...doc,
        // Giữ nguyên status và hasFile từ mock data thay vì generate động
        status: phaseProgress === 100 ? 'approved' : doc.status,
        hasFile: phaseProgress === 100 ? true : doc.hasFile
      }));
  };

  const currentTasks = useMemo(() => {
    if (!tasks || !selectedProject) return [];
    
    if (selectedPhase) {
      // Get tasks from the selected phase
      return tasks.filter(task => task.project === selectedProject && task.phase === selectedPhase);
    } else {
      // Show TaskAlone (tasks without phase)
      return tasks.filter(task => task.project === selectedProject && !task.phase);
    }
  }, [tasks, selectedProject, selectedPhase]);

  const currentFiles = useMemo(() => {
    if (!taskFiles || !selectedTask) return [];
    return taskFiles.filter(file => file.attached_to_name === selectedTask);
  }, [taskFiles, selectedTask]);

  // Generate mock file count for each team (sum of projects)
  const teamFileStats = useMemo(() => {
    if (!teams || !projects) return {};
    
    const stats: { [teamName: string]: number } = {};
    
    teams.forEach((team) => {
      // Count total files by summing files from all projects in this team
      const teamProjects = projects.filter(project => project.team === team.name);
      const totalFiles = teamProjects.length * 45; // Each project has 45 files
      stats[team.name] = totalFiles;
    });
    
    return stats;
  }, [teams, projects]);

  // Generate mock file count for each project (fixed at 45)
  const projectFileStats = useMemo(() => {
    if (!projects) return {};
    
    const stats: { [projectName: string]: number } = {};
    
    projects.forEach((project) => {
      // Set fixed number of 45 files for all projects
      stats[project.name] = 45;
    });
    
    return stats;
  }, [projects]);

  if (teamsLoading || projectsLoading || phasesLoading || tasksLoading || filesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tài liệu</h1>
          <p className="text-gray-600">Quản lý tài liệu theo cấu trúc Team {'->'} Project {'->'} Phase</p>
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigateBack(-1)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Teams
            </button>
            {breadcrumb.map((item, index) => (
              <React.Fragment key={item.id}>
                <span className="text-gray-500">/</span>
                <button
                  onClick={() => navigateBack(index)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {item.type === 'team' && <Users className="h-4 w-4" />}
                  {item.type === 'project' && <FolderOpen className="h-4 w-4" />}
                  {item.type === 'phase' && <Calendar className="h-4 w-4" />}
                  {item.type === 'task' && <CheckSquare className="h-4 w-4" />}
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={
              currentView === 'teams' ? 'Tìm kiếm team...' :
              currentView === 'projects' ? 'Tìm kiếm dự án...' :
              currentView === 'project-detail' ? 'Tìm kiếm tài liệu...' :
              currentView === 'phases' ? 'Tìm kiếm phase...' :
              currentView === 'tasks' ? 'Tìm kiếm task...' :
              'Tìm kiếm file...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {currentView === 'teams' && (
          <div>
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <div className="col-span-5 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nhóm Trưởng
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Số Tài liệu
                </div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {teams && teams.length > 0 ? (
                teams
                  .filter((team: Team) => 
                    !searchTerm || team.team?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((team: Team) => (
                    <div
                      key={team.name}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigateToProjects(team.name, team.team || 'Unnamed Team')}
                    >
                      {/* Team Name */}
                      <div className="col-span-5 flex items-center gap-3">
                        <Users className="h-6 w-6 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {team.team || 'Unnamed Team'}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Team Leader */}
                      <div className="col-span-4 flex items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {team.teamlead || 'Chưa có nhóm trưởng'}
                          </p>
                        </div>
                      </div>
                      
                      {/* File Count */}
                      <div className="col-span-3 flex items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-blue-600">
                            {(teamFileStats[team.name] || 45).toLocaleString('vi-VN')}
                          </span>
                          <span className="text-sm text-gray-600">tài liệu</span>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">Không có team nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'projects' && (
          <div>
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <div className="col-span-6 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Tên Dự Án
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Số File
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Thao Tác
                </div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {currentProjects && currentProjects.length > 0 ? (
                currentProjects
                  .filter(project => 
                    !searchTerm || project.project_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((project) => (
                    <div
                      key={project.name}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigateToPhases(project.name, project.project_name)}
                    >
                      {/* Project Name */}
                      <div className="col-span-6 flex items-center gap-3">
                        <FolderOpen className="h-6 w-6 text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {project.project_name}
                          </h3>
                        </div>
                      </div>
                      
                      {/* File Count */}
                      <div className="col-span-3 flex items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-green-600">
                            {(projectFileStats[project.name] || 45).toLocaleString('vi-VN')}
                          </span>
                          <span className="text-sm text-gray-600">tài liệu</span>
                        </div>
                      </div>
                      
                      {/* Action */}
                      <div className="col-span-3 flex items-center">
                        <span className="text-sm text-gray-600">
                          Click để xem phases và tasks
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">Không có dự án nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'project-detail' && (
          <div className="space-y-6">
            {/* Check if project has phases */}
            {currentPhases && currentPhases.length > 0 ? (
              <div className="space-y-4">
                {currentPhases.map((phase, index) => {
                  const phaseKey = `phase-${phase.name}`;
                  const phaseProgress = phase.progress || 0;
                  const phaseDocuments = getPhaseDocuments(phase);
                  const stageNumber = index + 1;
                  
                  // Color schemes for different phases
                  const colorSchemes = [
                    { bg: 'bg-blue-50', hoverBg: 'hover:bg-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', textColor: 'text-blue-600', uploadBg: 'bg-blue-600', uploadHover: 'hover:bg-blue-700' },
                    { bg: 'bg-green-50', hoverBg: 'hover:bg-green-100', iconBg: 'bg-green-100', iconColor: 'text-green-600', textColor: 'text-green-600', uploadBg: 'bg-green-600', uploadHover: 'hover:bg-green-700' },
                    { bg: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', textColor: 'text-purple-600', uploadBg: 'bg-purple-600', uploadHover: 'hover:bg-purple-700' },
                    { bg: 'bg-orange-50', hoverBg: 'hover:bg-orange-100', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', textColor: 'text-orange-600', uploadBg: 'bg-orange-600', uploadHover: 'hover:bg-orange-700' },
                    { bg: 'bg-red-50', hoverBg: 'hover:bg-red-100', iconBg: 'bg-red-100', iconColor: 'text-red-600', textColor: 'text-red-600', uploadBg: 'bg-red-600', uploadHover: 'hover:bg-red-700' },
                    { bg: 'bg-indigo-50', hoverBg: 'hover:bg-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', textColor: 'text-indigo-600', uploadBg: 'bg-indigo-600', uploadHover: 'hover:bg-indigo-700' },
                    { bg: 'bg-yellow-50', hoverBg: 'hover:bg-yellow-100', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', textColor: 'text-yellow-600', uploadBg: 'bg-yellow-600', uploadHover: 'hover:bg-yellow-700' },
                    { bg: 'bg-pink-50', hoverBg: 'hover:bg-pink-100', iconBg: 'bg-pink-100', iconColor: 'text-pink-600', textColor: 'text-pink-600', uploadBg: 'bg-pink-600', uploadHover: 'hover:bg-pink-700' }
                  ];
                  
                  const colorScheme = colorSchemes[index % colorSchemes.length];
                
                // Phase status emoji based on progress
                const getPhaseEmoji = (progress: number) => {
                  if (progress === 100) return '✅';
                  if (progress >= 75) return '🔄';
                  if (progress >= 50) return '⏳';
                  if (progress >= 25) return '🔧';
                  if (progress > 0) return '🚀';
                  return '📋';
                };

                return (
                  <div key={phaseKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedStages);
                        if (newExpanded.has(phaseKey)) {
                          newExpanded.delete(phaseKey);
                        } else {
                          newExpanded.add(phaseKey);
                        }
                        setExpandedStages(newExpanded);
                      }}
                      className={`w-full px-6 py-4 ${colorScheme.bg} ${colorScheme.hoverBg} transition-colors flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${colorScheme.iconBg} p-2 rounded`}>
                          <FileText className={`h-6 w-6 ${colorScheme.iconColor}`} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getPhaseEmoji(phaseProgress)} {phase.subject || 'Unnamed Phase'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              {phaseDocuments.filter(d => d.hasFile).length}/
                              {phaseDocuments.length} tài liệu
                            </span>
                            <span className={`font-medium ${
                              phaseProgress === 100 ? 'text-green-600' : 
                              phaseProgress >= 1 ? 'text-yellow-600' : 
                              'text-gray-500'
                            }`}>
                              Progress: {phaseProgress}%
                            </span>
                            {/* Status indicator theo yêu cầu mới */}
                            {phaseProgress === 100 && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Tài liệu đã duyệt
                              </span>
                            )}
                            {phaseProgress !== 100 && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Tài liệu trống/nháp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {expandedStages.has(phaseKey) ? 
                        <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      }
                    </button>
                    
                    {expandedStages.has(phaseKey) && (
                      <div className="border-t border-gray-200">
                        {/* Table Header */}
                        <div className="bg-gray-50 border-b border-gray-200">
                          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-semibold text-gray-700">
                            <div className="col-span-1 text-center">Mã số</div>
                            <div className="col-span-3">Tên File</div>
                            <div className="col-span-1 text-center">Link</div>
                            <div className="col-span-3">File Upload</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1 text-center">Thao tác</div>
                          </div>
                        </div>

                        {/* Documents for this Phase */}
                        <div className="divide-y divide-gray-200">
                          {phaseDocuments
                            .filter(doc => {
                              const matchesSearch = !searchTerm || 
                                doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                              return matchesSearch;
                            })
                            .map((doc) => (
                              <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                {/* Document ID */}
                                <div className="col-span-1 text-center">
                                  <span className={`text-xs font-mono ${colorScheme.textColor} bg-opacity-50 ${colorScheme.bg} px-2 py-1 rounded`}>
                                    {doc.id}
                                  </span>
                                </div>

                                {/* Document Name */}
                                <div className="col-span-3 flex items-center gap-3">
                                  <FileText className={`h-5 w-5 ${colorScheme.iconColor.replace('text-', 'text-').replace('-600', '-500')}`} />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                                  </div>
                                </div>

                                {/* Link */}
                                <div className="col-span-1 text-center">
                                  <button 
                                    onClick={() => window.open(doc.link, '_blank')}
                                    className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                    title="Xem tài liệu"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* File Upload */}
                                <div className="col-span-3">
                                  {doc.hasFile ? (
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className="text-sm text-gray-900 truncate flex-1" 
                                        title={doc.fileName}
                                        style={{ maxWidth: '150px' }}
                                      >
                                        {doc.fileName}
                                      </span>
                                      <div className="flex gap-1">
                                        <button className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors" title="Xem">
                                          <Eye className="h-4 w-4" />
                                        </button>
                                        <button className="text-green-600 hover:text-green-700 p-1 rounded transition-colors" title="Tải xuống">
                                          <Download className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button className={`${colorScheme.uploadBg} ${colorScheme.uploadHover} text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1`}>
                                      <Upload className="h-3 w-3" />
                                      Tải lên
                                    </button>
                                  )}
                                </div>

                                {/* Status - Editable */}
                                <div className="col-span-2">
                                  <select 
                                    value={documentStatuses[doc.id] || doc.status}
                                    onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                                    className={`text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium ${getStatusStyles(documentStatuses[doc.id] || doc.status).className}`}
                                  >
                                    <option value="approved">Đã duyệt</option>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="draft">Nháp</option>
                                    <option value="empty">Trống</option>
                                  </select>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 text-center">
                                  <button 
                                    onClick={() => deleteDocument(doc.id)}
                                    className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                                    title="Xóa tài liệu"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            ) : (
              // Thông báo khi dự án không có giai đoạn
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">Dự án không có giai đoạn</p>
                <p className="text-gray-500 text-sm mt-2">Dự án này chưa được thiết lập các giai đoạn</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'phases' && (
          <div className="divide-y divide-gray-200">
            {/* Phases Section */}
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Phases
              </h3>
            </div>
            {currentPhases && currentPhases.length > 0 ? (
              currentPhases
                .filter(phase => 
                  !searchTerm || phase.subject?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((phase) => (
                  <div
                    key={phase.name}
                    className="flex items-center gap-4 p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigateToTasks(phase.name, phase.subject || 'Unnamed Phase')}
                  >
                    <Calendar className="h-8 w-8 text-orange-500" />
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{phase.subject || 'Unnamed Phase'}</h4>
                      <p className="text-gray-600">Click để xem tasks trong phase này</p>
                    </div>
                    <div className="text-gray-400">
                      <CheckSquare className="h-5 w-5" />
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-6">
                <p className="text-gray-600">Không có phase nào trong dự án này</p>
              </div>
            )}
            
            {/* TaskAlone Section */}
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-purple-500" />
                Tasks (Không thuộc Phase)
              </h3>
            </div>
            {currentTasks && currentTasks.length > 0 ? (
              currentTasks
                .filter(task => {
                  if (searchTerm && !task.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true; // Show all tasks, not just those with files
                })
                .map((task) => {
                  const fileCount = taskFiles?.filter(file => file.attached_to_name === task.name).length || 0;
                  return (
                    <div
                      key={task.name}
                      className="flex items-center gap-4 p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigateToFiles(task.name, task.subject)}
                    >
                      <CheckSquare className="h-8 w-8 text-purple-500" />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{task.subject}</h4>
                        <p className="text-gray-600">
                          {fileCount} file(s)
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="p-6">
                <p className="text-gray-600">Không có task nào trong dự án này</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'tasks' && selectedPhase && (
          <div className="divide-y divide-gray-200">
            {currentTasks && currentTasks.length > 0 ? (
              currentTasks
                .filter(task => {
                  if (searchTerm && !task.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true; // Show all tasks, not just those with files
                })
                .map((task) => {
                  const fileCount = taskFiles?.filter(file => file.attached_to_name === task.name).length || 0;
                  return (
                    <div
                      key={task.name}
                      className="flex items-center gap-4 p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigateToFiles(task.name, task.subject)}
                    >
                      <CheckSquare className="h-8 w-8 text-purple-500" />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{task.subject}</h4>
                        <p className="text-gray-600">
                          {fileCount} file(s)
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">Không có task nào trong phase này</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'files' && (
          <div className="divide-y divide-gray-200">
            {currentFiles && currentFiles.length > 0 ? (
              currentFiles
                .filter(file => 
                  !searchTerm || 
                  file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  file.owner.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((file) => (
                  <div key={file.name} className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">{file.file_name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Người thêm: {file.owner}</span>
                        </div>
                        {!isLinkAttachment(file) && (
                          <span>Kích thước: {formatFileSize(file.file_size)}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(file.creation).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {isLinkAttachment(file) && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Link
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.file_url, '_blank');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        {isLinkAttachment(file) ? (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Mở Link
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Tải xuống
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">Không có file nào</p>
                <p className="text-gray-500 text-sm mt-2">Task này chưa có file đính kèm</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {currentView === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Team</p>
                <p className="text-2xl font-bold text-gray-900">{teams?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Dự án</p>
                <p className="text-2xl font-bold text-gray-900">{projects?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Task</p>
                <p className="text-2xl font-bold text-gray-900">{tasks?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Tài liệu</p>
                <p className="text-2xl font-bold text-blue-600">
                  {teams ? Object.values(teamFileStats).reduce((sum, count) => sum + count, 0).toLocaleString('vi-VN') : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
