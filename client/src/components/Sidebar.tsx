import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface MenuItem {
  name: string;
  to: string;
  icon?: string;
}

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('ADMIN');
  const isChair = user?.roles?.includes('CHAIR') && !isAdmin; 

  const menuItems: MenuItem[] = [
    {
      name: 'Thiết lập Hội nghị & CFP',
      to: '/conference-setup',
    },
    {
      name: 'Nộp bài / Tóm tắt',
      to: '/submissions',
    },
    {
      name: 'Quản lý Ban Chương trình (PC)',
      to: '/pc-management',
    },
    {
      name: 'Phân công & Phản biện',
      to: '/assignments',
    },
    {
      name: 'Ra Quyết định & Thông báo',
      to: '/decisions',
    },
    {
      name: 'Bài hoàn thiện (Camera-ready)',
      to: '/camera-ready',
    },
    {
      name: 'Báo cáo & Phân tích',
      to: '/reports',
    },
    ...(isAdmin
      ? [
          {
            name: 'Quản lý tài khoản',
            to: '/account-management',
          },
        ]
      : [
          {
            name: 'Quản lý tài khoản',
            to: '/account-management',
          },
        ]),
  ];

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    if (path !== '/' && location.pathname.startsWith(path + '/')) return true;
    return false;
  };

  return (
    <div className="w-64 bg-gray-50 min-h-screen border-r border-gray-200">
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive(item.to)
                  ? 'bg-gray-200 text-teal-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;



