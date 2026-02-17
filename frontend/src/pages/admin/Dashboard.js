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
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Link,
  DialogContentText,
} from "@mui/material";
import {
  LocalHospital as HospitalIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person,
  Refresh as RefreshIcon,
  Assignment,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  MarkEmailRead as MarkReadIcon,
  Email as EmailIcon,
  Reply as ReplyIcon,
  CheckCircle as CheckCircle,
  Cancel as Cancel,
  Visibility as Visibility,
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
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
  const [appointmentStats, setAppointmentStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState({
    all: [],
    today: [],
    upcoming: [],
    past: []
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewAppointmentDialog, setViewAppointmentDialog] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
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

  const calculateUnreadCount = (messages) => {
    return messages.filter(message => message.status === 'unread').length;
  };

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
      const [appointmentsRes, doctorsRes, patientsRes, departmentsRes, messagesRes] = await Promise.all([
        api.get('/admin/appointments'),
        api.get('/admin/doctors'),
        api.get('/admin/patients'),
        api.get('/admin/departments'),
        api.get('/contact')
      ]);

      // Update state with fetched data
      setAppointments({
        today: appointmentsRes.data.filter(app => app.date && isToday(new Date(app.date))),
        upcoming: appointmentsRes.data.filter(app => app.date && isFuture(new Date(app.date))),
        completed: appointmentsRes.data.filter(app => app.status === 'completed'),
        cancelled: appointmentsRes.data.filter(app => app.status === 'cancelled'),
        all: appointmentsRes.data
      });
      setDoctors(doctorsRes.data);
      setPatients(patientsRes.data);
      setDepartments(departmentsRes.data);
      setMessages(messagesRes.data);
      setUnreadCount(calculateUnreadCount(messagesRes.data));

      // Update stats
      setStats({
        totalDoctors: doctorsRes.data.length,
        totalPatients: patientsRes.data.length,
        totalAppointments: appointmentsRes.data.length,
        completedAppointments: appointmentsRes.data.filter(apt => apt.status === 'completed').length,
        pendingAppointments: appointmentsRes.data.filter(apt => apt.status === 'pending').length,
        cancelledAppointments: appointmentsRes.data.filter(apt => apt.status === 'cancelled').length,
        unreadMessages: unreadCount
      });

      // Update appointment stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = appointmentsRes.data.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= today && aptDate < tomorrow;
      });

      const upcomingAppointments = appointmentsRes.data.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= tomorrow;
      });

      setAppointmentStats({
        today: todayAppointments.length,
        upcoming: upcomingAppointments.length,
        completed: appointmentsRes.data.filter(apt => apt.status === 'completed').length,
        cancelled: appointmentsRes.data.filter(apt => apt.status === 'cancelled').length
      });

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError(error.message || 'Failed to fetch dashboard data');
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/contact');
      const fetchedMessages = response.data;
      setMessages(fetchedMessages);
      setUnreadCount(calculateUnreadCount(fetchedMessages));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages');
    }
  };

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
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.put(`/admin/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      setSuccess("Appointment status updated successfully");
      fetchDashboardData();
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.response?.data?.message || "Failed to update appointment status");
    }
  };

  const handleDoctorStatusChange = async (doctorId, newStatus) => {
    try {
      await api.patch(`/admin/doctors/${doctorId}/status`, {
        isApproved: newStatus === "active",
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
          api.patch(`/admin/doctors/${doctor._id}/approval`, {
            isApproved: true,
          })
        )
      );

      setSuccess("All doctors have been activated");
      fetchDashboardData();
    } catch (err) {
      console.error("Error activating doctors:", err);
      setError("Failed to activate all doctors. Please try again.");
    }
  };

  const handleViewAppointment = (appointment) => {
    // Transform the appointment data to ensure doctor information is properly structured
    const transformedAppointment = {
      ...appointment,
      doctorId: {
        ...appointment.doctorId,
        name: appointment.doctorId?.userId?.name || appointment.doctorId?.name || 'Unknown Doctor',
        email: appointment.doctorId?.userId?.email || appointment.doctorId?.email || 'No email',
        department: appointment.doctorId?.department || {
          name: appointment.doctorId?.departmentName || 'Unknown Department'
        }
      }
    };
    setSelectedAppointment(transformedAppointment);
    setViewAppointmentDialog(true);
  };

  const handleCloseAppointmentDialog = () => {
    setSelectedAppointment(null);
    setViewAppointmentDialog(false);
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setViewPatientDialog(true);
  };

  const handleClosePatientDialog = () => {
    setSelectedPatient(null);
    setViewPatientDialog(false);
    setPatientHistory(null);
  };

  const handleViewPatientHistory = async (id, isDoctor = false) => {
    try {
      setLoading(true);
      setError(null);

      if (isDoctor) {
        // For doctor history, fetch both appointments and prescriptions
        const [appointmentsRes, prescriptionsRes] = await Promise.all([
          api.get(`/admin/doctors/${id}/appointments`),
          api.get(`/admin/doctors/${id}/prescriptions`)
        ]);

        const doctorAppointments = appointmentsRes.data || [];
        const doctorPrescriptions = prescriptionsRes.data || [];

        // Group appointments by patient
        const appointmentsByDoctor = {};
        doctorAppointments.forEach(appointment => {
          const patientId = appointment.patientId?._id || appointment.patientId;
          if (!patientId) return;

          if (!appointmentsByDoctor[patientId]) {
            appointmentsByDoctor[patientId] = {
              doctorInfo: {
                name: appointment.patientId?.name || appointment.patientId?.userId?.name || 'Unknown Patient',
                email: appointment.patientId?.email || appointment.patientId?.userId?.email || 'No email'
              },
              appointments: []
            };
          }
          appointmentsByDoctor[patientId].appointments.push({
            ...appointment,
            doctorName: appointment.doctorId?.name || appointment.doctorId?.userId?.name || 'Unknown Doctor',
            departmentName: appointment.doctorId?.department?.name || 'Unknown Department',
            patientName: appointment.patientId?.name || appointment.patientId?.userId?.name || 'Unknown Patient'
          });
        });

        // Group prescriptions by patient
        const prescriptionsByDoctor = {};
        doctorPrescriptions.forEach(prescription => {
          const patientId = prescription.patientId?._id || prescription.patientId;
          if (!patientId) return;

          if (!prescriptionsByDoctor[patientId]) {
            prescriptionsByDoctor[patientId] = {
              doctorInfo: {
                name: prescription.patientId?.name || prescription.patientId?.userId?.name || 'Unknown Patient',
                email: prescription.patientId?.email || prescription.patientId?.userId?.email || 'No email'
              },
              prescriptions: []
            };
          }
          prescriptionsByDoctor[patientId].prescriptions.push({
            ...prescription,
            doctorName: prescription.doctorId?.name || prescription.doctorId?.userId?.name || 'Unknown Doctor',
            departmentName: prescription.doctorId?.department?.name || 'Unknown Department',
            patientName: prescription.patientId?.name || prescription.patientId?.userId?.name || 'Unknown Patient'
          });
        });

        setPatientHistory({
          appointmentsByDoctor,
          prescriptionsByDoctor,
          isDoctor: true
        });
        setHistoryDialogOpen(true);
      } else {
        // For patient history
        try {
          const [appointmentsRes, prescriptionsRes] = await Promise.all([
            api.get(`/admin/patients/${id}/appointments`),
            api.get(`/admin/patients/${id}/prescriptions`)
          ]);

          const appointments = appointmentsRes.data || [];
          const prescriptions = prescriptionsRes.data || [];

          // Group appointments by doctor
          const appointmentsByDoctor = {};
          appointments.forEach(appointment => {
            const doctorId = appointment.doctorId?._id;
            if (!doctorId) return;

            if (!appointmentsByDoctor[doctorId]) {
              appointmentsByDoctor[doctorId] = {
                doctorInfo: {
                  name: appointment.doctorId?.name || appointment.doctorId?.userId?.name || 'Unknown Doctor',
                  department: appointment.doctorId?.department?.name || 'Unknown Department'
                },
                appointments: []
              };
            }
            appointmentsByDoctor[doctorId].appointments.push({
              ...appointment,
              doctorName: appointment.doctorId?.name || appointment.doctorId?.userId?.name || 'Unknown Doctor',
              departmentName: appointment.doctorId?.department?.name || 'Unknown Department',
              patientName: appointment.patientId?.name || 'Unknown Patient'
            });
          });

          // Group prescriptions by doctor
          const prescriptionsByDoctor = {};
          prescriptions.forEach(prescription => {
            const doctorId = prescription.doctorId?._id;
            if (!doctorId) return;

            if (!prescriptionsByDoctor[doctorId]) {
              prescriptionsByDoctor[doctorId] = {
                doctorInfo: {
                  name: prescription.doctorId?.name || prescription.doctorId?.userId?.name || 'Unknown Doctor',
                  department: prescription.doctorId?.department?.name || 'Unknown Department'
                },
                prescriptions: []
              };
            }
            prescriptionsByDoctor[doctorId].prescriptions.push({
              ...prescription,
              doctorName: prescription.doctorId?.name || prescription.doctorId?.userId?.name || 'Unknown Doctor',
              departmentName: prescription.doctorId?.department?.name || 'Unknown Department',
              patientName: prescription.patientId?.name || 'Unknown Patient'
            });
          });

          setPatientHistory({
            appointmentsByDoctor,
            prescriptionsByDoctor,
            isDoctor: false
          });
          setHistoryDialogOpen(true);

        } catch (err) {
          console.error('Error fetching patient history:', err);
          setError('Failed to fetch patient history. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(`Failed to fetch ${isDoctor ? 'doctor' : 'patient'} history. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setPrescriptionDialogOpen(true);
  };

  const handleAppointmentAction = async (appointmentId, action, reason = '') => {
    try {
      setLoading(true);
      setError(null);

      await api.patch(`/admin/appointments/${appointmentId}/status`, {
        status: action,
        cancellationReason: reason
      });

      // Update the appointments list
      setAppointments(prev => ({
        ...prev,
        all: prev.all.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: action, cancellationReason: reason }
            : apt
        )
      }));

      enqueueSnackbar(
        `Appointment ${action === 'cancelled' ? 'cancelled' : 'confirmed'} successfully`,
        { variant: 'success' }
      );

      // Close dialogs if open
      setOpenCancelDialog(false);
      setCancellationReason('');
      setViewAppointmentDialog(false);
      
      // Refresh appointments
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(error.response?.data?.message || 'Failed to update appointment');
      enqueueSnackbar(error.response?.data?.message || 'Failed to update appointment', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppointment = (appointmentId) => {
    handleAppointmentAction(appointmentId, 'confirmed');
  };

  const handleCancelAppointment = (appointmentId) => {
    const appointment = appointments.all.find(apt => apt._id === appointmentId);
    setSelectedAppointment(appointment);
    setOpenCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment || !cancellationReason.trim()) {
      enqueueSnackbar('Please provide a reason for cancellation', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/admin/appointments/${selectedAppointment._id}/status`, {
        status: 'cancelled',
        cancellationReason: cancellationReason.trim()
      });

      // Update local state
      setAppointments(prev => ({
        ...prev,
        all: prev.all.map(apt => 
          apt._id === selectedAppointment._id 
            ? { ...apt, status: 'cancelled', cancellationReason: cancellationReason.trim() }
            : apt
        )
      }));

      // Show success message
      enqueueSnackbar('Appointment cancelled successfully', { variant: 'success' });

      // Close all dialogs
      setOpenCancelDialog(false);
      setViewAppointmentDialog(false);
      setCancellationReason('');
      setSelectedAppointment(null);
      
      // Refresh the dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to cancel appointment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const categorizeAppointments = (appointments) => {
    // Handle case where appointments might be undefined or null
    if (!appointments) {
      return {
        todayAppointments: [],
        upcomingAppointments: [],
        completedAppointments: [],
        pastAppointments: [],
        cancelledAppointments: []
      };
    }

    // Convert appointments to array if it's not already
    const appointmentsArray = Array.isArray(appointments) ? appointments : 
                            appointments.all ? appointments.all : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      todayAppointments: appointmentsArray.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() === today.getTime() && 
               appointment.status !== 'completed' && 
               appointment.status !== 'cancelled';
      }),
      upcomingAppointments: appointmentsArray.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() > today.getTime() && 
               appointment.status !== 'completed' && 
               appointment.status !== 'cancelled';
      }),
      completedAppointments: appointmentsArray.filter(appointment => 
        appointment.status === 'completed'
      ),
      pastAppointments: appointmentsArray.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() < today.getTime() && 
               appointment.status !== 'completed' && 
               appointment.status !== 'cancelled';
      }),
      cancelledAppointments: appointmentsArray.filter(appointment => 
        appointment.status === 'cancelled'
      )
    };
  };

  const handleMessageStatusUpdate = async (messageId, status) => {
    try {
      await api.patch(`/contact/${messageId}`, { status });
      // Refresh messages after update
      await fetchMessages();
      setSuccess(`Message marked as ${status} successfully`);
    } catch (error) {
      console.error('Error updating message status:', error);
      setError('Failed to update message status');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/contact/${messageId}`);
      setSuccess("Message deleted successfully");
      fetchDashboardData();
    } catch (err) {
      console.error("Message deletion error:", err);
      setError(err.response?.data?.message || "Failed to delete message");
    }
  };

  const handleReplyMessage = (message) => {
    // Open default email client with pre-filled fields
    const subject = `Re: ${message.subject}`;
    const body = `\n\nOriginal message from ${message.name}:\n${message.message}`;
    const mailtoLink = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const renderStats = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveTab(0);
          }}
        >
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
        <Card 
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveTab(1);
          }}
        >
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
        <Card 
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveTab(2);
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <EventIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Appointments</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
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
            const completedSection = document.getElementById('completed-appointments');
            if (completedSection) {
              completedSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Completed Appointments</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {stats.completedAppointments}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setActiveTab(2);
            const cancelledSection = document.getElementById('cancelled-appointments');
            if (cancelledSection) {
              cancelledSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CancelIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Cancelled Appointments</Typography>
            </Box>
            <Typography variant="h3" color="error">
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
        <Box>
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
              const user = doctor.userId || {};
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
        Today's Appointments
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
              <TableCell>Cancellation Reason</TableCell>
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
                    <Typography variant="body2" color="error">
                      {appointment.cancellationReason || 'No reason provided'}
                    </Typography>
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
                <TableCell colSpan={8} align="center">
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

const renderViewPatientDialog = () => (
  <Dialog
    open={viewPatientDialog}
    onClose={handleClosePatientDialog}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Patient Details</Typography>
        <IconButton onClick={handleClosePatientDialog}>
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent>
      {selectedPatient && (
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">Personal Information</Typography>
              <Typography gutterBottom>
                <strong>Name:</strong> {selectedPatient.name}
              </Typography>
              <Typography gutterBottom>
                <strong>Email:</strong> {selectedPatient.email}
              </Typography>
              <Typography gutterBottom>
                <strong>Phone:</strong> {selectedPatient.phone || 'N/A'}
              </Typography>
              <Typography gutterBottom>
                <strong>Address:</strong> {formatAddress(selectedPatient.address)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">Medical Information</Typography>
              <Typography gutterBottom>
                <strong>Age:</strong> {selectedPatient.age || 'N/A'}
              </Typography>
              <Typography gutterBottom>
                <strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'N/A'}
              </Typography>
              <Typography gutterBottom>
                <strong>Medical History:</strong> {selectedPatient.medicalHistory || 'None'}
              </Typography>
            </Grid>
            {patientHistory && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                  Appointment History
                </Typography>
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Doctor</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(patientHistory.appointmentsByDoctor).map(([doctorId, data]) => (
                        data.appointments.map((appointment) => (
                          <TableRow key={appointment._id}>
                            <TableCell>{format(new Date(appointment.date), 'PPP')}</TableCell>
                            <TableCell>{data.doctorInfo.name}</TableCell>
                            <TableCell>{appointment.type}</TableCell>
                            <TableCell>
                              <Chip
                                label={appointment.status}
                                color={getStatusColor(appointment.status)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {Object.entries(patientHistory.prescriptionsByDoctor).map(([doctorId, data]) => (
                  <>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3 }}>
                      Prescription History
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Diagnosis</TableCell>
                            <TableCell>Medicines</TableCell>
                            <TableCell>Tests</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.prescriptions.map((prescription) => (
                            <TableRow key={prescription._id}>
                              <TableCell>
                                {format(new Date(prescription.createdAt), 'PPP')}
                              </TableCell>
                              <TableCell>{prescription.diagnosis}</TableCell>
                              <TableCell>
                                {prescription.medicines.map((med, idx) => (
                                  <Typography key={idx} variant="body2">
                                    {med.name} - {med.dosage}
                                  </Typography>
                                ))}
                              </TableCell>
                              <TableCell>
                                {prescription.tests?.join(', ') || '-'}
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
                  </>
                ))}
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClosePatientDialog}>Close</Button>
    </DialogActions>
  </Dialog>
);

const renderAppointmentDialog = () => (
  <Dialog
    open={viewAppointmentDialog}
    onClose={handleCloseAppointmentDialog}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Appointment Details</Typography>
        <IconButton onClick={handleCloseAppointmentDialog}>
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent>
      {selectedAppointment && (
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">Patient Information</Typography>
              <Typography gutterBottom>
                <strong>Name:</strong> {selectedAppointment.patientId?.name || "N/A"}
              </Typography>
              <Typography gutterBottom>
                <strong>Email:</strong> {selectedAppointment.patientId?.email || "N/A"}
              </Typography>
              <Typography gutterBottom>
                <strong>Phone:</strong> {selectedAppointment.patientId?.phone || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">Doctor Information</Typography>
              <Typography gutterBottom>
                <strong>Name:</strong> {selectedAppointment.doctorId?.userId?.name || selectedAppointment.doctorId?.name || "N/A"}
              </Typography>
              <Typography gutterBottom>
                <strong>Email:</strong> {selectedAppointment.doctorId?.userId?.email || selectedAppointment.doctorId?.email || "N/A"}
              </Typography>
              <Typography gutterBottom>
                <strong>Department:</strong> {selectedAppointment.doctorId?.department?.name || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                Appointment Details
              </Typography>
              <Typography gutterBottom>
                <strong>Date:</strong> {format(new Date(selectedAppointment.date), "PPP")}
              </Typography>
              <Typography gutterBottom>
                <strong>Time:</strong> {selectedAppointment.timeSlot}
              </Typography>
              <Typography gutterBottom>
                <strong>Type:</strong> {selectedAppointment.type || "General Checkup"}
              </Typography>
              <Typography gutterBottom>
                <strong>Status:</strong> {selectedAppointment.status}
              </Typography>
              {selectedAppointment.symptoms && (
                <Typography gutterBottom>
                  <strong>Symptoms:</strong> {selectedAppointment.symptoms}
                </Typography>
              )}
              {selectedAppointment.notes && (
                <Typography gutterBottom>
                  <strong>Notes:</strong> {selectedAppointment.notes}
                </Typography>
              )}
              {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellationReason && (
                <Typography gutterBottom color="error">
                  <strong>Cancellation Reason:</strong> {selectedAppointment.cancellationReason}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      {selectedAppointment && selectedAppointment.status === 'pending' && (
        <>
          <Button 
            onClick={() => handleApproveAppointment(selectedAppointment._id)}
            color="success" 
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Approve
          </Button>
          <Button 
            onClick={() => handleCancelAppointment(selectedAppointment._id)}
            color="error" 
            variant="contained"
            startIcon={<Cancel />}
          >
            Deny
          </Button>
        </>
      )}
      <Button onClick={handleCloseAppointmentDialog}>Close</Button>
    </DialogActions>
  </Dialog>
);

const renderHistoryDialog = () => (
  <Dialog
    open={historyDialogOpen}
    onClose={() => setHistoryDialogOpen(false)}
    maxWidth="lg"
    fullWidth
  >
    <DialogTitle>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">
          {patientHistory?.isDoctor ? 'Doctor History' : 'Patient History'}
        </Typography>
        <IconButton onClick={() => setHistoryDialogOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : patientHistory ? (
        <Box sx={{ mt: 2 }}>
          {/* Appointments History */}
          <Typography variant="h6" gutterBottom>
            {patientHistory.isDoctor ? 'Patient Appointments' : 'Appointments History'}
          </Typography>
          {Object.keys(patientHistory.appointmentsByDoctor).length > 0 ? (
            Object.entries(patientHistory.appointmentsByDoctor).map(([key, data]) => (
              <Box key={key} sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                  {patientHistory.isDoctor ? 
                    `Patient: ${data.doctorInfo.name}` :
                    `Doctor: ${data.doctorInfo.name} (${data.doctorInfo.department})`
                  }
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.appointments.map((appointment) => (
                        <TableRow key={appointment._id}>
                          <TableCell>{format(new Date(appointment.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{appointment.timeSlot}</TableCell>
                          <TableCell>{appointment.type}</TableCell>
                          <TableCell>
                            <Chip
                              label={appointment.status}
                              color={getStatusColor(appointment.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          ) : (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
              <Typography align="center" color="textSecondary">
                No appointments found
              </Typography>
            </Paper>
          )}

          {/* Prescriptions History */}
          {!patientHistory.isDoctor && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Prescriptions History
              </Typography>
              {Object.keys(patientHistory.prescriptionsByDoctor).length > 0 ? (
                Object.entries(patientHistory.prescriptionsByDoctor).map(([key, data]) => (
                  <Box key={key} sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                      Doctor: {data.doctorInfo.name} ({data.doctorInfo.department})
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Diagnosis</TableCell>
                            <TableCell>Medicines</TableCell>
                            <TableCell>Tests</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.prescriptions.map((prescription) => (
                            <TableRow key={prescription._id}>
                              <TableCell>{format(new Date(prescription.createdAt), "MMM dd, yyyy")}</TableCell>
                              <TableCell>{prescription.diagnosis}</TableCell>
                              <TableCell>
                                {prescription.medicines.map((med, idx) => (
                                  <Typography key={idx} variant="body2">
                                    {med.name} - {med.dosage}
                                  </Typography>
                                ))}
                              </TableCell>
                              <TableCell>
                                {prescription.tests?.join(', ') || '-'}
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
                  </Box>
                ))
              ) : (
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography align="center" color="textSecondary">
                    No prescriptions found
                  </Typography>
                </Paper>
              )}
            </>
          )}
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
      </Tabs>
      <Box sx={{ p: 2 }}>
        {activeTab === 0 && renderDoctors()}
        {activeTab === 1 && renderPatients()}
        {activeTab === 2 && renderAppointments()}
        {activeTab === 3 && renderMessages()}
      </Box>
    </Paper>

    {renderViewPatientDialog()}
    {renderAppointmentDialog()}
    {renderHistoryDialog()}
    {renderPrescriptionDialog()}

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
