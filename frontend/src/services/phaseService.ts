import { useFrappeUpdateDoc, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeGetDoc } from 'frappe-react-sdk';

export class PhaseService {
  // Hook for updating phase
  static useUpdatePhase() {
    const { updateDoc, loading, error } = useFrappeUpdateDoc();
    
    const updatePhase = async (phaseName: string, data: any) => {
      return updateDoc('project_phase', phaseName, data);
    };

    return {
      updatePhase,
      isLoading: loading,
      error
    };
  }

  // Hook for managing phase assignment (creating/removing ToDo)
  static usePhaseAssignment() {
    const { createDoc } = useFrappeCreateDoc();
    const { deleteDoc } = useFrappeDeleteDoc();
    const { data: currentUser } = useFrappeGetDoc('User', '', {
      shouldFetch: true
    });

    const assignPhase = async (phaseName: string, allocatedTo: string) => {
      return createDoc('ToDo', {
        allocated_to: allocatedTo,
        assigned_by: currentUser?.name || '',
        reference_type: 'project_phase',
        reference_name: phaseName,
        description: `Assigned to phase: ${phaseName}`,
        status: 'Open'
      });
    };

    const unassignPhase = async (todoName: string) => {
      return deleteDoc('ToDo', todoName);
    };

    return {
      assignPhase,
      unassignPhase
    };
  }
}

// Export hooks for easier importing
export const useUpdatePhase = PhaseService.useUpdatePhase;
export const usePhaseAssignment = PhaseService.usePhaseAssignment;
