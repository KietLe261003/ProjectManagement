import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFrappeGetDoc } from 'frappe-react-sdk';
import type { Project } from '@/types/Projects/Project';
import { DetailProject } from './components/project/DetailProject';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Add key to force re-fetch when projectId changes
  const { data: project, isLoading, error } = useFrappeGetDoc<Project>(
    'Project',
    projectId || '',
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Force refresh when projectId changes
      shouldRetryOnError: true,
    }
  );

  const handleBack = () => {
    navigate('/projects');
  };

  // Don't render anything if no projectId
  if (!projectId) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-8 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-yellow-700 text-center">
          <p className="text-lg font-medium mb-2">No project selected</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading project details...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-8 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-700 text-center">
          <p className="text-lg font-medium mb-2">Error loading project</p>
          <p className="text-sm mb-4">{error?.message || 'Project not found'}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return <DetailProject key={projectId} project={project} onBack={handleBack} />;
};
