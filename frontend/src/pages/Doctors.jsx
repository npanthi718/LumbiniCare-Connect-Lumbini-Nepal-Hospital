import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  School,
  EmojiEvents,
} from "@mui/icons-material";
import api from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const Doctors = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(
    location.state?.department || ""
  );
  const [departments, setDepartments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/doctors");
        const items = Array.isArray(response.data)
          ? response.data
          : (response.data?.items || []);
        console.log("Fetched doctors:", items);
        if (Array.isArray(items)) {
          const doctorsData = items.map((doctor) => ({
            ...doctor,
            name: doctor.userId?.name || doctor.user?.name || "Unknown Doctor",
            email: doctor.userId?.email || doctor.user?.email || "N/A",
            profilePhoto: doctor.userId?.profilePhoto || doctor.user?.profilePhoto || "",
            education: doctor.education || [],
            languages: doctor.languages || [],
            achievements: doctor.achievements || [],
            publications: doctor.publications || [],
            ratings: { overall: doctor.rating || 0, totalReviews: doctor.totalReviews || 0 }
          }));
          setDoctors(doctorsData);
          // If we have a department from navigation state, filter immediately
          if (location.state?.department) {
            setFilteredDoctors(
              doctorsData.filter(
                (doctor) => doctor.department?.name === location.state.department
              )
            );
          } else {
            setFilteredDoctors(doctorsData);
          }
        } else {
          setError("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to fetch doctors. Please try again later.");
        setDoctors([]);
        setFilteredDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await api.get("/departments");
        if (response.data && Array.isArray(response.data)) {
          setDepartments(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        setDepartments([]);
      }
    };

    fetchDoctors();
    fetchDepartments();
  }, [location.state?.department]);

  useEffect(() => {
    if (!doctors.length) return;

    let filtered = [...doctors];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doctor) =>
          doctor.userId?.name?.toLowerCase().includes(query) ||
          doctor.specialization?.toLowerCase().includes(query) ||
          doctor.department?.name?.toLowerCase().includes(query)
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(
        (doctor) => doctor.department?.name === selectedDepartment
      );
    }

    setFilteredDoctors(filtered);
  }, [searchQuery, selectedDepartment, doctors]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    setSelectedDepartment(department);
    // Update the URL state without full page reload
    navigate("/doctors", {
      state: { department },
      replace: true,
    });
  };

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenDialog(true);
    (async () => {
      try {
        const res = await api.get(`/reviews/doctor/${doctor._id}`);
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch {
        setReviews([]);
      }
    })();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDoctor(null);
  };

  const handleBookAppointment = (doctor) => {
    navigate("/appointments", {
      state: {
        doctorId: doctor._id,
        doctorDetails: {
          name: doctor.userId?.name,
          department: doctor.department?.name,
          specialization: doctor.specialization,
          experience: doctor.experience,
          consultationFee: doctor.consultationFee,
        },
      },
    });
  };

  const defaultDoctorImage =
    "https://img.freepik.com/free-photo/doctor-with-his-arms-crossed-white-background_1368-5790.jpg";

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Our Expert Doctors
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Our Expert Doctors
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Our Expert Doctors
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Find and book appointments with our experienced medical professionals
      </Typography>

      {/* Search and Filter Section */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search doctors"
            placeholder="Search by name, specialization, or department"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
              endAdornment: searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery("")}>
                  <CloseIcon />
                </IconButton>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              label="Department"
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept._id} value={dept.name}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Doctors Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : filteredDoctors.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              No doctors found matching your criteria. Please try a different
              search or filter.
            </Alert>
          </Grid>
        ) : (
          filteredDoctors.map((doctor) => (
            <Grid item xs={12} sm={6} md={4} key={doctor._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-4px)",
                    transition: "all 0.3s ease-in-out",
                  },
                }}
              >
                <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <Box
                    component="img"
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      mr: 2,
                    }}
                    src={doctor.profilePhoto || defaultDoctorImage}
                    alt={doctor.name}
                    onError={(e) => {
                      e.target.src = defaultDoctorImage;
                    }}
                  />
                  <Box>
                    <Typography variant="h6">{doctor.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doctor.department?.name || "General"} •{" "}
                      {doctor.specialization || "Consultant"}
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Ratings
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <Rating
                          name="doctor-rating"
                          value={doctor.ratings?.overall || 0}
                          precision={0.5}
                          readOnly
                          size="small"
                        />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          ({doctor.ratings?.totalReviews || 0} reviews)
                        </Typography>
                      </Box>
                    </Grid>

                    {doctor.education?.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Education
                        </Typography>
                        <List dense>
                          {doctor.education.map((edu, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemIcon>
                                <School fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={edu.degree}
                                secondary={`${edu.institution} • ${edu.year}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {doctor.languages?.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Languages
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {doctor.languages.map((lang, idx) => (
                            <Chip key={idx} label={lang} size="small" />
                          ))}
                        </Box>
                      </Grid>
                    )}

                    {doctor.achievements?.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Achievements
                        </Typography>
                        <List dense>
                          {doctor.achievements.map((ach, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemIcon>
                                <EmojiEvents fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  typeof ach === 'string'
                                    ? ach
                                    : [ach.title, ach.year].filter(Boolean).join(' • ')
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>

                <Divider />
                <CardActions sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    onClick={() => handleViewDetails(doctor)}
                  >
                    View Details
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => handleBookAppointment(doctor)}
                  >
                    Book Appointment
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth fullScreen={fullScreen}>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Doctor Details</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDoctor ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    component="img"
                    sx={{ width: 140, height: 140, borderRadius: "50%" }}
                    src={selectedDoctor.profilePhoto || defaultDoctorImage}
                    alt={selectedDoctor.name}
                    onError={(e) => {
                      e.target.src = defaultDoctorImage;
                    }}
                  />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {selectedDoctor.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDoctor.department?.name || "General"} •{" "}
                    {selectedDoctor.specialization || "Consultant"}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" gutterBottom>
                  Qualifications & Details
                </Typography>
                <List dense>
                  {selectedDoctor.education?.map((edu, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <School fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={edu.degree}
                        secondary={`${edu.institution} • ${edu.year}`}
                      />
                    </ListItem>
                  ))}
                  <ListItem>
                    <ListItemText
                      primary="Available for Emergency"
                      secondary={selectedDoctor.emergencyAvailable ? "Yes" : "No"}
                    />
                  </ListItem>
                </List>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Languages
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {selectedDoctor.languages?.map((lang, idx) => (
                    <Chip key={idx} label={lang} size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Reviews</Typography>
                {reviews.length === 0 ? (
                  <Typography color="text.secondary">No reviews yet</Typography>
                ) : (
                  <List>
                    {reviews.map((r) => (
                      <ListItem key={r._id} alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Rating value={Number(r.rating)} readOnly />
                        </ListItemIcon>
                        <ListItemText
                          primary={r.comment || 'No comment'}
                          secondary={`${new Date(r.createdAt).toLocaleDateString()}`}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingReview(r);
                              setEditRating(Number(r.rating) || 0);
                              setEditComment(r.comment || '');
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={async () => {
                              try {
                                await api.delete(`/reviews/${r._id}`);
                                setReviews((prev) => prev.filter((x) => x._id !== r._id));
                              } catch (err) {
                                setError(err.response?.data?.message || 'Failed to delete review');
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>
            </Grid>
          ) : (
            <Typography>No doctor selected</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedDoctor && (
            <Button variant="contained" onClick={() => handleBookAppointment(selectedDoctor)}>
              Book Appointment
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Dialog open={!!editingReview} onClose={() => setEditingReview(null)} maxWidth="sm" fullWidth fullScreen={fullScreen}>
        <DialogTitle>Edit Review</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Rating value={editRating} onChange={(_, v) => setEditRating(v || 0)} />
          </Box>
          <TextField
            label="Comment"
            fullWidth
            multiline
            minRows={3}
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingReview(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!editingReview) return;
              try {
                await api.patch(`/reviews/${editingReview._id}`, { rating: editRating, comment: editComment });
                setReviews((prev) => prev.map((x) => x._id === editingReview._id ? { ...x, rating: editRating, comment: editComment } : x));
                setEditingReview(null);
              } catch (err) {
                setError(err.response?.data?.message || 'Failed to update review');
              }
            }}
            disabled={!editRating}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Doctors;
