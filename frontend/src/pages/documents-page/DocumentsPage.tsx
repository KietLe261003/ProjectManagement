import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, Users, FolderOpen, Calendar, CheckSquare, ExternalLink, 
  Download, User, Clock, Link, Upload, Eye, Trash2, Filter, ArrowLeft,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import type { Team } from '@/types/Todo/Team';
import type { Project } from '@/types';
import type { Phase } from '@/types';
import type { Task } from '@/types';
import { mockProjectDocuments, stageConfigs } from '@/data/mockProjectDocuments';

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
  const [selectedStage, setSelectedStage] = useState<string>(''); // For project stages
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

  // Fetch all phases
  const { data: phases, isLoading: phasesLoading } = useFrappeGetDocList<Phase>('project_phase', {
    fields: ['name', 'subject', 'project'],
    limit: 0
  });

  // Fetch all tasks
  const { data: tasks, isLoading: tasksLoading } = useFrappeGetDocList<Task>('Task', {
    fields: ['name', 'subject', 'project'],
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
        setCurrentView('phases');
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

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'docx':
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
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
    return phases.filter(phase => phase.project === selectedProject);
  }, [phases, selectedProject]);

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
          <p className="text-gray-600">Quản lý tài liệu theo cấu trúc Team {'->'} Project {'->'} Phase {'->'} Task</p>
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
            {/* Accordion Stages */}
            <div className="space-y-4">
              {/* Stage 1 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage1')) {
                      newExpanded.delete('stage1');
                    } else {
                      newExpanded.add('stage1');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        🔬 Giai đoạn 1: Hình thành ý tưởng và phát triển khái niệm
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 1') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 1')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage1') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage1') && (
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

                    {/* Documents for Stage 1 */}
                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 1');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            {/* Document ID */}
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            {/* Document Name */}
                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-500" />
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
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
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

              {/* Stage 2 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage2')) {
                      newExpanded.delete('stage2');
                    } else {
                      newExpanded.add('stage2');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        ⚙️ Giai đoạn 2: Nghiên cứu tính khả thi kỹ thuật
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 2') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 2')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage2') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage2') && (
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

                    {/* Documents for Stage 2 */}
                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 2');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            {/* Same structure as Stage 1 */}
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-green-500" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                              </div>
                            </div>

                            <div className="col-span-1 text-center">
                              <button 
                                onClick={() => window.open(doc.link, '_blank')}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                title="Xem tài liệu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

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
                                <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Tải lên
                                </button>
                              )}
                            </div>

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

              {/* Stage 3 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage3')) {
                      newExpanded.delete('stage3');
                    } else {
                      newExpanded.add('stage3');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        📊 Giai đoạn 3: Phân tích bản đồ sở hữu trí tuệ
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 3') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 3')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage3') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage3') && (
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

                    {/* Documents for Stage 3 */}
                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 3');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            {/* Same structure as previous stages */}
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-purple-500" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                              </div>
                            </div>

                            <div className="col-span-1 text-center">
                              <button 
                                onClick={() => window.open(doc.link, '_blank')}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                title="Xem tài liệu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

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
                                <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Tải lên
                                </button>
                              )}
                            </div>

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

              {/* Stage 4 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage4')) {
                      newExpanded.delete('stage4');
                    } else {
                      newExpanded.add('stage4');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-orange-50 hover:bg-orange-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        🔧 Giai đoạn 4: Thiết kế và phát triển chi tiết
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 4') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 4')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage4') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage4') && (
                  <div className="border-t border-gray-200">
                    {/* Table Header */}
                    <div className="bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-10 gap-4 px-6 py-3 text-sm font-semibold text-gray-700">
                        <div className="col-span-1 text-center">Mã số</div>
                        <div className="col-span-3">Tên File</div>
                        <div className="col-span-1 text-center">Link</div>
                        <div className="col-span-3">File Upload</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-center">Thao tác</div>
                      </div>
                    </div>

                    {/* Documents for Stage 4 */}
                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 4');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-11 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-orange-500" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                              </div>
                            </div>

                            <div className="col-span-1 text-center">
                              <button 
                                onClick={() => window.open(doc.link, '_blank')}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                title="Xem tài liệu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

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
                                <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Tải lên
                                </button>
                              )}
                            </div>

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

              {/* Stage 5 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage5')) {
                      newExpanded.delete('stage5');
                    } else {
                      newExpanded.add('stage5');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        ✅ Giai đoạn 5: Kiểm thử và xác thực
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 5') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 5')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage5') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage5') && (
                  <div className="border-t border-gray-200">
                    <div className="bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-11 gap-4 px-6 py-3 text-sm font-semibold text-gray-700">
                        <div className="col-span-1 text-center">Mã số</div>
                        <div className="col-span-3">Tên File</div>
                        <div className="col-span-1 text-center">Link</div>
                        <div className="col-span-3">File Upload</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-center">Thao tác</div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 5');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-11 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-red-500" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                              </div>
                            </div>

                            <div className="col-span-1 text-center">
                              <button 
                                onClick={() => window.open(doc.link, '_blank')}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                title="Xem tài liệu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

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
                                <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Tải lên
                                </button>
                              )}
                            </div>

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

              {/* Stage 6 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage6')) {
                      newExpanded.delete('stage6');
                    } else {
                      newExpanded.add('stage6');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        🏆 Giai đoạn 6: Hoàn thiện sở hữu trí tuệ
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 6') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 6')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage6') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage6') && (
                  <div className="border-t border-gray-200">
                    <div className="bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-11 gap-4 px-6 py-3 text-sm font-semibold text-gray-700">
                        <div className="col-span-1 text-center">Mã số</div>
                        <div className="col-span-3">Tên File</div>
                        <div className="col-span-1 text-center">Link</div>
                        <div className="col-span-3">File Upload</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-center">Thao tác</div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 6');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-11 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-indigo-500" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                              </div>
                            </div>

                            <div className="col-span-1 text-center">
                              <button 
                                onClick={() => window.open(doc.link, '_blank')}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                title="Xem tài liệu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

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
                                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Tải lên
                                </button>
                              )}
                            </div>

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

              {/* Stage 7 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage7')) {
                      newExpanded.delete('stage7');
                    } else {
                      newExpanded.add('stage7');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-yellow-50 hover:bg-yellow-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        🏭 Giai đoạn 7: Chuẩn bị sản xuất
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 7') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 7')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage7') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage7') && (
                  <div className="border-t border-gray-200">
                    <div className="bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-11 gap-4 px-6 py-3 text-sm font-semibold text-gray-700">
                        <div className="col-span-1 text-center">Mã số</div>
                        <div className="col-span-3">Tên File</div>
                        <div className="col-span-1 text-center">Link</div>
                        <div className="col-span-3">File Upload</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-center">Thao tác</div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 7');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-11 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-yellow-500" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                              </div>
                            </div>

                            <div className="col-span-1 text-center">
                              <button 
                                onClick={() => window.open(doc.link, '_blank')}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                title="Xem tài liệu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

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
                                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Tải lên
                                </button>
                              )}
                            </div>

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

              {/* Stage 8 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedStages);
                    if (newExpanded.has('stage8')) {
                      newExpanded.delete('stage8');
                    } else {
                      newExpanded.add('stage8');
                    }
                    setExpandedStages(newExpanded);
                  }}
                  className="w-full px-6 py-4 bg-pink-50 hover:bg-pink-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-pink-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        🚀 Giai đoạn 8: Chuyển giao công nghệ
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 8') && d.hasFile).length}/
                        {mockProjectDocuments.filter(d => d.category.includes('GIAI ĐOẠN 8')).length} tài liệu
                      </p>
                    </div>
                  </div>
                  {expandedStages.has('stage8') ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                
                {expandedStages.has('stage8') && (
                  <div className="border-t border-gray-200">
                    <div className="bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-11 gap-4 px-6 py-3 text-sm font-semibold text-gray-700">
                        <div className="col-span-1 text-center">Mã số</div>
                        <div className="col-span-3">Tên File</div>
                        <div className="col-span-1 text-center">Link</div>
                        <div className="col-span-3">File Upload</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-center">Thao tác</div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {mockProjectDocuments
                        .filter(doc => {
                          const matchesSearch = !searchTerm || 
                            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStage = doc.category.includes('GIAI ĐOẠN 8');
                          return matchesSearch && matchesStage;
                        })
                        .map((doc) => (
                          <div key={doc.id} className="grid grid-cols-11 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="col-span-1 text-center">
                              <span className="text-xs font-mono text-pink-600 bg-pink-50 px-2 py-1 rounded">
                                {doc.id}
                              </span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-pink-500" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                              </div>
                            </div>

                            <div className="col-span-1 text-center">
                              <button 
                                onClick={() => window.open(doc.link, '_blank')}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                                title="Xem tài liệu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>

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
                                <button className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                                  <Upload className="h-3 w-3" />
                                  Tải lên
                                </button>
                              )}
                            </div>

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
            </div>
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
