import React, { useEffect, useState, useRef } from 'react';
import { Box, Backdrop, CircularProgress, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const mainRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      setGlobalLoading(Boolean(e.detail?.loading));
      setRequestCount(e.detail?.count || 0);
    };
    window.addEventListener('global-loading', handler);
    return () => window.removeEventListener('global-loading', handler);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    if (globalLoading) {
      el.setAttribute('inert', '');
      el.setAttribute('aria-busy', 'true');
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    } else {
      el.removeAttribute('inert');
      el.removeAttribute('aria-busy');
    }
  }, [globalLoading]);

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
        ref={mainRef}
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
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
          open={globalLoading}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading {requestCount > 1 ? `(${requestCount} requests)` : ''}...
            </Typography>
          </Box>
        </Backdrop>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
