import { createBrowserRouter, Navigate } from 'react-router-dom';
import LayoutApp from '../layouts/LayoutApp';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProtectedRoute from '../components/ProtectedRoute';
import ActivateAccount from '../pages/auth/ActivateAccount';
import DashboardPage from '../pages/admin/DashboardPage';
import AccountManagementPage from '../pages/admin/account/AccountManagementPage';
import ConferenceSetupPage from '../pages/admin/conference/ConferenceSetupPage';
import SubmissionsPage from '../pages/admin/SubmissionsPage';
import PcManagementPage from '../pages/admin/PcManagementPage';
import AssignmentsPage from '../pages/admin/AssignmentsPage';
import DecisionsPage from '../pages/admin/DecisionsPage';
import CameraReadyPage from '../pages/admin/CameraReadyPage';
import ReportsPage from '../pages/admin/ReportsPage';
import RoleBasedRedirect from '../components/RoleBasedRedirect';

const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage/>
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/activate-account',
    element : <ActivateAccount/>
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LayoutApp />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RoleBasedRedirect />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'conference-setup',
        element: <ConferenceSetupPage />,
      },
      {
        path: 'submissions',
        element: <SubmissionsPage />,
      },
      {
        path: 'pc-management',
        element: <PcManagementPage />,
      },
      {
        path: 'assignments',
        element: <AssignmentsPage />,
      },
      {
        path: 'decisions',
        element: <DecisionsPage />,
      },
      {
        path: 'camera-ready',
        element: <CameraReadyPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'account-management',
        element: <AccountManagementPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default appRouter;