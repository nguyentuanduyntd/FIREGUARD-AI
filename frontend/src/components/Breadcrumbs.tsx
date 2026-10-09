import { Breadcrumbs as MuiBreadcrumbs, Typography, Link } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 3 }}
    >
      <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">
        Trang chủ
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        // Humanize route paths
        const friendlyName = value.charAt(0).toUpperCase() + value.slice(1);

        return last ? (
          <Typography color="text.primary" key={to}>
            {friendlyName}
          </Typography>
        ) : (
          <Link component={RouterLink} underline="hover" color="inherit" to={to} key={to}>
            {friendlyName}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
