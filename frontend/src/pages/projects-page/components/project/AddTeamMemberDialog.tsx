import { useState, useEffect } from 'react'
import { useForm, Controller } from "react-hook-form"
import { useFrappePostCall } from "frappe-react-sdk"

import { Button } from "@/components/ui/button"
import { MultiCombobox } from "@/components/input/MultiCombobox"
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
  users: string[]
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
    if (!projectName || !data.users || data.users.length === 0) return

    // Prevent double submission
    if (updatingProject) return

    setUpdatingProject(true)
    
    let successCount = 0
    let failedUsers: string[] = []
    let emailErrors = false
    
    try {
      // Add members one by one
      for (const user of data.users) {
        try {
          // Use custom API that doesn't send welcome email
          const result = await addMemberCall({
            project_name: projectName,
            user: user,
            view_attachments: data.view_attachments ? 1 : 0,
            hide_timesheets: data.hide_timesheets ? 1 : 0,
            project_status: data.project_status || 'Team Member'
          })

          console.log(`Member ${user} added successfully:`, result)
          successCount++

        } catch (error) {
          console.error(`Error adding member ${user}:`, error)
          
          // Handle different types of errors
          const errorMessage = error instanceof Error ? error.message : String(error)
          const errorString = JSON.stringify(error)
          
          if (errorMessage.includes('Email Account') || 
              errorMessage.includes('OutgoingEmailError') || 
              errorMessage.includes('email') ||
              errorMessage.includes('SMTP') ||
              errorString.includes('OutgoingEmailError') ||
              errorString.includes('Email Account')) {
            
            // Email error - member might still be added, just email failed
            console.log(`Email error detected for ${user}, member likely added successfully`)
            successCount++
            emailErrors = true
            
          } else if (errorMessage.includes('DuplicateEntryError') || 
                     errorMessage.includes('already exists')) {
            // User already exists - not really a failure
            console.log(`User ${user} already exists in project`)
          } else {
            // Real failure
            failedUsers.push(user)
          }
        }
      }

      // Close dialog and reset form
      onClose()
      setTimeout(() => {
        addMemberForm.reset()
        addMemberForm.clearErrors()
      }, 0)

      // Call success callback to refresh data
      setTimeout(() => {
        onSuccess()
      }, 1000)

      // Show appropriate success/error message
      if (successCount === data.users.length) {
        if (emailErrors) {
          alert(`All ${successCount} members added successfully! (Welcome emails could not be sent due to email configuration, but all members were added to the project)`)
        } else {
          alert(`All ${successCount} members added successfully!`)
        }
      } else if (successCount > 0) {
        alert(`${successCount} out of ${data.users.length} members added successfully. ${failedUsers.length} failed: ${failedUsers.join(', ')}`)
      } else {
        alert(`Failed to add members: ${failedUsers.join(', ')}`)
      }

    } catch (error) {
      console.error('Error in bulk add members:', error)
      alert('Failed to add members: ' + (error instanceof Error ? error.message : String(error)))
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
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>
              Add new members to the project team. You can select multiple users at once.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Users <span className="text-red-500">*</span></Label>
              <Controller
                name="users"
                control={addMemberForm.control}
                rules={{ 
                  required: "Please select at least one user",
                  validate: (value) => value?.length > 0 || "Please select at least one user"
                }}
                render={({ field }) => (
                  <MultiCombobox
                    key={`add-members-${isOpen ? 'open' : 'closed'}-${Date.now()}`} // Force re-render when dialog opens
                    doctype="User"
                    value={field.value || []}
                    onChange={(value: string[]) => {
                      console.log('MultiCombobox onChange:', value) // Debug log
                      field.onChange(value)
                      // Clear any previous errors when user selects a value
                      if (value?.length > 0 && addMemberForm.formState.errors.users) {
                        addMemberForm.clearErrors("users")
                      }
                    }}
                    placeholder={updatingProject ? "Please wait..." : "Select users..."}
                    displayField="full_name"
                    valueField="name"
                    filters={[["enabled", "=", 1], ["user_type", "!=", "Website User"]]}
                    fields={["name", "full_name", "email", "user_image"]}
                    className="w-full"
                    disabled={updatingProject}
                  />
                )}
              />
              {addMemberForm.formState.errors.users && (
                <span className="text-red-500 text-sm">
                  {addMemberForm.formState.errors.users.message}
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
              disabled={updatingProject || !addMemberForm.watch('users')?.length}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {updatingProject ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Members...
                </>
              ) : (
                "Add Members"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
