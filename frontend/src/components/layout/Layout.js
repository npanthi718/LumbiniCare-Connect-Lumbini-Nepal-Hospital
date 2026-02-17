import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          px: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          '&:focus': {
            outline: 'none',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme => theme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        }}
        tabIndex="-1"
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;