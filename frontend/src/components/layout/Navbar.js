import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person,
  Dashboard,
  CalendarToday,
  LocalHospital,
  People,
  Settings,
  ExitToApp,
  Info,
  ContactSupport,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, loading, error, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showError, setShowError] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setShowError(true);
    }
  };

  const handleErrorClose = () => {
    setShowError(false);
  };

  const getMenuItems = () => {
    if (!user) {
      return [
        { text: 'Home', path: '/', icon: <Dashboard /> },
        { text: 'Doctors', path: '/doctors', icon: <LocalHospital /> },
        { text: 'Departments', path: '/departments', icon: <People /> },
        { text: 'About Us', path: '/aboutus', icon: <Info /> },
        { text: 'Contact Us', path: '/contact', icon: <ContactSupport /> },
        { text: 'Login', path: '/login', icon: <Person /> },
        { text: 'Register', path: '/register', icon: <Person /> },
      ];
    }

    const commonItems = [
      { text: 'Dashboard', path: `/${user.role}/dashboard`, icon: <Dashboard /> },
      { text: 'About Us', path: '/aboutus', icon: <Info /> },
      { text: 'Contact Us', path: '/contact', icon: <ContactSupport /> },
    ];

    switch (user.role) {
      case 'patient':
        return [
          ...commonItems,
          { text: 'Appointments', path: '/appointments', icon: <CalendarToday /> },
          { text: 'Prescriptions', path: '/prescriptions', icon: <LocalHospital /> },
          { text: 'Profile', path: '/patient/profile', icon: <Person /> },
        ];
      case 'doctor':
        return [
          ...commonItems,
          { text: 'Profile', path: '/doctor/profile', icon: <Person /> },
        ];
      case 'admin':
        return [
          ...commonItems,
          { text: 'Profile', path: '/admin/profile', icon: <Person /> },
        ];
      default:
        return commonItems;
    }
  };

  const drawer = (
    <Box sx={{ width: { xs: 250, sm: 300 } }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Lumbini Nepal Hospital
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        {user && (
          <>
            <Divider />
            <ListItem
              button
              onClick={handleLogout}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ExitToApp />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  if (loading) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <CircularProgress color="inherit" size={24} />
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ 
          justifyContent: 'space-between',
          minHeight: { xs: '56px', sm: '64px' },
          px: { xs: 1, sm: 2 },
          gap: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            minWidth: 'fit-content'
          }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: '180px', sm: '240px', md: '300px' }
              }}
            >
              Lumbini Nepal Hospital
            </Typography>
          </Box>

          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { sm: 0.5, md: 1 },
                mx: { sm: 1, md: 2 },
                flexGrow: 1,
                justifyContent: 'center',
                overflow: 'visible',
                flexWrap: 'nowrap'
              }}
            >
              {getMenuItems().map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    minWidth: { sm: '80px', md: 'auto' },
                    px: { sm: 0.75, md: 1.5 },
                    py: 0.5,
                    fontSize: { sm: '0.75rem', md: '0.875rem' },
                    whiteSpace: 'nowrap',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {user && !isMobile && (
            <Box sx={{ minWidth: 'fit-content' }}>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{
                  ml: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Person />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            minWidth: 180,
          },
        }}
      >
        <MenuItem
          component={RouterLink}
          to={`/${user?.role}/profile`}
          onClick={handleMenuClose}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: { xs: 250, sm: 300 },
            '& .MuiDrawer-paper': {
              width: { xs: 250, sm: 300 },
            },
          },
        }}
      >
        {drawer}
      </Drawer>
      <Snackbar
        open={showError || Boolean(error)}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleErrorClose}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error || 'An error occurred. Please try again.'}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;