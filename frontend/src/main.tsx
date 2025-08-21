import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { Dashboard } from './pages/dashboard-page'
import { ProjectsPage } from './pages/projects-page/ProjectsPage.tsx'
import { TasksPage } from './pages/tasks-page/TasksPage.tsx'
import { TimeTrackingPage } from './pages/TimeTrackingPage'
import { SimplePage } from './pages/SimplePage'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "tasks", 
        element: <TasksPage />,
      },
      {
        path: "time-tracking",
        element: <TimeTrackingPage />,
      },
      {
        path: "cost-analysis",
        element: <SimplePage title="Cost Analysis" description="Track project costs and budget allocations" />,
      },
      {
        path: "reports",
        element: <SimplePage title="Reports" description="Generate detailed reports and analytics" />,
      },
      {
        path: "calendar",
        element: <SimplePage title="Calendar" description="Manage deadlines and project timelines" />,
      },
      {
        path: "team",
        element: <SimplePage title="Team Management" description="Manage team members and permissions" />,
      },
      {
        path: "documents",
        element: <SimplePage title="Documents" description="Store and organize project documents" />,
      },
      {
        path: "settings",
        element: <SimplePage title="Settings" description="Configure your workspace preferences" />,
      },
    ]
  },
], {
  basename: import.meta.env.VITE_BASE_PATH,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
