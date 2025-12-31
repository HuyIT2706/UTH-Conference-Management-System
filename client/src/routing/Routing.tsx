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
import TrackManagementPage from '../pages/admin/tracks/TrackManagementPage';
import SubmissionsPage from '../pages/admin/SubmissionsPage';
import PCManagementPage from '../pages/admin/pc-management/PCManagementPage';
import AssignmentsPage from '../pages/admin/AssignmentsPage';
import DecisionsPage from '../pages/admin/DecisionsPage';
import CameraReadyPage from '../pages/admin/CameraReadyPage';
import ReportsPage from '../pages/admin/ReportsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import ChangePasswordPage from '../pages/profile/ChangePasswordPage';
import RoleBasedRedirect from '../components/RoleBasedRedirect';
import LayoutAppStudent from '../layouts/LayoutAppStudent';
import ContactStudent from '../components/ContactStudent';
import Competition from '../components/Competition';

const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/activate-account',
    element: <ActivateAccount />,
  },
  {
    path: 'profile',
    element: <ProfilePage />,
  },
  {
    path: 'change-password',
    element: <ChangePasswordPage />,
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
        element: <PCManagementPage />,
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
      {
        path: 'tracks',
        element: <TrackManagementPage />,
      },
    ],
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <LayoutAppStudent />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      { 
        path: 'student',
        element: <h1>Xin chào trang này dành cho sinh viên nộp bài</h1>
      },
      {
        path: 'review',
        element: <h1>Xin chào trang này dành cho người phản biện</h1>
      },
      {
        path: 'publicconference',
        element: <Competition />
      },
      {
        path: 'contact',
        element: <ContactStudent/>
      }
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default appRouter;
