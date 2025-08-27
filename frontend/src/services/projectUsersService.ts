import { useFrappeGetDoc } from 'frappe-react-sdk';

export interface ProjectUsersResponse {
  data: any[];
  isLoading: boolean;
  error?: any;
}

// Smart hook to get project users with fallback strategies
export const useProjectUsers = (projectName: string): ProjectUsersResponse => {
  // Strategy 1: Try to get users from Project document
  const { data: projectDoc, isLoading: projectLoading, error: projectError } = useFrappeGetDoc('Project', projectName, {
    fields: ['name', 'users']
  });
  const { data: fullProjectData, isLoading: loadingProject } = useFrappeGetDoc(
    "Project",
    projectDoc?.name || "",
    projectDoc?.name ? "Project" : undefined
  );
  const projectUsers = fullProjectData?.users || projectDoc?.users || [];



  return {
    data: projectUsers,
    isLoading: projectLoading || loadingProject,
    error: projectError
  };
};
