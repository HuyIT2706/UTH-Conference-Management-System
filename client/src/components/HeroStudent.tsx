import { useNavigate } from 'react-router-dom';

const HeroStudent = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Section - Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                UTH Scientific Conference Paper Management System
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Hệ thống quản lý giấy tờ Hội nghị Nghiên cứu khoa học dành cho Trường Đại Học UTH
              </p>
            </div>
            <button
              onClick={() => navigate('/submissions')}
              className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Register
            </button>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              <div className="relative">
                <div className="bg-gray-300 rounded-t-lg shadow-2xl p-4 border-4 border-gray-400">
                  <div className="bg-gray-900 rounded-lg p-6 h-64">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-12 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          Start
                        </div>
                        <div className="w-8 h-0.5 bg-white"></div>
                        <div className="w-16 h-12 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          Process
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-20">
                        <div className="w-8 h-0.5 bg-white"></div>
                        <div className="w-0.5 h-8 bg-white"></div>
                        <div className="w-8 h-0.5 bg-white"></div>
                        <div className="w-16 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          End
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                        <div className="h-2 bg-gray-700 rounded w-4/5"></div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <div className="px-2 py-1 bg-green-600 rounded text-white text-xs">CSS</div>
                        <div className="px-2 py-1 bg-green-600 rounded text-white text-xs">HTML</div>
                        <div className="px-2 py-1 bg-green-600 rounded text-white text-xs">C++</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-400 h-8 w-32 mx-auto rounded-b-lg"></div>
                <div className="bg-gray-500 h-4 w-48 mx-auto rounded-lg"></div>
              </div>

              <div className="absolute -right-8 bottom-0">
                <div className="bg-teal-600 w-16 h-20 rounded-t-full flex items-end justify-center pb-2">
                  <div className="bg-white w-12 h-16 rounded-t-lg">
                    <div className="bg-teal-400 h-10 rounded-t-lg flex items-center justify-center">
                      <div className="w-8 h-6 bg-teal-600 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -left-4 bottom-16">
                <svg
                  className="w-12 h-12 text-gray-400 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center space-x-2 mt-12">
          <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default HeroStudent;

