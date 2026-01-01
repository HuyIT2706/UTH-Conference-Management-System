import { Outlet, useLocation } from 'react-router-dom';
import FeatureStudent from "../components/FeatureStudent";
import Footer from "../components/Footer";
import HeaderStudent from "../components/HeaderStudent";
import HeroStudent from "../components/HeroStudent";
import Breadcrumbs from '../components/Breadcrumbs';
import { Container } from '@mui/material';

const LayoutAppStudent = () => {
    const location = useLocation();
    const hideHeroFeature = location.pathname.startsWith('/home/student');

    return (
        <>
            <HeaderStudent/>
            {!hideHeroFeature && <HeroStudent/>}
            {!hideHeroFeature && <FeatureStudent/>}
            <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
                <Breadcrumbs />
            </Container>
            <Outlet />
            <Footer/>
        </>
    );
}

export default LayoutAppStudent;
