import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
        return null;
    }

    return (
        <MuiBreadcrumbs aria-label="breadcrumb">
            <Link
                component={RouterLink}
                to="/"
                sx={{ display: 'flex', alignItems: 'center' }}
            >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
            </Link>
            {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

                return isLast ? (
                    <Typography key={name}>{capitalizedName}</Typography>
                ) : (
                    <Link key={name} component={RouterLink} to={routeTo}>
                        {capitalizedName}
                    </Link>
                );
            })}
        </MuiBreadcrumbs>
    );
};

export default Breadcrumbs;
