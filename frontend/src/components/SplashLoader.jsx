import React from 'react';
import { Box, Typography } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

const SplashLoader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          bgcolor: 'background.paper',
          boxShadow: 3,
          animation: 'spin 1.2s linear infinite',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      >
        <LocalHospital color="primary" sx={{ fontSize: 64 }} />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Lumbini Nepal Hospital
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Loading, please wait...
      </Typography>
    </Box>
  );
};

export default SplashLoader;
