const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// CORS Configuration
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || defaultOrigins.join(','))
  .split(',')
  .map(o => o.trim());

const isDev = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: (origin, callback) => {
    if (isDev) return callback(null, true);
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production' && process.env.LOG_VERBOSE === 'true') {
  app.use(morgan('tiny'));
}

// Authentication middleware
app.use((req, res, next) => {
  // Exclude OPTIONS requests from authentication
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }
  next();
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const adminRoutes = require('./routes/admin.routes');
const departmentRoutes = require('./routes/department.routes');
const contactRoutes = require('./routes/contact.routes');
const userRoutes = require('./routes/user.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/contact', contactRoutes);

// In production, serve the frontend build and provide SPA fallback
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  try {
    if (!fs.existsSync(frontendDist) && process.env.AUTO_BUILD_FRONTEND === 'true') {
      const frontendDir = path.join(__dirname, '../frontend');
      console.log('Frontend dist not found. Building frontend...');
      execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
      execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
      console.log('Frontend build completed.');
    }
  } catch (buildErr) {
    console.error('Frontend build failed:', buildErr.message);
  }
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'ok',
    base: '/api',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/doctors',
      '/api/patients',
      '/api/appointments',
      '/api/prescriptions',
      '/api/admin',
      '/api/departments',
      '/api/contact'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Hospital Management System API',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/doctors',
      '/api/patients',
      '/api/appointments',
      '/api/prescriptions',
      '/api/admin',
      '/api/departments',
      '/api/contact'
    ],
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hms';

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  connectTimeoutMS: 30000,
  autoIndex: true,
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('=== MongoDB Connection Details ===');
    console.log('Connected to:', MONGODB_URI.split('@')[1].split('/')[0]);
    console.log('Database:', MONGODB_URI.split('/').pop().split('?')[0]);
    console.log('=================================');
    
    const basePort = parseInt(process.env.PORT, 10) || 5000;
    const startServer = (p) => {
      try {
        const server = app.listen(p, () => {
          console.log(`Server is running on port ${p}`);
        });
        server.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${p} in use, trying ${p + 1}...`);
            startServer(p + 1);
          } else {
            console.error('Server start error:', err);
            process.exit(1);
          }
        });
      } catch (err) {
        console.error('Server start error:', err);
        process.exit(1);
      }
    };
    startServer(basePort);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

module.exports = app; 
