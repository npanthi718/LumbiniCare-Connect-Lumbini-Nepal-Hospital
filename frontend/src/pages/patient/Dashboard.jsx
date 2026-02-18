import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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
  TextField,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Rating,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import SplashLoader from '../../components/SplashLoader';

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
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewForAppointment, setReviewForAppointment] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?._id) {
          throw new Error('User ID not found');
        }

        // Fetch appointments with proper population
        const appointmentsRes = await api.get('/patients/appointments');

        // Fetch prescriptions with proper endpoint
        const prescriptionsRes = await api.get('/patients/prescriptions');

        if (Array.isArray(appointmentsRes.data)) {
          setAppointments(appointmentsRes.data);
        } else {
          throw new Error('Invalid appointments data received');
        }

        if (Array.isArray(prescriptionsRes.data)) {
          setPrescriptions(prescriptionsRes.data);
        } else {
          throw new Error('Invalid prescriptions data received');
        }

      } catch (err) {
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

  const renderAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppointments = appointments.filter(apt => {
      const d = new Date(apt.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime() && apt.status !== 'cancelled' && apt.status !== 'completed';
    });
    const approvedAppointments = appointments.filter(apt => {
      const d = new Date(apt.date);
      d.setHours(0, 0, 0, 0);
      return apt.status === 'confirmed' && d.getTime() > today.getTime();
    });
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
                        <Typography>
                          {appointment.doctorId?.name || 'Not Available'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {appointment.doctorId?.department?.name || 'Not Available'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status || 'pending'}
                        color={getStatusColor(appointment.status || 'pending')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewAppointment(appointment)}
                        sx={{ mr: 1 }}
                      >
                        View Details
                      </Button>
                      {title.includes('Completed') && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            setReviewForAppointment(appointment);
                            setReviewDialogOpen(true);
                          }}
                        >
                          Rate Doctor
                        </Button>
                      )}
                      {title.includes('Completed') && (
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ ml: 1 }}
                          onClick={() => {
                            navigate('/appointments', {
                              state: {
                                doctorId: appointment.doctorId?._id,
                                doctorDetails: {
                                  name: appointment.doctorId?.name,
                                  department: appointment.doctorId?.department?.name
                                }
                              }
                            });
                          }}
                        >
                          Re-book
                        </Button>
                      )}
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
      <>
        {renderAppointmentSection(todayAppointments, 'Today\'s Appointments', 'today-appointments')}
        {renderAppointmentSection(approvedAppointments, 'Upcoming Approved Appointments', 'approved-appointments')}
        {renderAppointmentSection(pendingAppointments, 'Pending Appointments', 'pending-appointments')}
        {renderAppointmentSection(completedAppointments, 'Completed Appointments', 'completed-appointments')}
        {renderAppointmentSection(cancelledAppointments, 'Cancelled Appointments', 'cancelled-appointments')}
      </>
    );
  };

  const renderAppointmentDialog = () => (
    <Dialog open={viewAppointmentDialog} onClose={() => setViewAppointmentDialog(false)} fullWidth>
      <DialogTitle>Appointment Details</DialogTitle>
      <DialogContent dividers>
        {selectedViewAppointment ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {selectedViewAppointment.doctorId?.name || 'Doctor'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedViewAppointment.doctorId?.department?.name || 'Department'}
            </Typography>
            <Typography sx={{ mt: 2 }}>
              {selectedViewAppointment.notes || 'No notes'}
            </Typography>
          </Box>
        ) : (
          <Typography>No appointment selected</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewAppointmentDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return <SplashLoader />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Patient Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Overview of your appointments and prescriptions
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
          <Card sx={{ cursor: 'pointer' }} onClick={() => setActiveTab(0)}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Appointments</Typography>
              <Typography variant="h5">{appointments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setActiveTab(1)}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Prescriptions</Typography>
              <Typography variant="h5">{prescriptions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setActiveTab(0)}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Today</Typography>
              <Typography variant="h5">
                {appointments.filter(apt => {
                  const d = new Date(apt.date);
                  const t = new Date();
                  d.setHours(0,0,0,0);
                  t.setHours(0,0,0,0);
                  return d.getTime() === t.getTime() && apt.status !== 'cancelled' && apt.status !== 'completed';
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setActiveTab(0)}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Completed</Typography>
              <Typography variant="h5">
                {appointments.filter(apt => apt.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Appointments" />
        <Tab label="Prescriptions" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {renderAppointments()}
          {renderAppointmentDialog()}
          <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Rate Your Appointment</DialogTitle>
            <DialogContent>
              <Box sx={{ my: 2 }}>
                <Rating
                  value={reviewRating}
                  onChange={(_, newValue) => setReviewRating(newValue || 0)}
                />
              </Box>
              <TextField
                label="Review (optional)"
                fullWidth
                multiline
                minRows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!reviewForAppointment || !reviewRating) return;
                  try {
                    await api.post('/reviews', {
                      appointmentId: reviewForAppointment._id,
                      rating: reviewRating,
                      comment: reviewComment
                    });
                    setSuccess('Review submitted');
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to submit review');
                  } finally {
                    setReviewDialogOpen(false);
                    setReviewForAppointment(null);
                    setReviewRating(0);
                    setReviewComment('');
                  }
                }}
                disabled={!reviewRating}
              >
                Submit Review
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Prescriptions
                </Typography>
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
                            {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{prescription.doctorId?.name || 'Not Available'}</TableCell>
                          <TableCell>{prescription.doctorId?.department?.name || 'Not Available'}</TableCell>
                          <TableCell>
                            <Typography noWrap style={{ maxWidth: 200 }}>
                              {prescription.diagnosis}
                            </Typography>
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
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog
        open={prescriptionDialogOpen}
        onClose={handleClosePrescriptionDialog}
        maxWidth="md"
        fullWidth
        aria-labelledby="prescription-dialog-title"
      >
        <DialogTitle id="prescription-dialog-title">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Prescription Details</Typography>
            <IconButton onClick={handleClosePrescriptionDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPrescription ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Doctor Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Name:</strong> {selectedPrescription.doctorId?.name || 'Not Available'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Department:</strong> {selectedPrescription.doctorId?.department?.name || 'Not Available'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Specialization:</strong> {selectedPrescription.doctorId?.specialization || 'Not Available'}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Prescription Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Date:</strong> {format(new Date(selectedPrescription.createdAt), 'MMM dd, yyyy, hh:mm a')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Diagnosis:</strong>
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body1">{selectedPrescription.diagnosis}</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {selectedPrescription.medications && selectedPrescription.medications.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Medications
                    </Typography>
                    {selectedPrescription.medications.map((med, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body1" gutterBottom>
                              <strong>Medicine:</strong> {med.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body1" gutterBottom>
                              <strong>Dosage:</strong> {med.dosage}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body1" gutterBottom>
                              <strong>Frequency:</strong> {med.frequency}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                              <strong>Duration:</strong> {med.duration}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Box>
                )}

                {selectedPrescription.notes && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Additional Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body1">{selectedPrescription.notes}</Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Typography>No prescription selected</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrescriptionDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
