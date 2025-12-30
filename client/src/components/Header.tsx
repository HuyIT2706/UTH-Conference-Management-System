import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import iconUth from '../assets/icon_uth.svg';

const Header = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <img className="w-2/3 h-2/3" src={iconUth} alt="UTH - Trường Giao Thông Vận Tải TPHCM" />
        </div>
        <div className="flex-1 max-w-2xl mx-8 border border-solid border-white rounded-full">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full h-12 p-2 text-lg pl-5 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <button
                type="submit"
                className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors cursor-pointer"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
        <div className="flex items-center">
          <div className="relative group">
            <button className="flex items-center space-x-2 bg-green-500 px-4 py-2 rounded-lg hover:bg-green-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                {initials}
              </div>
              <span className="hidden md:block">{user?.fullName || user?.email}</span>
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
