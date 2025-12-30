import { useNavigate } from 'react-router-dom';
import HeorUth from '../assets/image-hero.jpg';
const HeroStudent = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white from-gray-50 to-gray-100 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="space-y-8 w-[660px]">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                UTH Scientific Conference Paper Management System
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Hệ thống quản lý giấy tờ Hội nghị Nghiên cứu khoa học dành cho
                Trường Đại Học UTH
              </p>
            </div>
          </div>
          <figure>
            <img src={HeorUth} alt="Hero" className="rounded-lg shadow-lg" />
          </figure>
        </div>
        <div className="flex justify-center space-x-2 mt-20">
          <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default HeroStudent;
