// Main service exports
export * from './projectService';
export * from './userService';
export * from './docTypeService';
export * from './phaseTaskService';
export * from './taskService';
export * from './phaseService';
export * from './subTaskService';
export * from './projectUsersService';
export * from './taskProgressService';
export * from './phaseProgressService';
export * from './projectProgressService';
export * from './projectCascadeDeleteService';

// Re-export commonly used hooks
export {
  useUserProjects,
  useProject,
  useProjectOwner,
  useCreateProject,
  useProjectMembers,
  useProjectOwnerManagement
} from './projectService';

export {
  useUsers,
  useCurrentUser
} from './userService';

export {
  useCustomers,
  useCompanies,
  useProjectTypes,
  useDepartments,
  useCostCenters,
  useProjectTemplates,
  useDocTypeOptions
} from './docTypeService';
