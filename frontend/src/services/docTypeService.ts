import { useFrappeGetDocList } from 'frappe-react-sdk';

// Generic DocType Service for dropdown selections
export class DocTypeService {
  // Generic method to fetch options for any doctype
  static useDocTypeOptions(doctype: string, config: {
    fields?: string[];
    filters?: any[];
    displayField?: string;
    valueField?: string;
    limit?: number;
  } = {}) {
    const {
      fields = ['name'],
      filters = [],
      limit = 100
    } = config;

    const { data, isLoading, error } = useFrappeGetDocList(doctype, {
      fields,
      filters,
      limit
    });

    return {
      data: data || [],
      isLoading,
      error
    };
  }

  // Customer options
  static useCustomers() {
    return DocTypeService.useDocTypeOptions('Customer', {
      fields: ['name', 'customer_name', 'customer_type'],
      filters: [['disabled', '=', 0]]
    });
  }

  // Company options
  static useCompanies() {
    return DocTypeService.useDocTypeOptions('Company', {
      fields: ['name', 'company_name', 'abbr'],
      filters: [['is_group', '=', 0]]
    });
  }

  // Project Type options
  static useProjectTypes() {
    return DocTypeService.useDocTypeOptions('Project Type', {
      fields: ['name', 'description']
    });
  }

  // Department options
  static useDepartments() {
    return DocTypeService.useDocTypeOptions('Department', {
      fields: ['name', 'department_name', 'parent_department'],
      filters: [['disabled', '=', 0]]
    });
  }

  // Cost Center options
  static useCostCenters() {
    return DocTypeService.useDocTypeOptions('Cost Center', {
      fields: ['name', 'cost_center_name', 'parent_cost_center'],
      filters: [['disabled', '=', 0], ['is_group', '=', 0]]
    });
  }

  // Project Template options
  static useProjectTemplates() {
    return DocTypeService.useDocTypeOptions('Project Template', {
      fields: ['name', 'project_template_name']
    });
  }
}

// Export individual hooks for easier usage
export const useCustomers = DocTypeService.useCustomers;
export const useCompanies = DocTypeService.useCompanies;
export const useProjectTypes = DocTypeService.useProjectTypes;
export const useDepartments = DocTypeService.useDepartments;
export const useCostCenters = DocTypeService.useCostCenters;
export const useProjectTemplates = DocTypeService.useProjectTemplates;
export const useDocTypeOptions = DocTypeService.useDocTypeOptions;
