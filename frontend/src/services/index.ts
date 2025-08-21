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
<<<<<<< HEAD
=======
export * from './todoService';
>>>>>>> ca353f013da63c18b5dc0c89d8ff3c60071062d4

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
<<<<<<< HEAD
=======
  useUserTodos,
  useUserTodosEnriched
} from './todoService';

export {
>>>>>>> ca353f013da63c18b5dc0c89d8ff3c60071062d4
  useCustomers,
  useCompanies,
  useProjectTypes,
  useDepartments,
  useCostCenters,
  useProjectTemplates,
  useDocTypeOptions
} from './docTypeService';
