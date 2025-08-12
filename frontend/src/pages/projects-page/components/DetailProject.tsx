import { useState } from 'react'
import { Calendar, DollarSign, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { Project } from '@/types/Projects/Project'
import { formatCurrency } from '@/utils/formatCurrency'
import { ProjectTaskManagement } from './ProjectTaskManagement'

interface DetailProjectProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
}

export function DetailProject({ project, isOpen, onClose }: DetailProjectProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  
  const getStatusColor = (status?: "Open" | "Completed" | "Cancelled") => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (!project) return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent>
        <div className="w-full h-full overflow-y-auto p-6">
          <DrawerHeader className="px-0 pb-6">
            <DrawerTitle className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {project.project_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{project.project_name}</h2>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status || 'Open'}
                  </span>
                  {project.project_type && (
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                      {project.project_type}
                    </span>
                  )}
                </div>
              </div>
            </DrawerTitle>
            <DrawerDescription className="text-lg text-gray-600 mt-4">
              Project Details and Progress Overview
            </DrawerDescription>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mt-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tasks & Phases
              </button>
            </div>
          </DrawerHeader>
          
          <div className="space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Progress Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-700">Overall Progress</span>
                      <span className="text-2xl font-bold text-blue-600">{project.percent_complete || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${project.percent_complete || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Project Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Customer</p>
                        <p className="text-xl font-bold text-gray-900">{project.customer || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Budget</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(project.estimated_costing)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Calendar className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Deadline</p>
                        <p className="text-xl font-bold text-gray-900">{formatDate(project.expected_end_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Start Date</span>
                        <span className="text-gray-900 font-semibold">{formatDate(project.expected_start_date)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Priority</span>
                        <span className="text-gray-900 font-semibold">{project.priority || 'Medium'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Department</span>
                        <span className="text-gray-900 font-semibold">{project.department || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-600 font-medium">Company</span>
                        <span className="text-gray-900 font-semibold">{project.company || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Financial Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Cost</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(project.total_costing_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Sales</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(project.total_sales_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Billable Amount</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(project.total_billable_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-600 font-medium">Gross Margin</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(project.gross_margin)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tasks' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <ProjectTaskManagement projectName={project.name} />
              </div>
            )}
          </div>
          
          <DrawerFooter className="px-0 mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-4">
              <Button className="flex-1 h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
                Edit Project
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-12 text-lg font-semibold"
                onClick={() => setActiveTab('tasks')}
              >
                View Tasks
              </Button>
              <Button variant="outline" className="flex-1 h-12 text-lg font-semibold">
                View Timeline
              </Button>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" onClick={onClose} className="mt-4 h-12 text-lg">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
