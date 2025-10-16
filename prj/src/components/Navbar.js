import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  VerifiedUser as VerifierIcon,
  Security as SecurityIcon,
  Info as AboutIcon,
  ContactSupport as ContactIcon,
  Policy as PolicyIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ userRole = null }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleDashboardMenuOpen = (event) => {
    setDashboardMenuAnchor(event.currentTarget);
  };

  const handleDashboardMenuClose = () => {
    setDashboardMenuAnchor(null);
  };

  const navigationItems = [
    { label: 'Home', path: '/', public: true },
    { label: 'About', path: '/about', public: true },
    { label: 'Contact', path: '/contact', public: true },
    { label: 'Privacy', path: '/privacy', public: true }
  ];

  const dashboardItems = [
    { label: 'User Dashboard', path: '/dashboard', icon: <DashboardIcon />, role: 'user' },
    { label: 'Admin Dashboard', path: '/admin', icon: <AdminIcon />, role: 'admin' },
    { label: 'Verifier Dashboard', path: '/verifier', icon: <VerifierIcon />, role: 'verifier' },
    { label: 'Upload Document', path: '/upload', icon: <DashboardIcon />, role: 'user' },
    { label: 'Fraud Detection', path: '/fraud-detection', icon: <SecurityIcon />, role: 'admin' }
  ];

  const renderDesktopNav = () => (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
      {/* Public Navigation */}
      {navigationItems.map((item) => (
        <Button 
          key={item.path}
          component={Link} 
          to={item.path} 
          color="inherit"
          sx={{ textTransform: 'none' }}
        >
          {item.label}
        </Button>
      ))}

      {/* Dashboard Menu for Authenticated Users */}
      {userRole && (
        <>
          <Button
            color="inherit"
            onClick={handleDashboardMenuOpen}
            startIcon={<DashboardIcon />}
            sx={{ textTransform: 'none' }}
          >
            Dashboard
          </Button>
          <Menu
            anchorEl={dashboardMenuAnchor}
            open={Boolean(dashboardMenuAnchor)}
            onClose={handleDashboardMenuClose}
          >
            {dashboardItems
              .filter(item => !item.role || item.role === userRole || userRole === 'admin')
              .map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    handleDashboardMenuClose();
                  }}
                >
                  {item.icon}
                  <Typography sx={{ ml: 1 }}>{item.label}</Typography>
                </MenuItem>
              ))}
          </Menu>
        </>
      )}

      {/* Authentication Buttons */}
      {!userRole ? (
        <>
          <Button 
            component={Link} 
            to="/sign-in" 
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Sign In
          </Button>
          <Button 
            component={Link} 
            to="/register" 
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Register
          </Button>
        </>
      ) : (
        <Button 
          color="inherit"
          onClick={() => {
            // Handle logout
            navigate('/');
          }}
          sx={{ textTransform: 'none' }}
        >
          Logout
        </Button>
      )}
    </Box>
  );

  const renderMobileNav = () => (
    <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
      <IconButton
        color="inherit"
        onClick={handleMobileMenuOpen}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
      >
        {/* Public Navigation */}
        {navigationItems.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              handleMobileMenuClose();
            }}
          >
            {item.label}
          </MenuItem>
        ))}

        {/* Dashboard Items for Authenticated Users */}
        {userRole && dashboardItems
          .filter(item => !item.role || item.role === userRole || userRole === 'admin')
          .map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => {
                navigate(item.path);
                handleMobileMenuClose();
              }}
            >
              {item.icon}
              <Typography sx={{ ml: 1 }}>{item.label}</Typography>
            </MenuItem>
          ))}

        {/* Authentication */}
        {!userRole ? (
          <>
            <MenuItem onClick={() => { navigate('/sign-in'); handleMobileMenuClose(); }}>
              Sign In
            </MenuItem>
            <MenuItem onClick={() => { navigate('/register'); handleMobileMenuClose(); }}>
              Register
            </MenuItem>
          </>
        ) : (
          <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
            Logout
          </MenuItem>
        )}
      </Menu>
    </Box>
  );

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          TrustNet
        </Typography>
        
        {renderDesktopNav()}
        {renderMobileNav()}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
