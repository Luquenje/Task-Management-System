import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // User is authenticated but not an admin
    return <Navigate to="/applications" state={{ from: location }} replace />;
    // return (
    //   <Box
    //     sx={{
    //       display: 'flex',
    //       flexDirection: 'column',
    //       justifyContent: 'center',
    //       alignItems: 'center',
    //       minHeight: '80vh'
    //     }}
    //   >
    //     <Typography variant="h4" color="error" gutterBottom>
    //       Access Denied
    //     </Typography>
    //     <Typography variant="body1" color="text.secondary">
    //       You don't have permission to access this page.
    //     </Typography>
    //   </Box>
    // );
  }

  return children;
};

export default ProtectedRoute;

