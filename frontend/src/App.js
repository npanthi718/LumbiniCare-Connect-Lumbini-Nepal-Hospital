import React, { Suspense, lazy } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const Departments = lazy(() => import('./pages/Departments'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const DoctorDashboard = lazy(() => import('./pages/doctor/Dashboard'));
const PatientDashboard = lazy(() => import('./pages/patient/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/doctors',
        element: <Doctors />,
      },
      {
        path: '/departments',
        element: <Departments />,
      },
      {
        path: '/aboutus',
        element: <AboutUs />,
      },
      {
        path: '/contact',
        element: <ContactUs />,
      },
      {
        path: '/appointments',
        element: (
          <ProtectedRoute roles={['patient']}>
            <Appointments />
          </ProtectedRoute>
        ),
      },
      {
        path: '/prescriptions',
        element: (
          <ProtectedRoute roles={['patient']}>
            <Prescriptions />
          </ProtectedRoute>
        ),
      },
      {
        path: '/patient/dashboard',
        element: (
          <ProtectedRoute roles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/patient/profile',
        element: (
          <ProtectedRoute roles={['patient']}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/doctor/dashboard',
        element: (
          <ProtectedRoute roles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/doctor/profile',
        element: (
          <ProtectedRoute roles={['doctor']}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/dashboard',
        element: (
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/profile',
        element: (
          <ProtectedRoute roles={['admin']}>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 
