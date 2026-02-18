import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  CircularProgress,
  DialogContentText,
} from "@mui/material";
import Switch from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Autocomplete from "@mui/material/Autocomplete";
import {
  LocalHospital as HospitalIcon,
  Event as EventIcon,
  Person,
  Refresh as RefreshIcon,
  Assignment,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Email as EmailIcon,
  CheckCircle,
  Cancel,
  Visibility,
  DoneAll,
  Reply,
  Delete,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { format, isToday, isFuture } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "primary";
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

const formatAddress = (address) => {
  if (!address) return 'No address';
  if (typeof address === 'string') return address;
  
  const { street, city, state, zipCode, country } = address;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'No address';
};

const AdminDashboard = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    unreadMessages: 0,
  });
  const [doctors, setDoctors] = useState([]);
  const [doctorPage, setDoctorPage] = useState(1);
  const [doctorLimit] = useState(25);
  const [doctorTotalPages, setDoctorTotalPages] = useState(1);
  const [patients, setPatients] = useState([]);
  const [patientPage, setPatientPage] = useState(1);
  const [patientLimit] = useState(25);
  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const [appointments, setAppointments] = useState({
    all: [],
    today: [],
    upcoming: [],
    past: []
  });
  const [appointmentPage] = useState(1);
  const [appointmentLimit] = useState(25);
  const [, setAppointmentTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewAppointmentDialog, setViewAppointmentDialog] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [viewPatientDialog, setViewPatientDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [viewMessageDialog, setViewMessageDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [deptList, setDeptList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [lastCreatedDoctorCreds, setLastCreatedDoctorCreds] = useState(null);
  const [isCreatingDoctor, setIsCreatingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    specialization: '',
    experience: '',
    license: '',
    consultationFee: '',
    education: [{ degree: '', institution: '', year: '' }],
  });
  const [editDoctorDialogOpen, setEditDoctorDialogOpen] = useState(false);
  const [editDoctorData, setEditDoctorData] = useState(null);
  const [editPatientDialogOpen, setEditPatientDialogOpen] = useState(false);
  const [editPatientData, setEditPatientData] = useState(null);

  const calculateUnreadCount = (messages) => {
    return messages.filter(message => message.status === 'unread').length;
  };

  const renderAdminActions = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Reset User/Doctor Password</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                options={usersList.map(u => u.email).filter(Boolean)}
                value={resetEmail}
                onChange={(e, val) => setResetEmail(val || '')}
                onInputChange={(e, val) => setResetEmail(val || '')}
                openOnFocus={false}
                filterOptions={(options, state) => {
                  const input = (state.inputValue || '').toLowerCase();
                  if (!input) return [];
                  return options.filter(opt => opt.toLowerCase().includes(input));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Email" fullWidth />
                )}
                freeSolo
              />
              <TextField
                label="New Password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    setError(null);
                    const res = await api.get('/users');
                    const u = (res.data || []).find(x => x.email?.toLowerCase() === resetEmail.toLowerCase());
                    if (!u) {
                      setError('User not found with that email');
                      return;
                    }
                    await api.patch(`/users/${u._id}/password`, { newPassword: resetPassword });
                    setSuccess('Password reset successfully');
                    setResetEmail('');
                    setResetPassword('');
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to reset password');
                  }
                }}
              >
                Reset Password
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Add Doctor</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  type="password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    value={doctorForm.department}
                    onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                    displayEmpty
                    label="Department"
                    size="small"
                  >
                    <MenuItem value=""><em>Select Department</em></MenuItem>
                    {deptList.map((d) => (
                      <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Specialization"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={doctorForm.experience}
                  onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Consultation Fee"
                  type="number"
                  value={doctorForm.consultationFee}
                  onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="License"
                  value={doctorForm.license}
                  onChange={(e) => setDoctorForm({ ...doctorForm, license: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Education</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {doctorForm.education.map((edu, idx) => (
                    <Grid container spacing={1} key={idx}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Degree"
                          value={edu.degree}
                          onChange={(e) => {
                            const education = [...doctorForm.education];
                            education[idx] = { ...education[idx], degree: e.target.value };
                            setDoctorForm({ ...doctorForm, education });
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Institute"
                          value={edu.institution}
                          onChange={(e) => {
                            const education = [...doctorForm.education];
                            education[idx] = { ...education[idx], institution: e.target.value };
                            setDoctorForm({ ...doctorForm, education });
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Year"
                          value={edu.year}
                          onChange={(e) => {
                            const education = [...doctorForm.education];
                            education[idx] = { ...education[idx], year: e.target.value };
                            setDoctorForm({ ...doctorForm, education });
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Button
                          color="error"
                          onClick={() => {
                            const education = doctorForm.education.filter((_, i) => i !== idx);
                            setDoctorForm({ ...doctorForm, education: education.length ? education : [{ degree: '', institution: '', year: '' }] });
                          }}
                        >
                          Remove
                        </Button>
                      </Grid>
                    </Grid>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setDoctorForm({
                        ...doctorForm,
                      education: [...doctorForm.education, { degree: '', institution: '', year: '' }]
                      });
                    }}
                  >
                    Add Education
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  disabled={isCreatingDoctor}
                  onClick={async () => {
                    try {
                    console.log('Create Doctor: start');
                      setError(null);
                    setSuccess(null);
                    setIsCreatingDoctor(true);
                      if (!doctorForm.department) {
                        setError('Please select a department');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      const emailLower = (doctorForm.email || '').toLowerCase();
                      if (!emailLower || !emailLower.includes('@')) {
                        setError('Please enter a valid email');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      if ((usersList || []).some(u => (u.email || '').toLowerCase() === emailLower)) {
                        setError('Email already exists');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      if (!doctorForm.password || doctorForm.password.length < 6) {
                        setError('Password must be at least 6 characters');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      if (!doctorForm.specialization?.trim()) {
                        setError('Specialization is required');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      if (!doctorForm.license?.trim()) {
                        setError('License is required');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      const expNum = Number(doctorForm.experience || 0);
                      const feeNum = Number(doctorForm.consultationFee || 0);
                      if (isNaN(expNum) || expNum < 0) {
                        setError('Experience must be a non-negative number');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      if (isNaN(feeNum) || feeNum < 0) {
                        setError('Consultation fee must be a non-negative number');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      const hasEducation = Array.isArray(doctorForm.education) && doctorForm.education.length > 0;
                      const firstEdu = hasEducation ? doctorForm.education[0] : null;
                      if (!firstEdu || !firstEdu.degree?.trim() || !firstEdu.institution?.trim() || !String(firstEdu.year).trim()) {
                        setError('Please provide at least one education entry (degree, institute, year)');
                      setIsCreatingDoctor(false);
                        return;
                      }
                      const payload = {
                        name: doctorForm.name,
                        email: doctorForm.email,
                        password: doctorForm.password,
                        department: doctorForm.department,
                        specialization: doctorForm.specialization,
                        experience: expNum,
                        license: doctorForm.license,
                        consultationFee: feeNum,
                        education: doctorForm.education.map(e => ({
                          degree: e.degree,
                          institution: e.institution,
                          year: Number(e.year)
                        }))
                      };
                    console.log('Create Doctor: submitting payload', payload);
                    const res = await api.post('/doctors', payload);
                    console.log('Create Doctor: success', res.data);
                      setSuccess('Doctor account created. They can login with the entered email and password.');
                      enqueueSnackbar('Doctor created successfully', { variant: 'success' });
                      setLastCreatedDoctorCreds({ email: doctorForm.email, password: doctorForm.password });
                      setDoctorForm({
                        name: '',
                        email: '',
                        password: '',
                        department: '',
                        specialization: '',
                        experience: '',
                        license: '',
                        consultationFee: '',
                        education: [{ degree: '', institution: '', year: '' }],
                      });
                      await fetchDashboardData();
                    } catch (err) {
                      const firstValidation = err.response?.data?.errors?.[0]?.msg;
                      const msg = firstValidation || err.response?.data?.message || 'Failed to create doctor';
                      const extra = err.response?.data?.error ? `: ${err.response.data.error}` : '';
                      setError(`${msg}${extra}`);
                      enqueueSnackbar(`${msg}${extra}`, { variant: 'error' });
                    console.error('Create Doctor: error', err.response?.data || err.message);
                  } finally {
                    setIsCreatingDoctor(false);
                    }
                  }}
                >
                  {isCreatingDoctor ? 'Creating…' : 'Create Doctor'}
                </Button>
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}
                {lastCreatedDoctorCreds && (
                  <Button
                    sx={{ ml: 2 }}
                    variant="outlined"
                    color="primary"
                    onClick={async () => {
                      try {
                        await login(lastCreatedDoctorCreds.email, lastCreatedDoctorCreds.password);
                        navigate('/doctor/dashboard');
                      } catch (e) {
                        enqueueSnackbar('Login as doctor failed', { variant: 'error' });
                      }
                    }}
                  >
                    Login as Doctor
                  </Button>
                )}
                {lastCreatedDoctorCreds && (
                  <Button
                    sx={{ ml: 1 }}
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const text = `Doctor Credentials\\nEmail: ${lastCreatedDoctorCreds.email}\\nPassword: ${lastCreatedDoctorCreds.password}`;
                        await navigator.clipboard.writeText(text);
                        enqueueSnackbar('Credentials copied to clipboard', { variant: 'info' });
                      } catch {
                        enqueueSnackbar('Copy failed. Please copy manually.', { variant: 'warning' });
                      }
                    }}
                  >
                    Copy Credentials
                  </Button>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Set token in api instance
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Make API calls in parallel
      const [appointmentsRes, doctorsRes, patientsRes, messagesRes] = await Promise.all([
        api.get('/admin/appointments', { params: { page: appointmentPage, limit: appointmentLimit } }),
        api.get('/admin/doctors', { params: { page: doctorPage, limit: doctorLimit, minimal: true } }),
        api.get('/admin/patients', { params: { page: patientPage, limit: patientLimit } }),
        api.get('/contact')
      ]);

      // Update state with fetched data
      const appointmentItems = appointmentsRes.data?.items || [];
      const doctorItems = doctorsRes.data?.items || [];
      const patientItems = patientsRes.data?.items || [];

      setAppointments({
        today: appointmentItems.filter(app => app.date && isToday(new Date(app.date))),
        upcoming: appointmentItems.filter(app => app.date && isFuture(new Date(app.date))),
        completed: appointmentItems.filter(app => app.status === 'completed'),
        cancelled: appointmentItems.filter(app => app.status === 'cancelled'),
        all: appointmentItems
      });
      setDoctors(doctorItems);
      setPatients(patientItems);
      setMessages(messagesRes.data);
      setUnreadCount(calculateUnreadCount(messagesRes.data));
      setDoctorTotalPages(doctorsRes.data?.totalPages ?? 1);
      setPatientTotalPages(patientsRes.data?.totalPages ?? 1);
      setAppointmentTotalPages(appointmentsRes.data?.totalPages ?? 1);

      // Update stats
      setStats({
        totalDoctors: doctorsRes.data?.total ?? doctorItems.length,
        totalPatients: patientsRes.data?.total ?? patientItems.length,
        totalAppointments: appointmentsRes.data?.total ?? appointmentItems.length,
        completedAppointments: appointmentItems.filter(apt => apt.status === 'completed').length,
        pendingAppointments: appointmentItems.filter(apt => apt.status === 'pending').length,
        cancelledAppointments: appointmentItems.filter(apt => apt.status === 'cancelled').length,
        unreadMessages: calculateUnreadCount(messagesRes.data)
      });

    } catch (error) {
      setError(error.message || 'Failed to fetch dashboard data');
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, doctorPage, patientPage, appointmentPage, doctorLimit, patientLimit, appointmentLimit]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get('/contact');
      const fetchedMessages = response.data;
      setMessages(fetchedMessages);
      setUnreadCount(calculateUnreadCount(fetchedMessages));
    } catch (error) {
      setError('Failed to fetch messages');
    }
  }, []);

  const handleMessageAction = async (messageId, action) => {
    try {
      setError(null);
      if (action === 'delete') {
        await api.delete(`/contact/${messageId}`);
      } else {
        // Update message status
        await api.patch(`/contact/${messageId}`, { status: action });
      }
      
      // Fetch updated messages immediately after action
      await fetchMessages();
      
      setSuccess(`Message ${action === 'delete' ? 'deleted' : 'marked as read'} successfully`);
    } catch (error) {
      console.error('Error updating message:', error);
      setError('Failed to update message');
    }
  };

  const handleReplyMessage = (message) => {
    try {
      const subject = `Re: ${message.subject || 'Inquiry'}`;
      const greeting = message.name ? `Hello ${message.name},\n\n` : '';
      const body = `${greeting}`;
      const mailto = `mailto:${encodeURIComponent(message.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      if (enqueueSnackbar) {
        enqueueSnackbar('Opening email client…', { variant: 'info' });
      }
    } catch (e) {
      setError('Unable to open email client');
    }
  };

  // Check authentication on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      logout();
      navigate('/unauthorized');
      return;
    }
  }, [user, navigate, logout]);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchMessages();
    // Set up polling for new messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/admin/departments');
        setDeptList(res.data || []);
      } catch {
        setDeptList([]);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsersList(res.data || []);
      } catch {
        setUsersList([]);
      }
    };
    fetchUsers();
  }, []);

  const handleDoctorStatusChange = async (doctorId, newStatus) => {
    try {
      await api.put(`/doctors/${doctorId}`, {
        status: newStatus,
      });
      setSuccess(`Doctor status updated to ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      console.error("Doctor status update error:", err);
      setError(err.response?.data?.message || "Failed to update doctor status");
    }
  };

  const handleActivateAllDoctors = async () => {
    try {
      // Update all doctors to active status
      await Promise.all(
        doctors.map((doctor) =>
          api.patch(`/doctors/${doctor._id}/approval`, {
            isApproved: true,
          })
        )
      );

      setSuccess("All doctors have been activated");
      fetchDashboardData();
    } catch (err) {
      setError("Failed to activate all doctors. Please try again.");
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setViewAppointmentDialog(true);
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      await api.patch(`/admin/appointments/${appointmentId}/status`, {
        status: "confirmed",
      });
      setSuccess("Appointment confirmed successfully");
      fetchDashboardData();
    } catch (err) {
      setError("Failed to approve appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await api.patch(`/admin/appointments/${appointmentId}/status`, {
        status: "cancelled",
      });
      setSuccess("Appointment cancelled successfully");
      fetchDashboardData();
    } catch (err) {
      setError("Failed to cancel appointment");
    }
  };

  const categorizeAppointments = (appointmentsData) => {
    const all = appointmentsData.all || [];
    const todayAppointments = all
      .filter(app => app.date && isToday(new Date(app.date)) && app.status === 'pending');
    const upcomingAppointments = all
      .filter(app => app.date && isFuture(new Date(app.date)) && app.status === 'pending');
    const completedAppointments = all
      .filter(app => app.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const cancelledAppointments = all
      .filter(app => app.status === 'cancelled');
    return { todayAppointments, upcomingAppointments, completedAppointments, cancelledAppointments };
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment || !cancellationReason.trim()) return;
    try {
      await api.patch(`/admin/appointments/${selectedAppointment._id}/status`, {
        status: "cancelled",
        reason: cancellationReason,
      });
      setSuccess("Appointment cancelled successfully");
      setOpenCancelDialog(false);
      setCancellationReason("");
      fetchDashboardData();
    } catch (err) {
      setError("Failed to cancel appointment");
    }
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setViewPatientDialog(true);
  };

  const handleViewPatientHistory = async (patientId, isDoctor = false) => {
    try {
      setError(null);
      setPatientHistory(null);
      
      const res = await api.get(`/admin/${isDoctor ? 'doctor' : 'patient'}/${patientId}/history`);
      setPatientHistory(res.data || []);
      setHistoryDialogOpen(true);
    } catch (err) {
      setError('Failed to load history. Please try again.');
    }
  };

  const renderStats = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <HospitalIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Doctors</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {stats.totalDoctors}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Person color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Patients</Typography>
            </Box>
            <Typography variant="h3" color="secondary">
              {stats.totalPatients}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <EventIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Appointments</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {stats.totalAppointments}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveTab(2);
            const el = document.getElementById("completed-appointments");
            if (el) {
              setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Completed</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {stats.completedAppointments}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CancelIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Cancelled</Typography>
            </Box>
            <Typography variant="h3" color="error.main">
              {stats.cancelledAppointments}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveTab(3);
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <EmailIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Unread Messages</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
              {unreadCount}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDoctors = () => (
    <TableContainer component={Paper}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Doctors List</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            sx={{ mr: 2 }}
            onClick={handleActivateAllDoctors}
          >
            Activate All Doctors
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            disabled={doctorPage <= 1}
            onClick={() => setDoctorPage(p => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Typography variant="body2" sx={{ mx: 1 }}>
            {doctorPage} / {doctorTotalPages}
          </Typography>
          <Button
            variant="outlined"
            disabled={doctorPage >= doctorTotalPages}
            onClick={() => setDoctorPage(p => Math.min(doctorTotalPages, p + 1))}
          >
            Next
          </Button>
        </Box>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Specialization</TableCell>
            <TableCell>Experience</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {doctors && doctors.length > 0 ? (
            doctors.map((doctor) => {
              const user = doctor.user || doctor.userId || {};
              const departmentName =
                doctor.department?.name ||
                (typeof doctor.department === "string"
                  ? doctor.department
                  : "N/A");
              return (
                <TableRow key={doctor._id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar sx={{ mr: 2 }}>
                        {user.name ? user.name[0] : "D"}
                      </Avatar>
                      {user.name || "Unknown Doctor"}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email || "N/A"}</TableCell>
                  <TableCell>{departmentName}</TableCell>
                  <TableCell>{doctor.specialization || "N/A"}</TableCell>
                  <TableCell>
                    {doctor.experience ? `${doctor.experience} years` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={doctor.isApproved ? "active" : "pending"}
                        onChange={(e) =>
                          handleDoctorStatusChange(doctor._id, e.target.value)
                        }
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View History">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewPatientHistory(doctor._id, true)}
                      >
                        <Assignment />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Profile">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const user = doctor.user || doctor.userId || {};
                          const address = typeof user.address === 'object' ? user.address : { street: (typeof user.address === 'string' ? user.address : ''), city: '', state: '', zipCode: '', country: '' };
                          const byDay = new Map((Array.isArray(doctor.availability) ? doctor.availability : []).map(a => [a.dayOfWeek, a]));
                          const ensured = Array.from({ length: 7 }, (_, d) => byDay.get(d) || { dayOfWeek: d, startTime: '09:00', endTime: '17:00', isAvailable: true });
                          setEditDoctorData({
                            id: doctor._id,
                            userId: user._id || doctor.userId?._id || undefined,
                            userName: user.name || '',
                            userEmail: user.email || '',
                            userPhone: user.phone || '',
                            userAge: user.age || '',
                            userGender: user.gender || '',
                            userBloodGroup: user.bloodGroup || '',
                            userStreet: address.street || '',
                            userCity: address.city || '',
                            userState: address.state || '',
                            userZipCode: address.zipCode || '',
                            userCountry: address.country || '',
                            specialization: doctor.specialization || '',
                            experience: doctor.experience || 0,
                            consultationFee: doctor.consultationFee || 0,
                            license: doctor.license || '',
                            department: typeof doctor.department === 'string' ? doctor.department : doctor.department?._id || '',
                            emergencyAvailable: !!doctor.emergencyAvailable,
                            availability: ensured
                          });
                          setEditDoctorDialogOpen(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body1" color="textSecondary">
                  No doctors found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPatients = () => {
    if (!patients.length) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No patients found
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            disabled={patientPage <= 1}
            onClick={() => setPatientPage(p => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Typography variant="body2" sx={{ mx: 1 }}>
            {patientPage} / {patientTotalPages}
          </Typography>
          <Button
            variant="outlined"
            disabled={patientPage >= patientTotalPages}
            onClick={() => setPatientPage(p => Math.min(patientTotalPages, p + 1))}
          >
            Next
          </Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Blood Group</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2 }}>
                      {patient.name?.charAt(0) || 'P'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {patient.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {patient.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {patient.phone || 'No phone'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatAddress(patient.address)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {patient.age || 'N/A'}
                </TableCell>
                <TableCell>
                  {patient.bloodGroup || 'N/A'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewPatient(patient)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View History">
                      <IconButton
                        size="small"
                        onClick={() => handleViewPatientHistory(patient._id)}
                        color="primary"
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Profile">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditPatientData({
                            id: patient._id,
                            name: patient.name || '',
                            phone: patient.phone || '',
                            age: patient.age || '',
                            gender: patient.gender || '',
                            bloodGroup: patient.bloodGroup || '',
                            street: typeof patient.address === 'object' ? (patient.address.street || '') : (typeof patient.address === 'string' ? patient.address : ''),
                            city: typeof patient.address === 'object' ? (patient.address.city || '') : '',
                            state: typeof patient.address === 'object' ? (patient.address.state || '') : '',
                            zipCode: typeof patient.address === 'object' ? (patient.address.zipCode || '') : '',
                            country: typeof patient.address === 'object' ? (patient.address.country || '') : ''
                          });
                          setEditPatientDialogOpen(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderAppointmentActions = (appointment) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {appointment.status === 'pending' && (
        <>
          <Tooltip title="Approve Appointment">
            <IconButton
              size="small"
              color="success"
              onClick={() => handleApproveAppointment(appointment._id)}
            >
              <CheckCircle />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deny Appointment">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleCancelAppointment(appointment._id)}
            >
              <Cancel />
            </IconButton>
          </Tooltip>
        </>
      )}
      <Tooltip title="View Details">
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleViewAppointment(appointment)}
        >
          <Assignment />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderAppointments = () => {
    const categorizedAppointments = categorizeAppointments(appointments);
    
    return (
    <Box>
      {/* Today's Appointments */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Today&apos;s Appointments
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorizedAppointments.todayAppointments.length > 0 ? (
              categorizedAppointments.todayAppointments.map((appointment) => (
                <TableRow key={appointment._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.patientId?.name?.charAt(0) || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.patientId?.name || 'Unknown Patient'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.patientId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.doctorId?.name?.charAt(0) || appointment.doctorId?.userId?.name?.charAt(0) || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.doctorId?.name || appointment.doctorId?.userId?.name || 'Unknown Doctor'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.doctorId?.email || appointment.doctorId?.userId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{appointment.doctorId?.department?.name || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(appointment.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{appointment.timeSlot}</TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {renderAppointmentActions(appointment)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No appointments found for today
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upcoming Appointments */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Upcoming Appointments
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorizedAppointments.upcomingAppointments.length > 0 ? (
              categorizedAppointments.upcomingAppointments.map((appointment) => (
                <TableRow key={appointment._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.patientId?.name?.charAt(0) || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.patientId?.name || 'Unknown Patient'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.patientId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.doctorId?.name?.charAt(0) || appointment.doctorId?.userId?.name?.charAt(0) || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.doctorId?.name || appointment.doctorId?.userId?.name || 'Unknown Doctor'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.doctorId?.email || appointment.doctorId?.userId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{appointment.doctorId?.department?.name || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(appointment.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{appointment.timeSlot}</TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {renderAppointmentActions(appointment)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No upcoming appointments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Completed Appointments */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }} id="completed-appointments">
        Completed Appointments
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorizedAppointments.completedAppointments.length > 0 ? (
              categorizedAppointments.completedAppointments.map((appointment) => (
                <TableRow key={appointment._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.patientId?.name?.charAt(0) || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.patientId?.name || 'Unknown Patient'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.patientId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.doctorId?.name?.charAt(0) || appointment.doctorId?.userId?.name?.charAt(0) || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.doctorId?.name || appointment.doctorId?.userId?.name || 'Unknown Doctor'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.doctorId?.email || appointment.doctorId?.userId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{appointment.doctorId?.department?.name || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(appointment.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{appointment.timeSlot}</TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewAppointment(appointment)}
                      color="primary"
                    >
                      <Assignment />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No completed appointments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Cancelled Appointments */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }} id="cancelled-appointments">
        Cancelled Appointments
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorizedAppointments.cancelledAppointments.length > 0 ? (
              categorizedAppointments.cancelledAppointments.map((appointment) => (
                <TableRow key={appointment._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.patientId?.name?.charAt(0) || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.patientId?.name || 'Unknown Patient'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.patientId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1 }}>
                        {appointment.doctorId?.name?.charAt(0) || appointment.doctorId?.userId?.name?.charAt(0) || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {appointment.doctorId?.name || appointment.doctorId?.userId?.name || 'Unknown Doctor'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.doctorId?.email || appointment.doctorId?.userId?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{appointment.doctorId?.department?.name || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(appointment.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{appointment.timeSlot}</TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewAppointment(appointment)}
                        color="primary"
                      >
                        <Assignment />
                      </IconButton>
                      {(() => {
                        const aptDate = new Date(appointment.date);
                        aptDate.setHours(0,0,0,0);
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const canRevert = aptDate >= today;
                        return canRevert ? (
                          <Tooltip title="Revert to Confirmed">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={async () => {
                                try {
                                  await api.patch(`/admin/appointments/${appointment._id}/status`, { status: 'confirmed' });
                                  setSuccess('Appointment reverted to confirmed');
                                  fetchDashboardData();
                                } catch (err) {
                                  setError('Failed to revert appointment');
                                }
                              }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        ) : null;
                      })()}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No cancelled appointments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    );
  };

  const renderAppointmentDialog = () => (
    <Dialog
      open={viewAppointmentDialog}
      onClose={() => setViewAppointmentDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Appointment Details</Typography>
          <IconButton onClick={() => setViewAppointmentDialog(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedAppointment && (
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Patient Information
                </Typography>
                <Typography>
                  Name: {selectedAppointment.patientId?.name || "N/A"}
                </Typography>
                <Typography>
                  Email: {selectedAppointment.patientId?.email || "N/A"}
                </Typography>
                <Typography>
                  Phone: {selectedAppointment.patientId?.phone || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Doctor Information
                </Typography>
                <Typography>
                  Name: {selectedAppointment.doctorId?.name || selectedAppointment.doctorId?.userId?.name || "N/A"}
                </Typography>
                <Typography>
                  Department: {selectedAppointment.doctorId?.department?.name || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Appointment Details
                </Typography>
                <Typography>Date: {format(new Date(selectedAppointment.date), 'PP')}</Typography>
                <Typography>Time: {selectedAppointment.timeSlot}</Typography>
                <Typography>Status: {selectedAppointment.status}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenCancelDialog(true)} color="error">
          Cancel Appointment
        </Button>
        <Button onClick={() => setViewAppointmentDialog(false)} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderViewPatientDialog = () => (
    <Dialog
      open={viewPatientDialog}
      onClose={() => setViewPatientDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Patient Details</Typography>
          <IconButton onClick={() => setViewPatientDialog(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedPatient && (
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Personal Information
                </Typography>
                <Typography>Name: {selectedPatient.name}</Typography>
                <Typography>Email: {selectedPatient.email}</Typography>
                <Typography>Phone: {selectedPatient.phone || "N/A"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Medical Information
                </Typography>
                <Typography>Age: {selectedPatient.age || "N/A"}</Typography>
                <Typography>
                  Blood Group: {selectedPatient.bloodGroup || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewPatientDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderHistoryDialog = () => (
  <Dialog
    open={historyDialogOpen}
    onClose={() => setHistoryDialogOpen(false)}
    maxWidth="md"
    fullWidth
    fullScreen={fullScreen}
  >
    <DialogTitle>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">History Details</Typography>
        <IconButton onClick={() => setHistoryDialogOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent>
      {patientHistory && patientHistory.length > 0 ? (
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {patientHistory.map((history, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Appointment #{index + 1}
                      </Typography>
                      <Typography>
                        Date: {format(new Date(history.date), 'PP')}
                      </Typography>
                      <Typography>
                        Status: {history.status}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Participants
                      </Typography>
                      <Typography>
                        Doctor: {history.doctorId?.name || history.doctorId?.userId?.name || 'N/A'}
                      </Typography>
                      <Typography>
                        Patient: {history.patientId?.name || 'N/A'}
                      </Typography>
                      <Typography>
                        Department: {history.doctorId?.department?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    {history.notes && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">Notes</Typography>
                        <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                          <Typography>{history.notes}</Typography>
                        </Paper>
                      </Grid>
                    )}
                    {history.prescription && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Prescription
                        </Typography>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <Typography>
                              Diagnosis: {history.prescription.diagnosis || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography>
                              Created: {format(new Date(history.prescription.createdAt), 'PP')}
                            </Typography>
                          </Grid>
                          {Array.isArray(history.prescription.medications) && history.prescription.medications.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2">Medications</Typography>
                              <Box sx={{ mt: 1 }}>
                                {history.prescription.medications.map((m, i) => (
                                  <Paper key={i} variant="outlined" sx={{ p: 1, mb: 1 }}>
                                    <Typography>
                                      {m.name} — {m.dosage}, {m.frequency}, {m.duration}
                                    </Typography>
                                  </Paper>
                                ))}
                              </Box>
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            <Button
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => {
                                setSelectedPrescription(history.prescription);
                                setPrescriptionDialogOpen(true);
                              }}
                            >
                              View Full Prescription
                            </Button>
                          </Grid>
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Typography align="center" color="textSecondary">
            No history available
          </Typography>
        </Paper>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
    </DialogActions>
  </Dialog>
);

const renderPrescriptionDialog = () => (
  <Dialog
    open={prescriptionDialogOpen}
    onClose={() => setPrescriptionDialogOpen(false)}
    maxWidth="md"
    fullWidth
    fullScreen={fullScreen}
  >
    <DialogTitle>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Prescription Details</Typography>
        <IconButton onClick={() => setPrescriptionDialogOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent>
      {selectedPrescription && (
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Patient Information
              </Typography>
              <Typography>
                Name: {selectedPrescription.patientId?.name || "N/A"}
              </Typography>
              <Typography>
                Email: {selectedPrescription.patientId?.email || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Doctor Information
              </Typography>
              <Typography>
                Name: {selectedPrescription.doctorId?.userId?.name || "N/A"}
              </Typography>
              <Typography>
                Department:{" "}
                {selectedPrescription.doctorId?.department?.name || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold">
                Prescription Details
              </Typography>
              <Typography>
                Date:{" "}
                {new Date(
                  selectedPrescription.createdAt
                ).toLocaleDateString()}
              </Typography>
              <Typography>
                Diagnosis: {selectedPrescription.diagnosis}
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mt: 2 }}
              >
                Medicines
              </Typography>
              {selectedPrescription.medicines.map((medicine, index) => (
                <Box key={index} sx={{ ml: 2, mb: 1 }}>
                  <Typography>
                    {medicine.name} - {medicine.dosage}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Frequency: {medicine.frequency}, Duration:{" "}
                    {medicine.duration}
                  </Typography>
                </Box>
              ))}
              {selectedPrescription.tests &&
                selectedPrescription.tests.length > 0 && (
                  <>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mt: 2 }}
                    >
                      Tests
                    </Typography>
                    {selectedPrescription.tests.map((test, index) => (
                      <Typography key={index} sx={{ ml: 2 }}>
                        {test}
                      </Typography>
                    ))}
                  </>
                )}
              {selectedPrescription.notes && (
                <>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mt: 2 }}
                  >
                    Notes
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-line" }}>
                    {selectedPrescription.notes}
                  </Typography>
                </>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setPrescriptionDialogOpen(false)}>
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

const renderMessages = () => {
  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map((message) => (
              <TableRow 
                key={message._id}
                sx={{ 
                  bgcolor: message.status === 'unread' ? 'action.hover' : 'inherit',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <TableCell>
                  {new Date(message.createdAt).toLocaleDateString()}<br />
                  <Typography variant="caption" color="textSecondary">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>{message.name}</TableCell>
                <TableCell>{message.email}</TableCell>
                <TableCell>{message.subject}</TableCell>
                <TableCell>
                  <Tooltip title={message.message}>
                    <Typography>
                      {message.message.length > 50 
                        ? `${message.message.substring(0, 50)}...` 
                        : message.message}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={message.status}
                    color={message.status === 'unread' ? 'error' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {message.status === 'unread' && (
                      <Tooltip title="Mark as Read">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleMessageAction(message._id, 'read')}
                        >
                          <DoneAll />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => {
                          setSelectedMessage(message);
                          setViewMessageDialog(true);
                          if (message.status === 'unread') {
                            handleMessageAction(message._id, 'read');
                          }
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reply">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleReplyMessage(message)}
                      >
                        <Reply />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleMessageAction(message._id, 'delete')}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Message Dialog */}
      <Dialog
        open={viewMessageDialog}
        onClose={() => setViewMessageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Message Details</Typography>
            <IconButton onClick={() => setViewMessageDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">From</Typography>
                <Typography variant="body1">{selectedMessage.name} ({selectedMessage.email})</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Subject</Typography>
                <Typography variant="body1">{selectedMessage.subject}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Message</Typography>
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.message}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Received</Typography>
                <Typography variant="body1">
                  {format(new Date(selectedMessage.createdAt), 'PPpp')}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewMessageDialog(false)}>Close</Button>
          {selectedMessage && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Reply />}
              onClick={() => handleReplyMessage(selectedMessage)}
            >
              Reply
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

if (loading) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
    >
      <CircularProgress />
    </Box>
  );
}

return (
  <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
    </Box>

    {renderStats()}

    <Paper sx={{ mb: 4 }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Doctors" />
        <Tab label="Patients" />
        <Tab label="Appointments" />
        <Tab 
          label={`Messages ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
          sx={{ 
            color: unreadCount > 0 ? 'error.main' : 'inherit',
            fontWeight: unreadCount > 0 ? 'bold' : 'normal'
          }}
        />
        <Tab label="Admin Actions" />
      </Tabs>
      <Box sx={{ p: 2 }}>
        {activeTab === 0 && renderDoctors()}
        {activeTab === 1 && renderPatients()}
        {activeTab === 2 && renderAppointments()}
        {activeTab === 3 && renderMessages()}
        {activeTab === 4 && renderAdminActions()}
      </Box>
    </Paper>

    {renderViewPatientDialog()}
    {renderAppointmentDialog()}
    {renderHistoryDialog()}
    {renderPrescriptionDialog()}

    <Dialog open={editDoctorDialogOpen} onClose={() => setEditDoctorDialogOpen(false)} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Edit Doctor Profile</DialogTitle>
      <DialogContent>
        {editDoctorData && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Personal Information</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Name" fullWidth value={editDoctorData.userName} onChange={(e) => setEditDoctorData({ ...editDoctorData, userName: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Email" type="email" fullWidth value={editDoctorData.userEmail} onChange={(e) => setEditDoctorData({ ...editDoctorData, userEmail: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Phone" fullWidth value={editDoctorData.userPhone} onChange={(e) => setEditDoctorData({ ...editDoctorData, userPhone: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Age" type="number" fullWidth value={editDoctorData.userAge} onChange={(e) => setEditDoctorData({ ...editDoctorData, userAge: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  label="Gender"
                  value={editDoctorData.userGender}
                  onChange={(e) => setEditDoctorData({ ...editDoctorData, userGender: e.target.value })}
                >
                  <MenuItem value=""><em>Select Gender</em></MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="blood-group-label">Blood Group</InputLabel>
                <Select
                  labelId="blood-group-label"
                  label="Blood Group"
                  value={editDoctorData.userBloodGroup}
                  onChange={(e) => setEditDoctorData({ ...editDoctorData, userBloodGroup: e.target.value })}
                >
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => (
                    <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Address</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Street" fullWidth value={editDoctorData.userStreet} onChange={(e) => setEditDoctorData({ ...editDoctorData, userStreet: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="City" fullWidth value={editDoctorData.userCity} onChange={(e) => setEditDoctorData({ ...editDoctorData, userCity: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="State" fullWidth value={editDoctorData.userState} onChange={(e) => setEditDoctorData({ ...editDoctorData, userState: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Zip Code" fullWidth value={editDoctorData.userZipCode} onChange={(e) => setEditDoctorData({ ...editDoctorData, userZipCode: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Country" fullWidth value={editDoctorData.userCountry} onChange={(e) => setEditDoctorData({ ...editDoctorData, userCountry: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Professional Information</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="edit-department-label">Department</InputLabel>
                <Select
                  labelId="edit-department-label"
                  label="Department"
                  value={editDoctorData.department}
                  onChange={(e) => setEditDoctorData({ ...editDoctorData, department: e.target.value })}
                >
                  <MenuItem value=""><em>Select Department</em></MenuItem>
                  {deptList.map((d) => (
                    <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Specialization" fullWidth value={editDoctorData.specialization} onChange={(e) => setEditDoctorData({ ...editDoctorData, specialization: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Experience (years)" type="number" fullWidth value={editDoctorData.experience} onChange={(e) => setEditDoctorData({ ...editDoctorData, experience: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Consultation Fee" type="number" fullWidth value={editDoctorData.consultationFee} onChange={(e) => setEditDoctorData({ ...editDoctorData, consultationFee: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="License" fullWidth value={editDoctorData.license} onChange={(e) => setEditDoctorData({ ...editDoctorData, license: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Emergency & Availability</Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch checked={!!editDoctorData.emergencyAvailable} onChange={(e) => setEditDoctorData({ ...editDoctorData, emergencyAvailable: e.target.checked })} />
                <Typography>Emergency Available</Typography>
              </Box>
            </Grid>
            {Array.isArray(editDoctorData.availability) && editDoctorData.availability.map((av, idx) => {
              const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
              return (
                <Grid container key={idx} spacing={1} sx={{ px: 2, mb: 1 }}>
                  <Grid item xs={12} md={3}>
                    <Typography>{names[av.dayOfWeek]}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Start"
                      type="time"
                      fullWidth
                      value={av.startTime}
                      onChange={(e) => {
                        const next = [...editDoctorData.availability];
                        next[idx] = { ...next[idx], startTime: e.target.value };
                        setEditDoctorData({ ...editDoctorData, availability: next });
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="End"
                      type="time"
                      fullWidth
                      value={av.endTime}
                      onChange={(e) => {
                        const next = [...editDoctorData.availability];
                        next[idx] = { ...next[idx], endTime: e.target.value };
                        setEditDoctorData({ ...editDoctorData, availability: next });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        checked={!!av.isAvailable}
                        onChange={(e) => {
                          const next = [...editDoctorData.availability];
                          next[idx] = { ...next[idx], isAvailable: e.target.checked };
                          setEditDoctorData({ ...editDoctorData, availability: next });
                        }}
                      />
                      <Typography>Available</Typography>
                    </Box>
                  </Grid>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDoctorDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={async () => {
          try {
            await api.put(`/doctors/${editDoctorData.id}/profile`, {
              specialization: editDoctorData.specialization,
              experience: Number(editDoctorData.experience),
              consultationFee: Number(editDoctorData.consultationFee),
              license: editDoctorData.license,
              department: editDoctorData.department || undefined,
              emergencyAvailable: !!editDoctorData.emergencyAvailable,
              availability: editDoctorData.availability,
              userId: {
                name: editDoctorData.userName,
                email: editDoctorData.userEmail,
                phone: editDoctorData.userPhone,
                age: editDoctorData.userAge ? Number(editDoctorData.userAge) : undefined,
                gender: editDoctorData.userGender || undefined,
                bloodGroup: editDoctorData.userBloodGroup || undefined,
                address: {
                  street: editDoctorData.userStreet || '',
                  city: editDoctorData.userCity || '',
                  state: editDoctorData.userState || '',
                  zipCode: editDoctorData.userZipCode || '',
                  country: editDoctorData.userCountry || ''
                }
              }
            });
            setSuccess('Doctor profile updated');
            setEditDoctorDialogOpen(false);
            await fetchDashboardData();
          } catch (err) {
            setError(err.response?.data?.message || 'Failed to update doctor profile');
          }
        }}>Save</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={editPatientDialogOpen} onClose={() => setEditPatientDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Edit Patient Profile</DialogTitle>
      <DialogContent>
        {editPatientData && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label="Name" fullWidth value={editPatientData.name} onChange={(e) => setEditPatientData({ ...editPatientData, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Phone" fullWidth value={editPatientData.phone} onChange={(e) => setEditPatientData({ ...editPatientData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Age" type="number" fullWidth value={editPatientData.age} onChange={(e) => setEditPatientData({ ...editPatientData, age: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Blood Group" fullWidth value={editPatientData.bloodGroup} onChange={(e) => setEditPatientData({ ...editPatientData, bloodGroup: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="patient-gender-label">Gender</InputLabel>
                <Select
                  labelId="patient-gender-label"
                  label="Gender"
                  value={editPatientData.gender}
                  onChange={(e) => setEditPatientData({ ...editPatientData, gender: e.target.value })}
                >
                  <MenuItem value=""><em>Select Gender</em></MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Address</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Street" fullWidth value={editPatientData.street} onChange={(e) => setEditPatientData({ ...editPatientData, street: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="City" fullWidth value={editPatientData.city} onChange={(e) => setEditPatientData({ ...editPatientData, city: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="State" fullWidth value={editPatientData.state} onChange={(e) => setEditPatientData({ ...editPatientData, state: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Zip Code" fullWidth value={editPatientData.zipCode} onChange={(e) => setEditPatientData({ ...editPatientData, zipCode: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Country" fullWidth value={editPatientData.country} onChange={(e) => setEditPatientData({ ...editPatientData, country: e.target.value })} />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditPatientDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={async () => {
          try {
            await api.put(`/users/${editPatientData.id}/profile`, {
              name: editPatientData.name,
              phone: editPatientData.phone,
              age: Number(editPatientData.age),
              bloodGroup: editPatientData.bloodGroup,
              gender: editPatientData.gender || undefined,
              address: {
                street: editPatientData.street || '',
                city: editPatientData.city || '',
                state: editPatientData.state || '',
                zipCode: editPatientData.zipCode || '',
                country: editPatientData.country || ''
              }
            });
            setSuccess('Patient profile updated');
            setEditPatientDialogOpen(false);
            await fetchDashboardData();
          } catch (err) {
            setError(err.response?.data?.message || 'Failed to update patient profile');
          }
        }}>Save</Button>
      </DialogActions>
    </Dialog>

    <Dialog
      open={openCancelDialog}
      onClose={() => setOpenCancelDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Cancel Appointment</Typography>
          <IconButton onClick={() => setOpenCancelDialog(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please provide a reason for cancelling this appointment.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Cancellation Reason"
          fullWidth
          multiline
          rows={3}
          value={cancellationReason}
          onChange={(e) => setCancellationReason(e.target.value)}
          error={!cancellationReason.trim()}
          helperText={!cancellationReason.trim() ? 'Reason is required' : ''}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenCancelDialog(false)}>Cancel</Button>
        <Button 
          onClick={handleConfirmCancel} 
          color="error" 
          variant="contained"
          disabled={!cancellationReason.trim() || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
  </Container>
);
}

export default AdminDashboard;
