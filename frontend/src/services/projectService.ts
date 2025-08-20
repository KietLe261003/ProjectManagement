import React from 'react';
import { useFrappeGetDocList, useFrappeGetDoc, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappePostCall, useFrappeAuth } from 'frappe-react-sdk';
import type { Project } from '@/types/Projects/Project';
import type { ProjectUser } from '@/types/Projects/ProjectUser';

// Types for service responses
export interface ProjectServiceResponse<T> {
  data?: T;
  isLoading: boolean;
  error?: any;
  mutate?: () => void;
}

export interface ProjectFilters {
  owner?: string;
  status?: string;
  customer?: string;
  priority?: string;
}

export interface ProjectCreateData {
  project_name: string;
  customer?: string;
  project_type?: string;
  status: string;
  priority?: string;
  department?: string;
  company?: string;
  cost_center?: string;
  project_template?: string;
  expected_start_date?: string;
  expected_end_date?: string;
  notes?: string;
}

export interface MemberCreateData {
  user: string;
  view_attachments?: boolean;
  hide_timesheets?: boolean;
  project_status?: string;
  parent: string;
  parenttype: string;
  parentfield: string;
}

// Project Service Class
export class ProjectService {
  // Standard project fields
  static readonly PROJECT_FIELDS = [
    'name',
    'owner',
    'project_name',
    'project_type',
    'status',
    'customer',
    'expected_start_date',
    'expected_end_date',
    'percent_complete',
    'priority',
    'estimated_costing',
    'total_billable_amount',
    'company',
    'users.user',
    'users.email',
    'users.full_name',
    'users.project_status'
  ];

  // Detailed project fields (for single project fetch)
  static readonly DETAILED_PROJECT_FIELDS = [
    ...ProjectService.PROJECT_FIELDS,
    'creation',
    'modified',
    'modified_by',
    'description',
    'notes',
    'expected_start_date',
    'actual_start_date',
    'actual_end_date',
    'total_costing_amount',
    'total_purchase_cost',
    'total_sales_amount',
    'total_billed_amount',
    'users'
  ];

  // Get projects for current user (owner or member)
  static useUserProjects(): ProjectServiceResponse<Project[]> {
    const { currentUser } = useFrappeAuth();

    // Fetch owned projects
    const { data: ownedProjects, isLoading: loadingOwned, error: errorOwned, mutate: mutateOwned } = useFrappeGetDocList('Project', {
      fields: ProjectService.PROJECT_FIELDS,
      filters: currentUser ? [['owner', '=', currentUser]] : [],
    });

    // Fetch all accessible projects as fallback
    const { data: allProjects, isLoading: loadingAll, error: errorAll, mutate: mutateAll } = useFrappeGetDocList('Project', {
      fields: ProjectService.PROJECT_FIELDS,
      limit: 0
    });

    // Filter and combine projects
    const projects: Project[] = React.useMemo(() => {
      if (!currentUser) return [];

      const deduplicateProjects = (projectList: any[]): any[] => {
        const projectMap = new Map<string, any>();

        projectList.forEach(row => {
          const projectName = row.name;

          if (!projectMap.has(projectName)) {
            const project = {
              name: row.name,
              owner: row.owner,
              project_name: row.project_name,
              project_type: row.project_type,
              status: row.status,
              customer: row.customer,
              expected_start_date: row.expected_start_date,
              expected_end_date: row.expected_end_date,
              percent_complete: row.percent_complete,
              priority: row.priority,
              estimated_costing: row.estimated_costing,
              total_billable_amount: row.total_billable_amount,
              company: row.company,
              users: [] as any[]
            };
            projectMap.set(projectName, project);
          }

          // Add user to project if exists
          if (row.user) {
            const existingProject = projectMap.get(projectName)!;
            const userExists = existingProject.users?.some((u: any) => u.user === row.user);

            if (!userExists) {
              existingProject.users = existingProject.users || [];
              existingProject.users.push({
                user: row.user,
                email: row.email,
                full_name: row.full_name,
                project_status: row.project_status
              });
            }
          }
        });

        return Array.from(projectMap.values());
      };

      let combinedProjects: any[] = [];

      // Gom ownedProjects
      if (ownedProjects && ownedProjects.length > 0) {
        combinedProjects = combinedProjects.concat(ownedProjects);
      }

      // Gom allProjects (chỉ lấy những cái user có liên quan)
      if (allProjects && allProjects.length > 0) {
        const related = allProjects.filter(project =>
          project.owner === currentUser ||
          (project.user && project.user === currentUser)
        );
        combinedProjects = combinedProjects.concat(related);
      }

      // Loại bỏ trùng lặp
      return deduplicateProjects(combinedProjects);

    }, [ownedProjects, allProjects, currentUser]);

    // Combined mutate function to refresh both queries
    const mutate = React.useCallback(() => {
      mutateOwned();
      mutateAll();
    }, [mutateOwned, mutateAll]);

    return {
      data: projects,
      isLoading: loadingOwned || loadingAll,
      error: errorOwned && errorAll ? (errorOwned || errorAll) : null,
      mutate
    };
  }

  // Get single project with full details
  static useProject(projectName?: string): ProjectServiceResponse<Project> {
    const { data, isLoading, error, mutate } = useFrappeGetDoc(
      "Project",
      projectName || "",
      projectName ? "Project" : undefined
    );

    return {
      data: data as Project,
      isLoading,
      error,
      mutate
    };
  }

  // Get project owner details
  static useProjectOwner(ownerEmail?: string): ProjectServiceResponse<any> {
    const { data, isLoading, error } = useFrappeGetDoc(
      "User",
      ownerEmail || "",
      ownerEmail ? undefined : null
    );

    return {
      data,
      isLoading,
      error
    };
  }

  // Create new project
  static useCreateProject() {
    const { createDoc, loading, error } = useFrappeCreateDoc();

    const createProject = async (projectData: ProjectCreateData) => {
      return await createDoc("Project", {
        ...projectData,
        expected_start_date: projectData.expected_start_date || undefined,
        expected_end_date: projectData.expected_end_date || undefined,
      });
    };

    return {
      createProject,
      isLoading: loading,
      error
    };
  }

  // Update project using useFrappeUpdateDoc
  static useUpdateProject() {
    const { updateDoc, loading, error } = useFrappeUpdateDoc();

    const updateProject = async (projectName: string, projectData: Partial<ProjectCreateData>) => {
      return await updateDoc("Project", projectName, {
        ...projectData,
        expected_start_date: projectData.expected_start_date || undefined,
        expected_end_date: projectData.expected_end_date || undefined,
      });
    };

    return {
      updateProject,
      isLoading: loading,
      error
    };
  }

  // Delete project
  static useDeleteProject() {
    const { call: deleteCall, loading, error } = useFrappePostCall('frappe.client.delete');

    const deleteProject = async (projectName: string) => {
      return await deleteCall({
        doctype: 'Project',
        name: projectName
      });
    };

    return {
      deleteProject,
      isLoading: loading,
      error
    };
  }

  // Project member management
  static useProjectMembers() {
    const { call: insertCall } = useFrappePostCall('frappe.client.insert');
    const { call: saveCall } = useFrappePostCall('frappe.client.save');
    const { call: deleteCall } = useFrappePostCall('frappe.client.delete');

    const addMember = async (memberData: MemberCreateData) => {
      return await insertCall({
        doc: {
          doctype: 'Project User',
          ...memberData,
          welcome_email_sent: 1,
        }
      });
    };

    const updateMember = async (memberName: string, updateData: Partial<ProjectUser>) => {
      return await saveCall({
        doc: {
          doctype: 'Project User',
          name: memberName,
          ...updateData
        }
      });
    };

    const removeMember = async (memberName: string) => {
      return await deleteCall({
        doctype: 'Project User',
        name: memberName
      });
    };

    return {
      addMember,
      updateMember,
      removeMember
    };
  }

  // Project owner management
  static useProjectOwnerManagement() {
    const { call: saveCall } = useFrappePostCall('frappe.client.save');
    const { call: setValueCall } = useFrappePostCall('frappe.client.set_value');

    const transferOwner = async (projectName: string, newOwner: string) => {
      // Try multiple methods to transfer ownership
      try {
        // Method 1: Direct save
        await saveCall({
          doc: {
            doctype: 'Project',
            name: projectName,
            owner: newOwner
          }
        });
        return { success: true, method: 'save' };
      } catch (saveError) {
        try {
          // Method 2: Set value
          await setValueCall({
            doctype: 'Project',
            name: projectName,
            fieldname: 'owner',
            value: newOwner
          });
          return { success: true, method: 'set_value' };
        } catch (setValueError) {
          throw new Error('Owner field is protected by ERPNext');
        }
      }
    };

    const transferOwnerWithAPI = async (projectName: string, newOwner: string) => {
      try {
        const response = await fetch(`/api/method/my_app.api.project_transfer.transfer_project_owner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': (window as any).csrf_token || ''
          },
          credentials: 'include',
          body: JSON.stringify({
            project_name: projectName,
            new_owner: newOwner
          })
        });

        const result = await response.json();

        if (response.ok && result.message) {
          return { success: true, data: result.message };
        } else {
          return { success: false, error: result.message || 'Transfer failed' };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    };

    return {
      transferOwner,
      transferOwnerWithAPI
    };
  }

  // Get users in a specific project
  static useProjectUsers(projectName: string): ProjectServiceResponse<ProjectUser[]> {
    // Try to get project document with users child table
    const { data: projectDoc, isLoading, error, mutate } = useFrappeGetDoc('Project', projectName, {
      fields: ['name', 'users']
    });

    return {
      data: projectDoc?.users as ProjectUser[] || [],
      isLoading,
      error,
      mutate
    };
  }

  // Alternative method - get users from Project User doctype with try-catch
  static useProjectUsersAlt(projectName: string): ProjectServiceResponse<ProjectUser[]> {
    const { data, isLoading, error, mutate } = useFrappeGetDocList('Project User', {
      fields: ['name', 'user', 'email', 'full_name', 'image'],
      filters: [['parent', '=', projectName]],
      limit: 0
    });

    return {
      data: data as ProjectUser[] || [],
      isLoading,
      error,
      mutate
    };
  }
}

// React hooks for easier usage
export const useUserProjects = ProjectService.useUserProjects;
export const useProject = ProjectService.useProject;
export const useProjectOwner = ProjectService.useProjectOwner;
export const useCreateProject = ProjectService.useCreateProject;
export const useUpdateProject = ProjectService.useUpdateProject;
export const useDeleteProject = ProjectService.useDeleteProject;
export const useProjectMembers = ProjectService.useProjectMembers;
export const useProjectOwnerManagement = ProjectService.useProjectOwnerManagement;
// Note: useProjectUsers is now available from projectUsersService.ts
