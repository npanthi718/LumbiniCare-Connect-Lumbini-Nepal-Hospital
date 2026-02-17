import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Facebook,
  Instagram,
  LinkedIn,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.palette.primary.main,
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Hospital Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Lumbini Nepal Hospital
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Providing quality healthcare services to our community since 2010.
              We are committed to excellence in patient care and medical innovation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="inherit" size="small" href='https://www.facebook.com/sushil.panthi.900' target='_blank'>
                <Facebook />
              </IconButton>
              <IconButton color="inherit" size="small" href='https://www.instagram.com/official_sushil_panthi/?hl=en' target='_blank'>
                <Instagram />
              </IconButton>
              <IconButton color="inherit" size="small" href='https://www.linkedin.com/in/sushilpanthi/' target='_blank'>
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <RouterLink to="/doctors" style={{ color: 'inherit', textDecoration: 'none' }}>
                Find a Doctor
              </RouterLink>
              <RouterLink to="/departments" style={{ color: 'inherit', textDecoration: 'none' }}>
                Departments
              </RouterLink>
              <RouterLink to="/appointments" style={{ color: 'inherit', textDecoration: 'none' }}>
                Book Appointment
              </RouterLink>
              <RouterLink to="/aboutus" style={{ color: 'inherit', textDecoration: 'none' }}>
                About Us
              </RouterLink>
              <RouterLink to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>
                Contact Us
              </RouterLink>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" />
                <Typography variant="body2">
                  +977 9823009467<br />
                  +977 9863462642
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" />
                <Typography variant="body2">
                  info@lumbininepalhospital.com<br />
                  npanthi718@gmail.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn fontSize="small" />
                <Typography variant="body2">
                  Saljhandi-10, Sainamaina, Butwal, Rupandehi<br />
                  District, Lumbini Province, Nepal
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box
          sx={{
            mt: 4,
            pt: 2,
            borderTop: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">
            © {new Date().getFullYear()} Lumbini Nepal Hospital. All rights reserved @ Sushil Panthi.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 