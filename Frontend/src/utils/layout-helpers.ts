import { useLocation } from 'react-router-dom';
export const useIsInLayoutApp = (): boolean => {
  const location = useLocation();
  const pathname = location.pathname;
  const layoutAppRoutes = [
    '/dashboard',
    '/conference-setup',
    '/submissions',
    '/pc-management',
    '/assignments',
    '/camera-ready',
    '/reports',
    '/account-management',
    '/tracks',
    '/profile',
    '/change-password',
  ];
  if (pathname === '/' || pathname === '/dashboard') {
    return true;
  }
  return layoutAppRoutes.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
};
