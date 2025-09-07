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
import { DocumentsPage } from './pages/documents-page'
import { BudgetPage } from './pages/budget-page'
import { RiskPage } from './pages/risk-page'
import { MeetingsPage } from './pages/meetings-page'
import { ReportsPage } from './pages/reports-page'
import { SettingsPage } from './pages/settings-page'
import { TimeTrackingPage } from './pages/TimeTrackingPage'

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
        path: "documents",
        element: <DocumentsPage />,
      },
      {
        path: "budget",
        element: <BudgetPage />,
      },
      {
        path: "risk",
        element: <RiskPage />,
      },
      {
        path: "meetings",
        element: <MeetingsPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      // Legacy routes for backward compatibility
      {
        path: "time-tracking",
        element: <TimeTrackingPage />,
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
