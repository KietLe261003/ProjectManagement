import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Project } from '@/types/Projects/Project';
import EditProject from './EditProject';
import DeleteProject from './DeleteProject';

interface ProjectActionsProps {
  project: Project;
  onProjectUpdated?: () => void;
  onProjectDeleted?: () => void;
  onCloseDrawer?: () => void; // Add callback to close drawer
}

const ProjectActions: React.FC<ProjectActionsProps> = ({ 
  project, 
  onProjectUpdated, 
  onProjectDeleted,
  onCloseDrawer
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent card click
    setIsEditOpen(true);
    setIsPopoverOpen(false);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent card click
    setIsDeleteOpen(true);
    setIsPopoverOpen(false);
  };

  const handleEditSuccess = () => {
    if (onProjectUpdated) {
      onProjectUpdated();
    }
  };

  const handleDeleteSuccess = () => {
    if (onProjectDeleted) {
      onProjectDeleted();
    }
    // Close drawer if it's open
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when clicking actions
              setIsPopoverOpen(!isPopoverOpen);
            }}
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-48 p-2" 
          align="end"
          onClick={(e) => e.stopPropagation()} // Prevent any clicks inside popover from bubbling
        >
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleEdit(e)}
              className="w-full justify-start text-left"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDelete(e)}
              className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Edit Project Dialog */}
      <EditProject
        project={project}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Project Dialog */}
      <DeleteProject
        project={project}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default ProjectActions;
