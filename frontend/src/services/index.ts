// Main service exports
export * from './projectService';
export * from './userService';
export * from './docTypeService';

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
