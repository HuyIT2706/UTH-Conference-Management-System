import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import iconUth from '../assets/icon_uth.svg';

const HeaderStudent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const initials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    user?.email?.[0].toUpperCase() ||
    'U';

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <img
            className="w-2/3 h-2/3"
            src={iconUth}
            alt="UTH - Trường Giao Thông Vận Tải TPHCM"
          />
        </div>
        <nav className="hidden md:flex items-center space-x-1 ">
          <Link
            to="/dashboard"
            className={`p-4 rounded-lg transition-colors text-lg  ${
              location.pathname === '/dashboard'
                ? 'bg-white/20 text-white font-semibold'
                : 'text-white/90 hover:text-hover hover:font-semibold'
            }`}
          >
            Trang chủ
          </Link>
          <Link
            to="/submissions"
            className={`p-4 rounded-lg transition-colors text-lg  ${
              location.pathname === '/submissions' || location.pathname.startsWith('/submissions/')
                ? 'bg-white/20 text-white font-semibold'
                : 'text-white/90 hover:text-hover hover:font-semibold'
            }`}
          >
            Sinh viên
          </Link>
          <Link
            to="/assignments"
            className={`p-4 rounded-lg transition-colors text-lg  ${
              location.pathname === '/assignments' || location.pathname.startsWith('/assignments/')
                ? 'bg-white/20 text-white font-semibold'
                : 'text-white/90 hover:text-hover hover:font-semibold'
            }`}
          >
            Review
          </Link>
          <Link
            to="/conference-setup"
            className={`p-4 rounded-lg transition-colors text-lg  ${
              location.pathname === '/conference-setup' || location.pathname.startsWith('/conference-setup/')
                ? 'bg-white/20 text-white font-semibold'
                : 'text-white/90 hover:text-hover hover:font-semibold'
            }`}
          >
            Sự kiện
          </Link>
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="p-4 rounded-lg transition-colors text-lg  text-white/90 hover:text-hover hover:font-semibold"
          >
            Liên hệ
          </Link>
        </nav>
        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-green-500 px-4 py-2 rounded-lg hover:bg-green-400"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                {initials}
              </div>
              <span className="hidden md:block">
                {user?.fullName || user?.email}
              </span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Xem thông tin tài khoản
                    </button>
                    <button
                      onClick={() => {
                        navigate('/change-password');
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đổi mật khẩu
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderStudent;
