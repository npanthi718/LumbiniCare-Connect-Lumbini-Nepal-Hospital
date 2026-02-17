import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { useAuth } from "../context/AuthContext";
import { format, parse } from "date-fns";

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("Request config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log("Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Error Response:", error.response?.data);
    if (error.response?.status === 401) {
      console.log("Unauthorized access, redirecting to login...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const Appointments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [formData, setFormData] = useState({
    doctorId: "",
    date: null,
    time: "",
    type: "General Checkup",
    symptoms: "",
    notes: "",
  });
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [rebookingDetails, setRebookingDetails] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeSlotMessage, setTimeSlotMessage] = useState('');

  // Get rebooking info from location state
  const { rebookData, isRebooking: isRebookingFromState, previousAppointment } = location.state || {};

  useEffect(() => {
    const doctorId = location.state?.doctorId;
    const doctorDetails = location.state?.doctorDetails;

    if (doctorId) {
      setFormData((prev) => ({
        ...prev,
        doctorId,
        consultationFee: doctorDetails?.consultationFee,
      }));
      if (doctorDetails) {
        // If we have doctor details from navigation, use them directly
        setOpenDialog(true); // Open the booking dialog automatically
      } else {
        // If no details provided, fetch them
        fetchDoctorDetails(doctorId);
      }
    }
    fetchAppointments();
    fetchDoctors();
  }, [location]);

  useEffect(() => {
    if (error) {
      console.error("Appointment Error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (isRebookingFromState && rebookData) {
      setFormData((prev) => ({
        ...prev,
        doctorId: rebookData.doctorId,
        date: rebookData.previousAppointmentDate,
        time: rebookData.previousAppointmentTime,
        type: rebookData.type,
        symptoms: rebookData.symptoms,
        notes: rebookData.notes,
      }));
      setOpenDialog(true);
    }
  }, [isRebookingFromState, rebookData]);

  useEffect(() => {
    const state = location.state;
    if (state?.isRebooking && state?.rebookData) {
      setRebookingDetails(state.rebookData);
      setFormData({
        doctorId: state.rebookData.doctorId,
        date: state.rebookData.date,
        time: state.rebookData.timeSlot,
        type: state.rebookData.type,
        symptoms: state.rebookData.symptoms,
        notes: `Previous appointment details:\nDate: ${state.rebookData.previousDate}\nTime: ${state.rebookData.previousTime}\nCancellation Reason: ${state.rebookData.cancellationReason}\n\nPrevious Notes: ${state.rebookData.notes}`,
      });
      setOpenDialog(true);
    }
  }, [location.state]);

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const response = await api.get(`/doctors/${doctorId}`);
      const doctorData = response.data;
      setFormData((prev) => ({
        ...prev,
        doctorId: doctorData._id,
        consultationFee: doctorData.consultationFee,
      }));
    } catch (err) {
      console.error("Failed to fetch doctor details:", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/appointments', {
        params: {
          populate: 'doctorId,doctorId.department,doctorId.specialization,doctorId.email,doctorId.phone'
        }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get("/doctors", {
        params: {
          populate:
            "userId,department,specialization,experience,education,license,consultationFee,availableSlots",
        },
      });
      console.log("Fetched doctors:", response.data);
      setDoctors(response.data);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      setError("Failed to load doctors. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDateChange = (newDate) => {
    console.log("New date selected:", newDate);
    setFormData((prev) => ({
      ...prev,
      date: newDate,
    }));
  };

  const handleTimeChange = (newTime) => {
    console.log("New time selected:", newTime);
    setFormData((prev) => ({
      ...prev,
      time: newTime
    }));
  };

  const handleNext = () => {
    console.log("Current form data:", formData);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    console.log("Current form data:", formData);
    setActiveStep((prev) => prev - 1);
  };

  // Function to get available time slots for a doctor on a specific date
  const getAvailableTimeSlots = async (doctorId, date) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/available-slots`, {
        params: {
          date: format(date, 'yyyy-MM-dd')
        }
      });
      
      if (response.data.availableSlots.length === 0) {
        setTimeSlotMessage(response.data.message || 'No available slots for this date');
        return { availableSlots: [], message: response.data.message };
      }
      
      return {
        availableSlots: response.data.availableSlots,
        message: null
      };
    } catch (error) {
      console.error('Error fetching available slots:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch available time slots';
      setTimeSlotMessage(errorMessage);
      return { availableSlots: [], message: errorMessage };
    }
  };

  // Update time slots when doctor or date changes
  useEffect(() => {
    if (formData.doctorId && formData.date) {
      getAvailableTimeSlots(formData.doctorId, formData.date)
        .then(response => {
          setTimeSlots(response.availableSlots);
          setTimeSlotMessage(response.message);
          if (response.message && !response.availableSlots.length) {
            setError(response.message);
          }
        })
        .catch(error => {
          console.error('Failed to fetch time slots:', error);
          setError('Failed to fetch available time slots');
        });
    }
  }, [formData.doctorId, formData.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!formData.doctorId || !formData.date || !formData.time) {
        setError('Please fill in all required fields');
        return;
      }

      const appointmentDate = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':');
      appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // Check if appointment time is in the past
      if (appointmentDate < new Date()) {
        setError('Cannot book appointments in the past');
        return;
      }

      const appointmentData = {
        doctorId: formData.doctorId,
        date: format(formData.date, 'yyyy-MM-dd'),
        time: formData.time,
        type: formData.type || 'General Checkup',
        symptoms: formData.symptoms || '',
        notes: formData.notes || ''
      };

      const response = await api.post('/appointments', appointmentData);
      
      if (response.data) {
        setSuccess('Appointment booked successfully!');
        // Reset form data
        setFormData({
          doctorId: '',
          date: null,
          time: '',
          type: 'General Checkup',
          symptoms: '',
          notes: ''
        });
        // Reset to first step
        setActiveStep(0);
        // Close the dialog
        setOpenDialog(false);
        // Fetch updated appointments
        await fetchAppointments();
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await api.put(`/appointments/${appointmentId}/cancel`, {});
      setSuccess("Appointment cancelled successfully");
      fetchAppointments();
    } catch (err) {
      setError("Failed to cancel appointment");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const steps = ["Select Doctor", "Choose Date & Time", "Appointment Details"];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Doctor
            </Typography>
            <FormControl
              sx={{
                mb: 2,
                maxWidth: "600px",
                width: "100%",
              }}
            >
              <InputLabel id="doctor-select-label">Select Doctor</InputLabel>
              <Select
                labelId="doctor-select-label"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                required
                label="Select Doctor"
                sx={{
                  "& .MuiSelect-select": {
                    py: 1.5,
                  },
                }}
              >
                {doctors.map((doctor) => (
                  <MenuItem
                    key={doctor._id}
                    value={doctor._id}
                    sx={{ py: 1.5 }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {doctor.userId?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {doctor.department?.name} • {doctor.specialization}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.doctorId &&
              (location.state?.doctorDetails ||
                doctors.find((d) => d._id === formData.doctorId)) && (
                <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Doctor Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Personal Information
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" gutterBottom>
                          <strong>Name:</strong>{" "}
                          {location.state?.doctorDetails?.name ||
                            doctors.find((d) => d._id === formData.doctorId)
                              ?.userId?.name}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          <strong>Department:</strong>{" "}
                          {location.state?.doctorDetails?.department ||
                            (() => {
                              const doctor = doctors.find(
                                (d) => d._id === formData.doctorId
                              );
                              return (
                                doctor?.department?.name ||
                                (typeof doctor?.department === "string"
                                  ? doctor.department
                                  : "N/A")
                              );
                            })()}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          <strong>Specialization:</strong>{" "}
                          {location.state?.doctorDetails?.specialization ||
                            doctors.find((d) => d._id === formData.doctorId)
                              ?.specialization}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          <strong>Experience:</strong>{" "}
                          {location.state?.doctorDetails?.experience ||
                            doctors.find((d) => d._id === formData.doctorId)
                              ?.experience}{" "}
                          years
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Consultation Details
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" gutterBottom>
                          <strong>Consultation Fee:</strong> Rs.{" "}
                          {location.state?.doctorDetails?.consultationFee ||
                            doctors.find((d) => d._id === formData.doctorId)
                              ?.consultationFee}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Date & Time
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Appointment Date"
                    value={formData.date}
                    onChange={handleDateChange}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required />
                    )}
                    minDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                {renderTimeSlots()}
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Appointment Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel id="appointment-type-label">Appointment Type</InputLabel>
                  <Select
                    labelId="appointment-type-label"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    defaultValue="General Checkup"
                    label="Appointment Type"
                  >
                    <MenuItem value="General Checkup">General Checkup</MenuItem>
                    <MenuItem value="Follow-up">Follow-up</MenuItem>
                    <MenuItem value="Consultation">Consultation</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="symptoms"
                  label="Symptoms (Optional)"
                  value={formData.symptoms}
                  onChange={handleChange}
                  placeholder="Describe your symptoms if any..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="notes"
                  label="Additional Notes (Optional)"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginDialog(false);
    navigate("/login", { state: { from: "/appointments" } });
  };

  const handleAppointmentAction = async (appointmentId, action, notes = "") => {
    try {
      let endpoint = "";

      switch (action) {
        case "complete":
          endpoint = `/appointments/${appointmentId}/complete`;
          break;
        case "cancel":
          endpoint = `/appointments/${appointmentId}/cancel`;
          break;
        default:
          throw new Error("Invalid action");
      }

      await api.put(endpoint, { notes });

      setSuccess(`Appointment ${action}d successfully`);
      fetchAppointments();
      setOpenActionDialog(false);
      setActionNotes("");
    } catch (err) {
      setError(`Failed to ${action} appointment`);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setViewDialog(true);
  };

  const renderAppointments = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Doctor Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment._id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar>{appointment.doctorId?.name?.charAt(0) || 'D'}</Avatar>
                    <Typography>{appointment.doctorId?.name || 'Not Available'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{appointment.doctorId?.department?.name || 'Not Available'}</TableCell>
                <TableCell>{appointment.doctorId?.specialization || 'Not Available'}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(appointment.date), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {appointment.timeSlot}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={appointment.status}
                    color={getStatusColor(appointment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetails(appointment)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderTimeSlots = () => {
    if (!formData.date) {
      return <Typography color="textSecondary">Please select a date first</Typography>;
    }

    if (timeSlotMessage) {
      return <Typography color="error">{timeSlotMessage}</Typography>;
    }

    if (!timeSlots.length) {
      return <Typography color="error">No available time slots for this date</Typography>;
    }

    return (
      <FormControl fullWidth>
        <InputLabel>Select Time</InputLabel>
        <Select
          value={formData.time}
          onChange={(e) => handleTimeChange(e.target.value)}
          label="Select Time"
        >
          {timeSlots.map((slot) => (
            <MenuItem key={slot} value={slot}>
              {format(parse(slot, 'HH:mm', new Date()), 'hh:mm a')}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const renderBookingDialog = () => (
    <Dialog
      open={openDialog}
      onClose={() => setOpenDialog(false)}
      maxWidth="md"
      fullWidth
      aria-labelledby="booking-dialog-title"
    >
      <DialogTitle id="booking-dialog-title">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isRebookingFromState ? 'Rebook Appointment' : 'Book New Appointment'}
          </Typography>
          <IconButton onClick={() => setOpenDialog(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {isRebookingFromState && rebookingDetails && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Previous Appointment: {rebookingDetails.previousDate} at {rebookingDetails.previousTime}<br />
              Doctor: {rebookingDetails.doctorName}<br />
              Department: {rebookingDetails.department}<br />
              Cancellation Reason: {rebookingDetails.cancellationReason}
            </Typography>
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!formData.doctorId || (activeStep === 1 && (!formData.date || !formData.time))}
          >
            Next
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
          >
            {isRebookingFromState ? 'Confirm Rebooking' : 'Book Appointment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1">
          {user?.role === "doctor"
            ? "My Patient Appointments"
            : "My Appointments"}
        </Typography>
        {user?.role === "patient" && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenDialog(true)}
          >
            Book Appointment
          </Button>
        )}
      </Box>

      {isRebookingFromState && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are rebooking a cancelled appointment. Previous details have been pre-filled.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {renderAppointments()}

      {renderBookingDialog()}

      <Dialog open={showLoginDialog} onClose={() => setShowLoginDialog(false)}>
        <DialogTitle>Login Required</DialogTitle>
        <DialogContent>
          <Typography>
            You need to be logged in to book an appointment. Would you like to
            log in now?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoginDialog(false)}>Cancel</Button>
          <Button
            onClick={handleLoginRedirect}
            variant="contained"
            color="primary"
          >
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openActionDialog}
        onClose={() => setOpenActionDialog(false)}
      >
        <DialogTitle>
          {selectedAppointment?.status === "pending" ? "Complete" : "Cancel"}{" "}
          Appointment
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)}>Cancel</Button>
          <Button
            onClick={() =>
              handleAppointmentAction(
                selectedAppointment?._id,
                selectedAppointment?.status === "pending"
                  ? "complete"
                  : "cancel",
                actionNotes
              )
            }
            color={
              selectedAppointment?.status === "pending" ? "success" : "error"
            }
            variant="contained"
          >
            {selectedAppointment?.status === "pending" ? "Complete" : "Cancel"}{" "}
            Appointment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Doctor:</strong> {selectedAppointment.doctorId?.name || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Department:</strong> {selectedAppointment.doctorId?.department?.name || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Specialization:</strong> {selectedAppointment.doctorId?.specialization || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Email:</strong> {selectedAppointment.doctorId?.email || 'Not Available'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Phone:</strong> {selectedAppointment.doctorId?.phone || 'Not Available'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Date:</strong> {format(new Date(selectedAppointment.date), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Time:</strong> {selectedAppointment.timeSlot}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Status:</strong> 
                    <Chip
                      label={selectedAppointment.status}
                      color={getStatusColor(selectedAppointment.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Type:</strong> {selectedAppointment.type}
                  </Typography>
                  {selectedAppointment.symptoms && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Symptoms:</strong>
                      </Typography>
                      <Typography paragraph sx={{ ml: 2 }}>
                        {selectedAppointment.symptoms}
                      </Typography>
                    </>
                  )}
                  {selectedAppointment.notes && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Notes:</strong>
                      </Typography>
                      <Typography paragraph sx={{ ml: 2 }}>
                        {selectedAppointment.notes}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Appointments;
