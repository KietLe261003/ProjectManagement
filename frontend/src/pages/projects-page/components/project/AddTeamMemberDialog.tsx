import { useState, useEffect } from 'react'
import { useForm, Controller } from "react-hook-form"
import { useFrappePostCall } from "frappe-react-sdk"

import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/input/Combobox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MemberFormData {
  user: string
  view_attachments?: boolean
  hide_timesheets?: boolean
  project_status?: string
}

interface AddTeamMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
  onSuccess: () => void
}

export function AddTeamMemberDialog({ 
  isOpen, 
  onClose, 
  projectName, 
  onSuccess 
}: AddTeamMemberDialogProps) {
  const [updatingProject, setUpdatingProject] = useState(false)
  
  const { call: addMemberCall } = useFrappePostCall('todo.api.add_project_member')
  const addMemberForm = useForm<MemberFormData>()

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      addMemberForm.reset()
      addMemberForm.clearErrors()
    }
  }, [isOpen, addMemberForm])

  // Helper function to safely close dialog
  const closeDialog = () => {
    if (!updatingProject) {
      onClose()
      addMemberForm.reset()
      addMemberForm.clearErrors()
    }
  }

  const handleAddMember = async (data: MemberFormData) => {
    if (!projectName) return

    // Prevent double submission
    if (updatingProject) return

    setUpdatingProject(true)
    
    try {
      // Use custom API that doesn't send welcome email
      const result = await addMemberCall({
        project_name: projectName,
        user: data.user,
        view_attachments: data.view_attachments ? 1 : 0,
        hide_timesheets: data.hide_timesheets ? 1 : 0,
        project_status: data.project_status || 'Team Member'
      })

      console.log('Member added successfully:', result)
      
      // Close dialog immediately and reset form
      onClose()
      
      // Reset form in next tick to prevent UI flash
      setTimeout(() => {
        addMemberForm.reset()
        addMemberForm.clearErrors()
      }, 0)

      // Call success callback to refresh data
      setTimeout(() => {
        onSuccess()
      }, 1000)

      // Show success message
      alert('Member added successfully!')

    } catch (error) {
      console.error('Error adding member:', error)

      // Handle different types of errors
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check if it's an email-related error from the response
      const errorString = JSON.stringify(error)
      
      if (errorMessage.includes('Email Account') || 
          errorMessage.includes('OutgoingEmailError') || 
          errorMessage.includes('email') ||
          errorMessage.includes('SMTP') ||
          errorString.includes('OutgoingEmailError') ||
          errorString.includes('Email Account')) {
        
        // Email error - member might still be added, just email failed
        console.log('Email error detected, member likely added successfully')
        
        // Close dialog and refresh to check
        onClose()
        setTimeout(() => {
          addMemberForm.reset()
          addMemberForm.clearErrors()
        }, 0)
        
        setTimeout(() => {
          onSuccess()
          alert('Member added successfully! (Welcome email could not be sent due to email configuration, but the member was added to the project)')
        }, 1000)
        
      } else if (errorMessage.includes('DuplicateEntryError') || 
                 errorMessage.includes('already exists')) {
        alert('This user is already a member of the project.')
      } else if (errorMessage.includes('PermissionError') || 
                 errorMessage.includes('Not permitted')) {
        alert('You do not have permission to add members to this project.')
      } else if (errorMessage.includes('ValidationError')) {
        alert('Invalid data provided. Please check your inputs.')
      } else {
        alert('Failed to add member: ' + errorMessage)
      }
    } finally {
      setUpdatingProject(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent 
        className="sm:max-w-md"
      >
        <form 
          onSubmit={addMemberForm.handleSubmit(handleAddMember)}
          onKeyDown={(e) => {
            // Prevent form submission on Enter key to avoid double submission
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to the project team.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>User <span className="text-red-500">*</span></Label>
              <Controller
                name="user"
                control={addMemberForm.control}
                rules={{ required: "Please select a user" }}
                render={({ field }) => (
                  <Combobox
                    key={`add-member-${isOpen ? 'open' : 'closed'}-${Date.now()}`} // Force re-render when dialog opens
                    doctype="User"
                    value={field.value || ""}
                    onChange={(value) => {
                      console.log('Combobox onChange:', value) // Debug log
                      field.onChange(value)
                      // Clear any previous errors when user selects a value
                      if (value && addMemberForm.formState.errors.user) {
                        addMemberForm.clearErrors("user")
                      }
                    }}
                    placeholder={updatingProject ? "Please wait..." : "Select user..."}
                    displayField="full_name"
                    valueField="name"
                    filters={[["enabled", "=", 1], ["user_type", "!=", "Website User"]]}
                    fields={["name", "full_name", "email", "user_image"]}
                    className="w-full"
                    disabled={updatingProject}
                  />
                )}
              />
              {addMemberForm.formState.errors.user && (
                <span className="text-red-500 text-sm">
                  {addMemberForm.formState.errors.user.message}
                </span>
              )}
            </div>


            {/* Optional: Add permission checkboxes */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium">Permissions</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add_view_attachments"
                  {...addMemberForm.register("view_attachments")}
                  defaultChecked={true}
                  disabled={updatingProject}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="add_view_attachments" className="text-sm">
                  Can view attachments
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add_hide_timesheets"
                  {...addMemberForm.register("hide_timesheets")}
                  disabled={updatingProject}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="add_hide_timesheets" className="text-sm">
                  Hide timesheets from this user
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={updatingProject}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatingProject || !addMemberForm.watch('user')}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {updatingProject ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
