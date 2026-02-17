const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user.model");
const Doctor = require("../models/doctor.model");
const { authenticateToken } = require("../middleware/auth");

// Validation middleware
const validateRegistration = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role").isIn(["patient", "doctor", "admin"]).withMessage("Invalid role"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Register new user
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      phone,
      address,
    });

    await user.save();

    // If role is doctor, create doctor profile
    if (role === "doctor") {
      const doctor = new Doctor({
        userId: user._id,
        specialization: req.body.specialization,
        department: req.body.department,
        experience: req.body.experience,
        education: req.body.education,
        license: req.body.license,
        consultationFee: req.body.consultationFee,
      });
      await doctor.save();
    }

    // Create token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});

// Login user
router.post("/login", validateLogin, async (req, res) => {
  try {
    console.log("Login attempt with body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log("Attempting login for email:", email);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Found user:", {
      id: user._id,
      role: user.role,
      email: user.email,
      hasPassword: !!user.password
    });

    // Check password
    try {
      const isMatch = await user.comparePassword(password);
      console.log("Password comparison result:", isMatch);

      if (!isMatch) {
        console.log("Password does not match for user:", user._id);
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (pwError) {
      console.error("Password comparison error:", pwError);
      return res.status(500).json({ message: "Error verifying password" });
    }

    // Create token
    const token = jwt.sign(
      { 
        _id: user._id, 
        role: user.role,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log("Login successful for user:", {
      id: user._id,
      role: user.role,
      email: user.email
    });

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Error logging in", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
});

// Update password
router.put("/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset password (temporary route for fixing password issues)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
});

module.exports = router;
