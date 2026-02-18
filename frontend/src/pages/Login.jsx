import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
// api imported indirectly through AuthContext; explicit axios instance not used here
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

// Interceptors configured globally in services/api.js

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      const userData = await login(formData.email, formData.password);
      setSuccess('Login successful!');
      const fromPath =
        typeof location.state?.from === 'string'
          ? location.state?.from
          : location.state?.from?.pathname;
      const shouldReturnToFlow =
        fromPath &&
        (fromPath.startsWith('/appointments') ||
         fromPath.startsWith('/doctors') ||
         fromPath.startsWith('/prescriptions'));
      const defaultDashboard = `/${userData?.role || 'patient'}/dashboard`;
      const target = shouldReturnToFlow ? fromPath : defaultDashboard;
      setTimeout(() => {
        navigate(target, { replace: true });
      }, 400);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>

            <Grid container justifyContent="space-between">
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  Don&apos;t have an account? Register
                </Link>
              </Grid>
              <Grid item>
                <Link to="/" style={{ textDecoration: 'none' }}>
                  Back to Home
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
