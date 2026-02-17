import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { Phone, Email, LocationOn } from '@mui/icons-material';
import api from '../services/api';

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/contact', formData);
      setSuccess('Message sent successfully!');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Have questions or need assistance? Reach out to us using the form below or contact us directly using the information provided.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Send us a message
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="name"
                    label="Full Name"
                    fullWidth
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="email"
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="subject"
                    label="Subject"
                    fullWidth
                    required
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="message"
                    label="Message"
                    fullWidth
                    required
                    multiline
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained">
                    Send Message
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Phone fontSize="small" />
              <Typography variant="body2">
                +977 9823009467<br />
                +977 9863462642
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ContactUs;
