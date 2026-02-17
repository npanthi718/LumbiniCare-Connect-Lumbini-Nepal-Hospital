import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Tab,
  Tabs,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { user, updateProfile, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
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
      country: user?.address?.country || ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminReset, setAdminReset] = useState({ email: '', newPassword: '' });
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    specialization: '',
    experience: 0,
    license: '',
    consultationFee: 0,
    education: [{ degree: '', institution: '', year: new Date().getFullYear(), honors: '' }],
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || '',
        gender: user.gender || '',
        bloodGroup: user.bloodGroup || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }

      // Create a clean update object
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        age: formData.age,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zipCode: formData.address.zipCode.trim(),
          country: formData.address.country.trim()
        }
      };

      await updateProfile(updateData);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!adminReset.email.trim() || !adminReset.newPassword.trim()) {
        throw new Error('Email and new password are required');
      }
      const users = await api.get('/users');
      const target = users.data.find(u => u.email?.toLowerCase() === adminReset.email.toLowerCase());
      if (!target?._id) {
        throw new Error('User not found for the provided email');
      }
      await api.patch(`/users/${target._id}/password`, { newPassword: adminReset.newPassword });
      setSuccess('Password reset successfully');
      setAdminReset({ email: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/departments')
        .then(res => setDepartments(res.data || []))
        .catch(() => {});
    }
  }, [user?.role]);

  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEducationChange = (index, field, value) => {
    setDoctorForm(prev => {
      const education = [...prev.education];
      education[index] = { ...education[index], [field]: value };
      return { ...prev, education };
    });
  };

  const addEducationRow = () => {
    setDoctorForm(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: new Date().getFullYear(), honors: '' }]
    }));
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        name: doctorForm.name.trim(),
        email: doctorForm.email.trim(),
        password: doctorForm.password,
        department: doctorForm.department,
        specialization: doctorForm.specialization.trim(),
        experience: Number(doctorForm.experience),
        license: doctorForm.license.trim(),
        consultationFee: Number(doctorForm.consultationFee),
        education: doctorForm.education.map(ed => ({
          degree: ed.degree.trim(),
          institution: ed.institution.trim(),
          year: Number(ed.year),
          honors: ed.honors?.trim() || ''
        }))
      };
      await api.post('/doctors', payload);
      setSuccess('Doctor created successfully');
      setDoctorForm({
        name: '',
        email: '',
        password: '',
        department: '',
        specialization: '',
        experience: 0,
        license: '',
        consultationFee: 0,
        education: [{ degree: '', institution: '', year: new Date().getFullYear(), honors: '' }],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password fields
    if (!passwordData.currentPassword.trim()) {
      setError('Current password is required');
      return;
    }
    if (!passwordData.newPassword.trim()) {
      setError('New password is required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
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
        Manage your account settings and preferences
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="PROFILE INFORMATION" />
          <Tab label="CHANGE PASSWORD" />
          {user?.role === 'admin' && <Tab label="ADMIN: RESET PASSWORD" />}
          {user?.role === 'admin' && <Tab label="ADMIN: ADD DOCTOR" />}
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {activeTab === 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <form onSubmit={handleProfileSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  type="email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 150 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    label="Gender"
                  >
                    <MenuItem value="">Select Gender</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    label="Blood Group"
                  >
                    <MenuItem value="">Select Blood Group</MenuItem>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
      
      {activeTab === 1 && (
        <Box component="form" onSubmit={handlePasswordSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="currentPassword"
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {user?.role === 'admin' && activeTab === 2 && (
        <Box component="form" onSubmit={handleAdminResetSubmit}>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="User Email"
                name="email"
                value={adminReset.email}
                onChange={(e) => setAdminReset(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={adminReset.newPassword}
                onChange={(e) => setAdminReset(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Updating...' : 'Reset Password'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {user?.role === 'admin' && activeTab === 3 && (
        <Box component="form" onSubmit={handleCreateDoctor}>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" name="name" value={doctorForm.name} onChange={handleDoctorFormChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" name="email" value={doctorForm.email} onChange={handleDoctorFormChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Password" name="password" type="password" value={doctorForm.password} onChange={handleDoctorFormChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  label="Department"
                  name="department"
                  value={doctorForm.department}
                  onChange={handleDoctorFormChange}
                >
                  {departments.map(dep => (
                    <MenuItem key={dep._id} value={dep._id}>{dep.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Specialization" name="specialization" value={doctorForm.specialization} onChange={handleDoctorFormChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Experience (years)" name="experience" type="number" value={doctorForm.experience} onChange={handleDoctorFormChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Consultation Fee" name="consultationFee" type="number" value={doctorForm.consultationFee} onChange={handleDoctorFormChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="License" name="license" value={doctorForm.license} onChange={handleDoctorFormChange} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Education</Typography>
            </Grid>
            {doctorForm.education.map((ed, idx) => (
              <React.Fragment key={idx}>
                <Grid item xs={12} sm={3}>
                  <TextField label="Degree" value={ed.degree} onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Institution" value={ed.institution} onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField label="Year" type="number" value={ed.year} onChange={(e) => handleEducationChange(idx, 'year', e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Honors" value={ed.honors} onChange={(e) => handleEducationChange(idx, 'honors', e.target.value)} fullWidth />
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}>
              <Button onClick={addEducationRow}>Add Education</Button>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : 'Create Doctor'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default Profile; 
