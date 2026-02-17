import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Alert,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Assignment,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalPrescriptions: 0
  });
  const [appointments, setAppointments] = useState({
    today: [],
    upcoming: [],
    completed: [],
    cancelled: [],
    all: []
  });
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    tests: [],
    notes: '',
    followUpDate: ''
  });
 
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
 

  // Session timeout handling
  useEffect(() => {
    let inactivityTimer;
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
        navigate('/login');
      }, SESSION_TIMEOUT);
    };

    // Reset timer on user activity
    const handleUserActivity = () => {
      resetTimer();
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [logout, navigate]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First get the doctor's appointments
      const appointmentsRes = await api.get('/doctors/appointments');
      const allAppointments = appointmentsRes.data || [];
      
      // Process appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedAppointments = {
        today: [],
        upcoming: [],
        completed: [],
        cancelled: [],
        all: allAppointments
      };

      allAppointments.forEach(app => {
        const appDate = new Date(app.date);
        appDate.setHours(0, 0, 0, 0);

        if (app.status === 'completed') {
          processedAppointments.completed.push(app);
        } else if (app.status === 'cancelled') {
          processedAppointments.cancelled.push(app);
        } else if (appDate.getTime() === today.getTime()) {
          processedAppointments.today.push(app);
        } else if (appDate.getTime() > today.getTime()) {
          processedAppointments.upcoming.push(app);
        }
      });

      // Update appointments state
      setAppointments(processedAppointments);

      // Update stats
      setStats({
        totalAppointments: allAppointments.length,
        todayAppointments: processedAppointments.today.length,
        upcomingAppointments: processedAppointments.upcoming.length,
        completedAppointments: processedAppointments.completed.length,
        cancelledAppointments: processedAppointments.cancelled.length,
        totalPrescriptions: 0 // Set to 0 if prescriptions fetch fails
      });

      try {
        const prescriptionsRes = await api.get('/prescription/doctor');
        setPrescriptions(prescriptionsRes.data || []);
      } catch {
        setPrescriptions([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }

      // Set default states on error
      setAppointments({
        today: [],
        upcoming: [],
        completed: [],
        cancelled: [],
        all: []
      });
      setStats({
        totalAppointments: 0,
        todayAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalPrescriptions: 0
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const AppointmentDetailsDialog = ({ open, onClose, appointment }) => {
    if (!appointment) return null;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Appointment Details</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Patient Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong> {appointment.patientId?.name || 'Not Available'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {appointment.patientId?.email || 'Not Available'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Phone:</strong> {appointment.patientId?.phone || 'Not Available'}
                </Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
              Appointment Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Date:</strong> {format(new Date(appointment.date), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Time:</strong> {appointment.timeSlot}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Type:</strong> {appointment.type || 'General Checkup'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Symptoms:</strong> {appointment.symptoms || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Notes:</strong> {appointment.notes || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderAppointmentsTable = (appointmentsList) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appointmentsList.map((appointment) => (
            <TableRow key={appointment._id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 1 }}>
                    {appointment.patientId?.name?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography>{appointment.patientId?.name || 'Not Available'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {appointment.patientId?.email || ''}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{format(new Date(appointment.date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{appointment.timeSlot}</TableCell>
              <TableCell>
                <Chip
                  label={appointment.status || 'pending'}
                  color={getStatusColor(appointment.status || 'pending')}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton onClick={() => setSelectedAppointment(appointment)}>
                    <Assignment />
                  </IconButton>
                </Tooltip>
                {appointment.status !== 'completed' && (
                  <Tooltip title="Complete">
                    <IconButton color="success" onClick={() => {
                      setSelectedAppointment(appointment);
                      setCompleteDialogOpen(true);
                    }}>
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {appointment.status !== 'cancelled' && (
                  <Tooltip title="Cancel">
                    <IconButton
                      color="error"
                      onClick={async () => {
                        try {
                          await api.patch(`/doctors/appointments/${appointment._id}/status`, { status: 'cancelled' });
                          setSuccess('Appointment cancelled');
                          fetchDashboardData();
                        } catch (err) {
                          setError('Failed to cancel appointment');
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Doctor Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Overview of your appointments and patient interactions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Appointments</Typography>
              <Typography variant="h5">{stats.totalAppointments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Today&apos;s</Typography>
              <Typography variant="h5">{stats.todayAppointments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Upcoming</Typography>
              <Typography variant="h5">{stats.upcomingAppointments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Completed</Typography>
              <Typography variant="h5">{stats.completedAppointments}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Today's" />
        <Tab label="Upcoming" />
        <Tab label="Completed" />
        <Tab label="Cancelled" />
        <Tab label="All" />
      </Tabs>

      {activeTab === 0 && renderAppointmentsTable(appointments.today)}
      {activeTab === 1 && renderAppointmentsTable(appointments.upcoming)}
      {activeTab === 2 && (
        <>
          {renderAppointmentsTable(appointments.completed)}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Completed Prescriptions
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Diagnosis</TableCell>
                    <TableCell>Medicines</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptions.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        {p.createdAt ? format(new Date(p.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {p.patientId?.name || 'Unknown Patient'}
                      </TableCell>
                      <TableCell>{p.diagnosis || 'N/A'}</TableCell>
                      <TableCell>
                        {(p.medicines || []).map((m, idx) => (
                          <Box key={idx}>
                            {m.name} - {m.dosage} ({m.frequency}, {m.duration})
                          </Box>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {prescriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No prescriptions
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
      {activeTab === 3 && renderAppointmentsTable(appointments.cancelled)}
      {activeTab === 4 && renderAppointmentsTable(appointments.all)}

      <AppointmentDetailsDialog
        open={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />

      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Complete Appointment</Typography>
            <IconButton onClick={() => setCompleteDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Prescription is optional. You can complete without adding one.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Diagnosis"
                fullWidth
                value={prescriptionData.diagnosis}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
              />
            </Grid>
            {prescriptionData.medicines.map((m, idx) => (
              <Grid container spacing={1} key={idx} sx={{ px: 2, mt: 1 }}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Medicine"
                    fullWidth
                    value={m.name}
                    onChange={(e) => {
                      const medicines = [...prescriptionData.medicines];
                      medicines[idx] = { ...medicines[idx], name: e.target.value };
                      setPrescriptionData({ ...prescriptionData, medicines });
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Dosage"
                    fullWidth
                    value={m.dosage}
                    onChange={(e) => {
                      const medicines = [...prescriptionData.medicines];
                      medicines[idx] = { ...medicines[idx], dosage: e.target.value };
                      setPrescriptionData({ ...prescriptionData, medicines });
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Frequency"
                    fullWidth
                    value={m.frequency}
                    onChange={(e) => {
                      const medicines = [...prescriptionData.medicines];
                      medicines[idx] = { ...medicines[idx], frequency: e.target.value };
                      setPrescriptionData({ ...prescriptionData, medicines });
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Duration"
                    fullWidth
                    value={m.duration}
                    onChange={(e) => {
                      const medicines = [...prescriptionData.medicines];
                      medicines[idx] = { ...medicines[idx], duration: e.target.value };
                      setPrescriptionData({ ...prescriptionData, medicines });
                    }}
                  />
                </Grid>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setPrescriptionData({
                    ...prescriptionData,
                    medicines: [...prescriptionData.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
                  })}
                >
                  Add Medicine
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={prescriptionData.medicines.length <= 1}
                  onClick={() => setPrescriptionData({
                    ...prescriptionData,
                    medicines: prescriptionData.medicines.slice(0, -1)
                  })}
                >
                  Remove Last
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tests (comma separated)"
                fullWidth
                value={prescriptionData.tests.join(', ')}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, tests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                minRows={2}
                value={prescriptionData.notes}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Follow-up Date (YYYY-MM-DD)"
                fullWidth
                value={prescriptionData.followUpDate}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, followUpDate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                if (!selectedAppointment) return;
                await api.patch(`/doctors/appointments/${selectedAppointment._id}/complete`);
                setSuccess('Appointment completed without prescription');
                setCompleteDialogOpen(false);
                setPrescriptionData({
                  diagnosis: '',
                  medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
                  tests: [],
                  notes: '',
                  followUpDate: ''
                });
                fetchDashboardData();
              } catch (err) {
                setError('Failed to complete appointment');
              }
            }}
          >
            Complete Without Prescription
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (!selectedAppointment) return;
                const payload = { prescription: prescriptionData };
                await api.patch(`/doctors/appointments/${selectedAppointment._id}/complete`, payload);
                setSuccess('Appointment completed with prescription');
                setCompleteDialogOpen(false);
                setPrescriptionData({
                  diagnosis: '',
                  medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
                  tests: [],
                  notes: '',
                  followUpDate: ''
                });
                fetchDashboardData();
              } catch (err) {
                setError('Failed to create prescription and complete appointment');
              }
            }}
          >
            Complete With Prescription
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
