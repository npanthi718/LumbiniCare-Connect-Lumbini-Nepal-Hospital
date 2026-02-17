import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalPharmacy as PharmacyIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { format } from 'date-fns';

const PrescriptionDialog = ({ open, onClose, prescription }) => {
  if (!prescription) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="prescription-dialog-title"
    >
      <DialogTitle id="prescription-dialog-title">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Prescription Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Doctor Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {prescription.doctorId?.name || prescription.doctorId?.userId?.name || 'Not Available'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" gutterBottom>
                <strong>Department:</strong> {prescription.doctorId?.department?.name || 'Not Available'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                <strong>Specialization:</strong> {prescription.doctorId?.specialization || 'Not Available'}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" color="primary" gutterBottom>
            Prescription Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                <strong>Date:</strong> {format(new Date(prescription.createdAt), 'MMM dd, yyyy, hh:mm a')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" gutterBottom>
                <strong>Diagnosis:</strong>
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1">{prescription.diagnosis}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Medications
            </Typography>
            {prescription.medications && prescription.medications.length > 0 ? (
              prescription.medications.map((med, index) => (
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
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No medications prescribed
              </Typography>
            )}
          </Box>

          {prescription.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Additional Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1">{prescription.notes}</Typography>
              </Paper>
            </Box>
          )}
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

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patient/prescriptions');
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setError('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPrescription(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

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
        Prescriptions
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        View and manage your prescriptions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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

      <PrescriptionDialog
        open={openDialog}
        onClose={handleCloseDialog}
        prescription={selectedPrescription}
      />
    </Container>
  );
};

export default Prescriptions; 