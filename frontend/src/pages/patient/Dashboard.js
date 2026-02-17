import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  LocalHospital,
  History,
  Assignment,
  Close,
  Event,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request details for debugging
    console.log('Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Log error response
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [success, setSuccess] = useState(null);
  const [viewAppointmentDialog, setViewAppointmentDialog] = useState(false);
  const [selectedViewAppointment, setSelectedViewAppointment] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?._id) {
          throw new Error('User ID not found');
        }

        // Fetch appointments with proper population
        const appointmentsRes = await api.get('/api/patients/appointments');

        // Fetch prescriptions with proper endpoint
        const prescriptionsRes = await api.get('/api/patients/prescriptions');

        console.log('Appointments data:', appointmentsRes.data);
        console.log('Prescriptions data:', prescriptionsRes.data);

        if (Array.isArray(appointmentsRes.data)) {
          setAppointments(appointmentsRes.data);
        } else {
          console.error('Invalid appointments data format:', appointmentsRes.data);
          throw new Error('Invalid appointments data received');
        }

        if (Array.isArray(prescriptionsRes.data)) {
          setPrescriptions(prescriptionsRes.data);
        } else {
          console.error('Invalid prescriptions data format:', prescriptionsRes.data);
          throw new Error('Invalid prescriptions data received');
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchDashboardData();
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setPrescriptionDialogOpen(true);
  };

  const handleClosePrescriptionDialog = () => {
    setPrescriptionDialogOpen(false);
    setSelectedPrescription(null);
  };

  const handleViewAppointment = (appointment) => {
    if (!appointment) {
      setError('Invalid appointment data');
      return;
    }
    setSelectedViewAppointment(appointment);
    setViewAppointmentDialog(true);
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

  const getAppointmentStatus = (status) => {
    switch (status) {
      case 'pending':
        return <Typography color="warning.main">Pending</Typography>;
      case 'confirmed':
        return <Typography color="success.main">Confirmed</Typography>;
      case 'completed':
        return <Typography color="info.main">Completed</Typography>;
      case 'cancelled':
        return <Typography color="error.main">Cancelled</Typography>;
      default:
        return status;
    }
  };

  const fetchAppointments = async () => {
    try {
      const appointmentsRes = await api.get('/api/patients/appointments');
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error.response?.data?.message || 'Failed to fetch appointments');
    }
  };

  const renderAppointments = () => {
    // Filter appointments by status
    const approvedAppointments = appointments.filter(apt => apt.status === 'confirmed');
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

    const renderAppointmentSection = (appointments, title, id) => (
      <>
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }} id={id}>
          {title}
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No {title.toLowerCase()} found</TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>
                      {format(new Date(appointment.date), 'MMM dd, yyyy')}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {appointment.timeSlot}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1 }}>
                          {appointment.doctorId?.name?.charAt(0) || 'D'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {appointment.doctorId?.name || 'Unknown Doctor'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {appointment.doctorId?.email || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{appointment.doctorId?.department?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewAppointment(appointment)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );

    return (
      <Box>
        {renderAppointmentSection(approvedAppointments, "Approved Appointments", "approved-appointments")}
        {renderAppointmentSection(pendingAppointments, "Pending Appointments", "pending-appointments")}
        {renderAppointmentSection(completedAppointments, "Completed Appointments", "completed-appointments")}
        {renderAppointmentSection(cancelledAppointments, "Cancelled Appointments", "cancelled-appointments")}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => {
            const approvedSection = document.getElementById('approved-appointments');
            if (approvedSection) {
              approvedSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Event color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Approved Appointments
                  </Typography>
                  <Typography variant="h5">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => {
            const pendingSection = document.getElementById('pending-appointments');
            if (pendingSection) {
              pendingSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccessTime color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Appointments
                  </Typography>
                  <Typography variant="h5">
                    {appointments.filter(a => a.status === 'pending').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => {
            const completedSection = document.getElementById('completed-appointments');
            if (completedSection) {
              completedSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Appointments
                  </Typography>
                  <Typography variant="h5">
                    {appointments.filter(a => a.status === 'completed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => {
            const cancelledSection = document.getElementById('cancelled-appointments');
            if (cancelledSection) {
              cancelledSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Cancel color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cancelled Appointments
                  </Typography>
                  <Typography variant="h5">
                    {appointments.filter(a => a.status === 'cancelled').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => {
            setActiveTab(1);
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocalHospital color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Prescriptions
                  </Typography>
                  <Typography variant="h5">
                    {prescriptions.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Appointments" />
          <Tab label="Prescriptions" />
        </Tabs>
      </Box>

      {/* Appointments Table */}
      {activeTab === 0 && (
        <>
          <Typography variant="h6" id="upcoming-appointments" sx={{ mb: 2 }}>Upcoming Appointments</Typography>
          {renderAppointments()}
        </>
      )}

      {/* Prescriptions Table */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prescriptions.map((prescription) => (
                <TableRow key={prescription._id}>
                  <TableCell>
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {prescription.doctorId?.userId?.name || 'Unknown Doctor'}
                  </TableCell>
                  <TableCell>
                    {prescription.doctorId?.department?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {prescription.diagnosis?.substring(0, 50) || 'N/A'}
                    {prescription.diagnosis?.length > 50 ? '...' : ''}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewPrescription(prescription)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {prescriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No prescriptions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Appointment Dialog */}
      <Dialog
        open={viewAppointmentDialog}
        onClose={() => setViewAppointmentDialog(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="appointment-dialog-title"
        disablePortal={false}
        keepMounted={false}
        disableEnforceFocus={false}
        disableAutoFocus={false}
      >
        <DialogTitle id="appointment-dialog-title">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Appointment Details</Typography>
            <IconButton
              aria-label="close"
              onClick={() => setViewAppointmentDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedViewAppointment && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Doctor:</strong> {selectedViewAppointment.doctorId?.name || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Email:</strong> {selectedViewAppointment.doctorId?.email || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Phone:</strong> {selectedViewAppointment.doctorId?.phone || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Department:</strong> {selectedViewAppointment.doctorId?.department?.name || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Specialization:</strong> {selectedViewAppointment.doctorId?.specialization || 'Not Available'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Date:</strong> {format(new Date(selectedViewAppointment.date), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Time:</strong> {selectedViewAppointment.timeSlot}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Status:</strong> 
                    <Chip
                      label={selectedViewAppointment.status}
                      color={getStatusColor(selectedViewAppointment.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Type:</strong> {selectedViewAppointment.type}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  {selectedViewAppointment.symptoms && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Symptoms:</strong>
                      </Typography>
                      <Typography paragraph sx={{ ml: 2 }}>
                        {selectedViewAppointment.symptoms}
                      </Typography>
                    </>
                  )}
                  {selectedViewAppointment.notes && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Notes:</strong>
                      </Typography>
                      <Typography paragraph sx={{ ml: 2 }}>
                        {selectedViewAppointment.notes}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAppointmentDialog(false)}>Close</Button>
          {selectedViewAppointment?.status === 'cancelled' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setViewAppointmentDialog(false);
                navigate('/appointments', {
                  state: {
                    selectedDoctor: selectedViewAppointment.doctorId,
                    isNewBooking: true
                  }
                });
              }}
            >
              Book New Appointment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog
        open={prescriptionDialogOpen}
        onClose={handleClosePrescriptionDialog}
        maxWidth="md"
        fullWidth
        aria-labelledby="prescription-dialog-title"
        disablePortal={false}
        keepMounted={false}
        disableEnforceFocus={false}
        disableAutoFocus={false}
      >
        <DialogTitle id="prescription-dialog-title">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Prescription Details</Typography>
            <IconButton
              aria-label="close"
              onClick={handleClosePrescriptionDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPrescription && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Date:</strong>{' '}
                {new Date(selectedPrescription.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Doctor:</strong> {selectedPrescription.doctorId?.userId?.name || 'Unknown Doctor'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Department:</strong> {selectedPrescription.doctorId?.department?.name || 'N/A'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Diagnosis:</strong>
              </Typography>
              <Typography paragraph sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                {selectedPrescription.diagnosis}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Medications:</strong>
              </Typography>
              {selectedPrescription.medications && selectedPrescription.medications.length > 0 ? (
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Medicine</strong></TableCell>
                        <TableCell><strong>Dosage</strong></TableCell>
                        <TableCell><strong>Frequency</strong></TableCell>
                        <TableCell><strong>Duration</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPrescription.medications.map((med, index) => (
                        <TableRow key={index}>
                          <TableCell>{med.name}</TableCell>
                          <TableCell>{med.dosage}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                          <TableCell>{med.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ ml: 2, mb: 2 }}>
                  No medications prescribed
                </Typography>
              )}

              <Typography variant="subtitle1" gutterBottom>
                <strong>Additional Instructions:</strong>
              </Typography>
              <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
                {selectedPrescription.prescription}
              </Typography>

              {selectedPrescription.notes && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Notes:</strong>
                  </Typography>
                  <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
                    {selectedPrescription.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrescriptionDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;