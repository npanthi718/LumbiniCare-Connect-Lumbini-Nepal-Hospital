const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const prescriptionRoutes = require("./routes/prescription.routes");
const departmentRoutes = require("./routes/department.routes");
const doctorRoutes = require("./routes/doctor.routes");
const adminRoutes = require("./routes/admin.routes");
const patientRoutes = require("./routes/patient.routes");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Response logging middleware
  app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
      console.log(
        `[${new Date().toISOString()}] Response for ${req.method} ${req.url}: ${
          data ? "Success" : "No data"
        }`
      );
      return originalJson.call(this, data);
    };
    next();
  });
}

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s
    });

    if (process.env.NODE_ENV === 'development') {
      console.log("=== MongoDB Connection Details ===");
      console.log(
        `Database URI: ${MONGODB_URI.replace(
          /\/\/[^:]+:[^@]+@/,
          "//<credentials>@"
        )}`
      );
      console.log(`Database Name: ${mongoose.connection.name}`);
      console.log(`Host: ${mongoose.connection.host}`);
      console.log(`Port: ${mongoose.connection.port}`);
      console.log("=================================");
    } else {
      console.log("MongoDB connected successfully");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retrying
      return connectDB(retries - 1);
    } else {
      console.error("Failed to connect to MongoDB after multiple attempts");
      process.exit(1);
    }
  }
};

// Connect to MongoDB
connectDB();

// Add connection error handler
mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

// Add disconnection handler with reconnection logic
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected - attempting to reconnect...");
  connectDB();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patient", patientRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error logging middleware
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} - Error:`, err);
  
  // Don't expose internal errors in production
  const error = process.env.NODE_ENV === 'production' 
    ? 'An internal server error occurred' 
    : err.message;
    
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: error
  });
});

// Start server with graceful shutdown
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed. Disconnecting from MongoDB...');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed. Process terminating...');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
