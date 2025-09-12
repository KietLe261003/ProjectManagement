import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Crown, 
  Trash2, 
  Search,
  Filter,
  UserPlus
} from "lucide-react"

import { AddTeamMemberDialog } from "../project/AddTeamMemberDialog"
import { useFrappeGetDoc } from 'frappe-react-sdk'

interface TeamMember {
  user: string
  full_name?: string
  email?: string
  image?: string
  project_status?: string
  view_attachments?: boolean
}

interface OwnerData {
  name: string
  full_name?: string
  email?: string
  user_image?: string
  designation?: string
}

interface TeamManagementProps {
  project: any
  projectUsers: TeamMember[]
  loadingUsers: boolean
  onRefreshUsers: () => void
  onRemoveMember: (user: string) => void
  isCurrentUserOwner: () => boolean
  ownerData: OwnerData | null
  ownerLoading: boolean
  ownerError: any
  editOwnerForm: any
  setShowEditOwnerDialog: (show: boolean) => void
}

export function TeamManagement({
  project,
  projectUsers,
  loadingUsers,
  onRefreshUsers,
  onRemoveMember,
}: TeamManagementProps) {
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const { data: infoOwner, error, isLoading } = useFrappeGetDoc(
    'User',     // doctype
    project.owner      // name trong User doctype thường chính là email
  )
  // Filter and search team members
  const filteredMembers = projectUsers?.filter(member => {
    const matchesSearch = !searchQuery || 
      (member.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.user?.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = filterStatus === "all" || 
      member.project_status?.toLowerCase() === filterStatus.toLowerCase()
    
    return matchesSearch && matchesFilter
  }) || []

  // Get unique project statuses for filter
  const projectStatuses = [...new Set(projectUsers?.map(member => member.project_status).filter(Boolean))]

  return (
    <div className="space-y-8">
      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Total Members
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {(projectUsers?.length || 0) + 1}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Including owner
              </p>
            </div>
            <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Project Owner
              </p>
              <p className=" font-bold text-amber-600 mt-2">
                {infoOwner?.full_name || project.owner || "N/A"}
              </p>
              <p className="text-sm text-slate-600 mt-1">Active</p>
            </div>
            <div className="h-14 w-14 bg-amber-50 rounded-xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Team Members
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {projectUsers?.length || 0}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Contributors
              </p>
            </div>
            <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-slate-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Progress
              </p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {project?.percent_complete || 0}%
              </p>
              <p className="text-sm text-slate-600 mt-1">Complete</p>
            </div>
            <div className="h-14 w-14 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Team Members Section - Enhanced */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
              Team Members
              <span className="inline-flex px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                {filteredMembers.length} of {projectUsers?.length || 0} members
              </span>
            </h3>
            <Button
              size="lg"
              className="bg-slate-800 hover:bg-slate-900"
              onClick={() => setShowAddMemberDialog(true)}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add Members
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="px-8 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search team members by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-slate-300 focus:border-slate-500"
                />
              </div>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Status</option>
                {projectStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Results count */}
            {searchQuery && (
              <div className="flex items-center text-sm text-slate-600">
                {filteredMembers.length} result{filteredMembers.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-slate-600">
                  Loading team members...
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Please wait while we fetch the team data
                </p>
              </div>
            </div>
          ) : filteredMembers && filteredMembers.length > 0 ? (
            <div className="grid gap-4">
              {filteredMembers.map((member: any, index: number) => (
                <div
                  key={member.user || index}
                  className="flex items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm border border-slate-200">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.full_name || member.user}
                          className="h-full w-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-slate-600">
                          {(member.full_name || member.user || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900 mb-1">
                        {member.full_name ||
                          member.user ||
                          "Unknown User"}
                      </h4>
                      <p className="text-slate-600 mb-2">
                        {member.email || member.user || "No email"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          👥 Team Member
                        </span>
                        {member.project_status && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200">
                            📊 {member.project_status}
                          </span>
                        )}
                        {member.view_attachments && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                            📎 File Access
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                      onClick={() => onRemoveMember(member.user)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-16">
              <div className="max-w-sm mx-auto">
                <div className="h-20 w-20 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-3">
                  No members found
                </h4>
                <p className="text-slate-600 text-base mb-6">
                  No team members match your search criteria "{searchQuery}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-sm mx-auto">
                <div className="h-20 w-20 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-3">
                  No team members yet
                </h4>
                <p className="text-slate-600 text-base mb-6">
                  Start building your team by adding members to collaborate on this project
                </p>
                <Button
                  size="lg"
                  className="bg-slate-800 hover:bg-slate-900"
                  onClick={() => setShowAddMemberDialog(true)}
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add First Member
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Team Member Dialog */}
      <AddTeamMemberDialog
        isOpen={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        projectName={project.name}
        onSuccess={() => {
          onRefreshUsers()
          setShowAddMemberDialog(false)
        }}
      />
    </div>
  )
}
