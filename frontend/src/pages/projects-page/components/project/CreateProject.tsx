import { Combobox } from "@/components/input/Combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useCreateProject } from "@/services";
import { useState } from "react";
import { mutate } from "swr";

interface ProjectFormData {
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
import { toast } from "sonner";
interface CreateProjectProps {
  onProjectCreated?: () => void;
}

const CreateProject = ({ onProjectCreated }: CreateProjectProps) => {
  const [open, setOpen] = useState(false);
  const { createProject, isLoading } = useCreateProject();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    defaultValues: {
      status: "Open",
      priority: "Medium",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await createProject(data);

      // Reset form and close dialog on success
      reset();
      setOpen(false);

      // Force refresh all Project-related SWR cache
      mutate(
        (key) => typeof key === "string" && key.includes("Project"),
        undefined,
        { revalidate: true }
      );
      toast.success("Project created successfully");

      // Call callback to refresh projects list
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (err: any) {
      let errorMessage = "Create project failed";
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

      toast.error("Create project failed", {
        description: errorMessage,
      });

      console.error("Error creating project:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the project details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Project Name - Required */}
            <div className="grid gap-2">
              <Label htmlFor="project_name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="project_name"
                {...register("project_name", {
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

            {/* Project Type and Status */}
            <div className="grid grid-cols-2 gap-4">
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

              <div className="grid gap-2">
                <Label>
                  Status <span className="text-red-500">*</span>
                </Label>
                <select
                  {...register("status", { required: "Status is required" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Open">Open</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Priority and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <select
                  {...register("priority")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select priority...</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label>Department</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      doctype="Department"
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select department..."
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>

            {/* Company and Cost Center */}
            <div className="grid grid-cols-2 gap-4">
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
                      displayField="cost_center_name"
                      valueField="name"
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>

            {/* Project Template */}
            <div className="grid gap-2">
              <Label>Project Template</Label>
              <Controller
                name="project_template"
                control={control}
                render={({ field }) => (
                  <Combobox
                    doctype="Project Template"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select project template..."
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* Expected Start and End Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Expected Start Date</Label>
                <Input type="date" {...register("expected_start_date")} />
              </div>

              <div className="grid gap-2">
                <Label>Expected End Date</Label>
                <Input type="date" {...register("expected_end_date")} />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes</Label>
              <textarea
                {...register("notes")}
                placeholder="Enter project notes..."
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting || isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProject;
