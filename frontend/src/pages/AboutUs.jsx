import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  CheckCircle as CheckCircleIcon,
  MedicalServices as MedicalServicesIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Healing as HealingIcon,
} from '@mui/icons-material';

const AboutUs = () => {
 

  const managementTeam = [

      {
        name: 'Dr. Sushil Panthi',
        position: 'Chief Executive Officer',
        description: 'Leading the hospital with over 15 years of healthcare management experience.',
        image: '/images/management/CEO.jpg',
      },
      {
        name: 'Dr. Gyan Prasad',
        position: 'Chief Operations Officer',
        description: 'Ensuring hospital operations run smoothly with expertise in healthcare logistics.',
        image: '/images/management/COC.jpg',
      },
      {
        name: 'Dr. Dasrath Chad ',
        position: 'Chief Financial Officer',
        description: 'Managing hospital finances with over a decade of experience in healthcare budgeting.',
        image: '/images/management/CFO.jpg',
      },
      {
        name: 'Dr. Goma Pandey',
        position: 'Chief Medical Officer',
        description: 'Supervising medical staff and fostering excellent patient care practices.',
        image: '/images/management/CMO.jpg',
      },
      {
        name: 'Dr. Sareeta Karki',
        position: 'Chief Nursing Officer',
        description: 'Leading the nursing team to provide quality patient care services.',
        image: '/images/management/CNO.jpg',
      },

      {
        name: 'Dr. Bhagirath Singh',
        position: 'Administrative Director',
        description: 'Overseeing non-medical operations and ensuring administrative processes align with the hospital’s goals.',
        image: '/images/management/AD.jpg',
      },
      
      {
        name: 'Dr. Nawaraj Karki',
        position: 'Hospital Administrator',
        description: 'Overseeing daily administrative tasks to ensure seamless operations.',
        image: '/images/management/HA.jpg',
      },
      {
        name: 'Dr. Samjhana Kharel',
        position: 'Director of Human Resources',
        description: 'Managing recruitment and staff relations to foster a healthy work environment.',
        image: '/images/management/DHR.jpg',
      },
      {
        name: 'Dr. Roshan Bhandari',
        position: 'Director of Patient Services',
        description: 'Ensuring patient satisfaction through streamlined service delivery.',
        image: '/images/management/DPS.jpg',
      },
      {
        name: 'Dr. Pralad Phuyal',
        position: 'Director of Marketing and Public Relations',
        description: 'Promoting hospital services and managing its public image effectively.',
        image: '/images/management/DMPR.jpg',
      },
  ];

  const achievements = [
    'ISO 9001:2015 Certified Healthcare Institution',
    'Best Hospital Award 2022 - Lumbini Province',
    'Excellence in Patient Care - Ministry of Health Recognition',
    'Zero Medical Error Achievement 2023',
    'Community Service Excellence Award',
  ];

  const facilities = [
    'Emergency Department (24/7)',
    'Intensive Care Unit (ICU)',
    'Operation Theaters',
    'Diagnostic Imaging Center',
    'Pathology Laboratory',
    'Pharmacy Services',
    'Specialized Clinics',
    'Rehabilitation Center',
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          About Lumbini Nepal Hospital
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Providing Quality Healthcare Services Since 2010
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
          Located in the heart of Butwal, Lumbini Nepal Hospital has been serving the community
          with dedication and excellence. Our commitment to healthcare innovation and patient
          satisfaction has made us one of the leading healthcare institutions in Lumbini Province.
        </Typography>
      </Box>

      {/* Mission and Vision */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" gutterBottom color="primary">
              Our Mission
            </Typography>
            <Typography paragraph>
              To provide exceptional healthcare services with compassion and dedication,
              ensuring the well-being of our patients and the community we serve in
              Butwal and surrounding areas. We strive to make quality healthcare
              accessible to all while maintaining the highest standards of medical practice.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" gutterBottom color="primary">
              Our Vision
            </Typography>
            <Typography paragraph>
              To be the leading healthcare institution in Lumbini Province, recognized for excellence in
              patient care, medical innovation, and community health improvement. We aim to set
              new standards in healthcare delivery and become a center of excellence for
              medical education and research.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Core Values */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Our Core Values
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <HealingIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" gutterBottom align="center">
                  Compassion
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  We prioritise patient care and their well-being above all else.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <MedicalServicesIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" gutterBottom align="center">
                  Excellence
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  We strive to deliver the highest quality medical services.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" gutterBottom align="center">
                  Education
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  We promote continuous learning and medical training.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <PsychologyIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h6" gutterBottom align="center">
                  Innovation
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  We embrace modern technology to improve patient outcomes.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Achievements */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Achievements
        </Typography>
        <Grid container spacing={3}>
          {achievements.map((achievement, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <EmojiEventsIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="body1" align="center">{achievement}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Management Team */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Management Team
        </Typography>
        <Grid container spacing={3}>
          {managementTeam.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Avatar
                      alt={member.name}
                      src={member.image}
                      sx={{ width: 80, height: 80, margin: '0 auto' }}
                    />
                  </Box>
                  <Typography variant="h6" align="center">{member.name}</Typography>
                  <Typography variant="subtitle2" color="text.secondary" align="center">
                    {member.position}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    {member.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Facilities */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Facilities
        </Typography>
        <Paper elevation={3} sx={{ p: 4 }}>
          <List>
            {facilities.map((facility, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={facility} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default AboutUs;
