import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';

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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function Profile() {
  const { user, updateProfile, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    gender: user?.gender || '',
    bloodGroup: user?.bloodGroup || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
    },
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      age: user?.age || '',
      gender: user?.gender || '',
      bloodGroup: user?.bloodGroup || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || '',
      },
    });
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addrKey = name.split('.')[1];
      setProfileData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addrKey]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        name: profileData.name,
        phone: profileData.phone,
        age: profileData.age ? Number(profileData.age) : undefined,
        gender: profileData.gender || undefined,
        bloodGroup: profileData.bloodGroup || undefined,
        address: {
          street: profileData.address.street,
          city: profileData.address.city,
          state: profileData.address.state,
          zipCode: profileData.address.zipCode,
          country: profileData.address.country,
        },
      };
      await updateProfile(payload);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    setLoading(true);
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Personal Info" />
          <Tab label="Change Password" />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
              </Typography>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleProfileSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Full Name"
                  fullWidth
                  required
                  value={profileData.name}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={profileData.email}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={profileData.phone}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="age"
                  label="Age"
                  type="number"
                  fullWidth
                  value={profileData.age}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="gender"
                  label="Gender (male/female/other)"
                  fullWidth
                  value={profileData.gender}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="bloodGroup"
                  label="Blood Group (e.g., O+)"
                  fullWidth
                  value={profileData.bloodGroup}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="address.street"
                  label="Street Address"
                  fullWidth
                  value={profileData.address.street}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="address.city"
                  label="City"
                  fullWidth
                  value={profileData.address.city}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="address.state"
                  label="State"
                  fullWidth
                  value={profileData.address.state}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="address.zipCode"
                  label="ZIP Code"
                  fullWidth
                  value={profileData.address.zipCode}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="address.country"
                  label="Country"
                  fullWidth
                  value={profileData.address.country}
                  onChange={handleProfileChange}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handlePasswordSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  fullWidth
                  required
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="newPassword"
                  label="New Password"
                  type="password"
                  fullWidth
                  required
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  required
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Update Password'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Container>
  );
}

export default Profile;
