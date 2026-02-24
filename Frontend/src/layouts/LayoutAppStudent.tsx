import { Outlet, useLocation } from 'react-router-dom';
import FeatureStudent from "../components/student/FeatureStudent";
import Footer from "../components/layout/Footer";
import HeaderStudent from "../components/student/HeaderStudent";
import HeroStudent from "../components/student/HeroStudent";

const LayoutAppStudent = () => {
    const location = useLocation();
    const hideHeroFeature = location.pathname.startsWith('/student') || location.pathname.startsWith('/reviewer');

    return (
        <div className="overflow-x-hidden">
            <HeaderStudent/>
            {!hideHeroFeature && <HeroStudent/>}
            {!hideHeroFeature && <FeatureStudent/>}
            <Outlet />
            <Footer/>
        </div>
    );
}

export default LayoutAppStudent;
