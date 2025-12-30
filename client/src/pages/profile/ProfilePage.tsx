import { useAuth } from '../../hooks/useAuth';

const ProfilePage = () => {
  const { user } = useAuth();

  const formatRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: 'Quản trị viên',
      CHAIR: 'Chủ tịch hội nghị',
      PC_MEMBER: 'Thành viên ban chương trình',
      AUTHOR: 'Tác giả',
      REVIEWER: 'Người phản biện',
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa có dữ liệu';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thông tin tài khoản</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <p className="text-gray-900 text-lg">
                {user.fullName || 'Chưa có thông tin'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900 text-lg">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium"
                    >
                      {formatRoleName(role)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Chưa có vai trò</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái xác thực
              </label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.isVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày tạo tài khoản
              </label>
              <p className="text-gray-900">{formatDate(user.createdAt)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cập nhật lần cuối
              </label>
              <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

