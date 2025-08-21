import React from 'react';
import { useProjectData } from '../../hooks/useProjectData.ts';
import { ProjectFilter } from './components/ProjectFilter.tsx';
import { DashboardMetrics } from './components/DashboardMetrics.tsx';
// import { ProjectIssuesSummary } from './components/ProjectIssuesSummary';
import { ProjectMilestonesTeam } from './components/ProjectMilestonesTeam.tsx';
import { ProjectGanttChart } from './components/ProjectGanttChart.tsx';
import { ProjectOverview } from './components/ProjectOverview.tsx';
import { TaskManagement } from './components/TaskManagement.tsx';
//import { TimeTracking } from '../../../components/TimeTracking';
//import { CostAnalysis } from '../../../components/CostAnalysis';
import { LoadingSpinner } from '../../components/LoadingSpinner.tsx';

export const Dashboard: React.FC = () => {
  const { 
    allProjects, 
    allPhases,
    filteredData, 
    selectedProject, 
    selectedDepartment,
    selectedTeam,
    setSelectedProject, 
    setSelectedDepartment,
    setSelectedTeam,
    isLoading 
  } = useProjectData();

  // const { data } = useFrappeGetDocList<Department>('Department', {
  //   fields: ['name', 'department_name', 'company'],
  //   limit: 20,
  //   orderBy: {
  //     field: 'creation',
  //     order: 'desc',
  //   },
  // });  
  //console.log(data);
  // console.log(allProjects);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  // console.log("Testing",);

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Bảng điều khiển quản lý dự án
        </h1>

        <ProjectFilter
          projects={allProjects}
          selectedProject={selectedProject}
          selectedDepartment={selectedDepartment}
          selectedTeam={selectedTeam}
          onProjectChange={setSelectedProject}
          onDepartmentChange={setSelectedDepartment}
          onTeamChange={setSelectedTeam}
        />

        <DashboardMetrics
          projects={filteredData.filteredProjects}
          tasks={filteredData.filteredTasks}
          selectedProject={selectedProject}
        />

        <ProjectOverview
          projects={filteredData.filteredProjects}
          tasks={filteredData.filteredTasks}
          selectedProject={selectedProject}
        />


        <ProjectMilestonesTeam 
          projects={filteredData.filteredProjects}
          tasks={filteredData.filteredTasks}
          selectedProject={selectedProject}
        />

        {/*<ProjectIssuesSummary /> */}

        <ProjectGanttChart 
          projects={filteredData.filteredProjects}
          tasks={filteredData.filteredTasks}
        />
        <TaskManagement
          projects={filteredData.filteredProjects}
          phases={filteredData.filteredPhases}
          tasks={filteredData.filteredTasks}
        />

        {/* <TimeTracking
          timesheets={filteredData.filteredTimesheets}
        />

        <CostAnalysis
          projects={filteredData.filteredProjects}
        /> */}
      </div>
    </div>
  );
};
