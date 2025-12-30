import { useNavigate } from 'react-router-dom';
import imageUth from '../assets/image-uth.jpg';

const ContactStudent = () => {
  const navigate = useNavigate();

  return (
    <div className="py-16 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Section - Image */}
          <div className="order-2 lg:order-1">
            <img
              src={imageUth}
              alt="Đại Học Giao Thông Vận Tải Thành Phố Hồ Chí Minh"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>

          {/* Right Section - Text Content */}
          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              UTH-ConfMS
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Hệ thống cung cấp: kiểm soát truy cập tập trung dựa trên vai trò (RBAC), đăng nhập một lần (SSO), 
              chính sách cấu hình được, nhật ký kiểm toán đầy đủ (full audit trails), và các tiện ích kết nối 
              di chuyển tùy chọn để tương tác hoặc thay thế dần các dịch vụ hiện có.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactStudent;

