import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useUpdateProject } from '@/services';
import type { Project } from '@/types/Projects/Project';
import type { ProjectCreateData } from '@/services/projectService';
import { useForm, Controller } from 'react-hook-form';
import { Combobox } from '@/components/input/Combobox';
import { toast } from '@/utils/toastUtils';
import { useFrappeAuth, useFrappeGetDoc } from 'frappe-react-sdk';

interface EditProjectProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditProject: React.FC<EditProjectProps> = ({ project, isOpen, onClose, onSuccess }) => {
  const { updateProject, isLoading } = useUpdateProject();
  const { currentUser } = useFrappeAuth();

  // Fetch complete project data with users field
  const { data: fullProjectData } = useFrappeGetDoc(
    "Project",
    project?.name || "",
    project?.name ? "Project" : undefined
  );

  // Get project users to check permissions
  const projectUsers = fullProjectData?.users || project?.users || [];

  // Check if current user can change project status to Completed
  const canMarkAsCompleted = () => {
    // Administrator can always mark as completed
    if (currentUser === 'Administrator') {
      return true;
    }

    // Project owner can mark as completed
    if (project?.owner === currentUser) {
      return true;
    }

    // Check if user is Project Manager (Owner Substitute)
    const currentUserInProject = projectUsers.find((user: any) => user.user === currentUser);
    if (currentUserInProject?.project_status === 'Project Manager (Owner Substitute)') {
      return true;
    }

    return false;
  };
  
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectCreateData>({
    defaultValues: {
      project_name: '',
      customer: '',
      project_type: '',
      status: 'Open',
      priority: 'Medium',
      department: '',
      team:'',
      company: '',
      cost_center: '',
      expected_start_date: '',
      expected_end_date: '',
      notes: '',
    },
  });

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      reset({
        project_name: project.project_name || '',
        customer: project.customer || '',
        project_type: project.project_type || '',
        status: project.status || 'Open',
        priority: project.priority || 'Medium',
        department: project.department || '',
        team: project.team || '',
        company: project.company || '',
        cost_center: project.cost_center || '',
        expected_start_date: project.expected_start_date ? project.expected_start_date.split(' ')[0] : '',
        expected_end_date: project.expected_end_date ? project.expected_end_date.split(' ')[0] : '',
        notes: project.notes || '',
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectCreateData) => {
    if (!project) return;

    // Check if user is trying to set status to Completed without permission
    if (data.status === 'Completed' && !canMarkAsCompleted()) {
      toast.error("Permission denied", {
        description: "You don't have permission to mark this project as Completed. Only Project Owner, Project Manager, or Administrator can do this.",
      });
      return;
    }

    try {
      await updateProject(project.name, data);
      
      toast.success("Project updated successfully");
      
      // Call success callback if provided with small delay to ensure DB is updated
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
      
      onClose();
    } catch (err:any) {
      let errorMessage = "Edit project failed";
      if (err?._server_messages) {
        try {
          const serverMsgs = JSON.parse(err._server_messages);
          if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
            const parsed = JSON.parse(serverMsgs[0]);
            errorMessage = parsed.message || errorMessage;
          }
        } catch (parseErr) {
          console.error("Parse error messages failed:", parseErr);
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast.error("Update project failed", {
        description: errorMessage,
      });

      console.error("Error updating project:", err);
    }
  };

  const handleCancel = () => {
    if (project) {
      // Reset form to original values
      reset({
        project_name: project.project_name || '',
        customer: project.customer || '',
        project_type: project.project_type || '',
        status: project.status || 'Open',
        priority: project.priority || 'Medium',
        department: project.department || '',
        team: project.team || '',
        company: project.company || '',
        cost_center: project.cost_center || '',
        expected_start_date: project.expected_start_date ? project.expected_start_date.split(' ')[0] : '',
        expected_end_date: project.expected_end_date ? project.expected_end_date.split(' ')[0] : '',
        notes: project.notes || '',
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              {...register('project_name', {
                  required: "Project name is required",
                  maxLength: {
                    value: 100,
                    message: "Project name cannot exceed 100 characters",
                  },
                })}
              placeholder="Enter project name"
            />
            {errors.project_name && (
                <span className="text-red-500 text-sm">
                  {errors.project_name.message}
                </span>
              )}
          </div>

          {/* Customer */}
          <div className="grid gap-2">
            <Label>Customer</Label>
            <Controller
              name="customer"
              control={control}
              render={({ field }) => (
                <Combobox
                  doctype="Customer"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select customer..."
                  displayField="customer_name"
                  valueField="name"
                  className="w-full"
                />
              )}
            />
          </div>

          {/* Project Type */}
          <div className="grid gap-2">
            <Label>Project Type</Label>
            <Controller
              name="project_type"
              control={control}
              render={({ field }) => (
                <Combobox
                  doctype="Project Type"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select type..."
                  className="w-full"
                />
              )}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                {...register("status")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select status...</option>
                <option value="Open">Open</option>
                {canMarkAsCompleted() && <option value="Completed">Completed</option>}
                <option value="Cancelled">Cancelled</option>
              </select>
              {!canMarkAsCompleted() && (
                <span className="text-xs text-amber-600">
                 You dont have permission to mark Completed
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                {...register("priority")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select priority...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Team and Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Team</Label>
              <Controller
                name="team"
                control={control}
                render={({ field }) => (
                  <Combobox
                    doctype="Team"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select team..."
                    className="w-full"
                  />
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label>Company</Label>
              <Controller
                name="company"
                control={control}
                render={({ field }) => (
                  <Combobox
                    doctype="Company"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select company..."
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>

          {/* Cost Center */}
          <div className="grid gap-2">
            <Label>Cost Center</Label>
            <Controller
              name="cost_center"
              control={control}
              render={({ field }) => (
                <Combobox
                  doctype="Cost Center"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select cost center..."
                  className="w-full"
                />
              )}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_start_date">Expected Start Date</Label>
              <Input
                id="expected_start_date"
                type="date"
                {...register('expected_start_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_end_date">Expected End Date</Label>
              <Input
                id="expected_end_date"
                type="date"
                {...register('expected_end_date')}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Enter project notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProject;
