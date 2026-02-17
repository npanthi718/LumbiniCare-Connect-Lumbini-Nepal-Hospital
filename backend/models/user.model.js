const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    phone: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    // Only hash the password if it has been modified or is new
    if (!this.isModified("password")) {
      return next();
    }

    console.log("Hashing password for user:", this.email);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    console.log("Password hashed successfully for:", this.email);
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      console.error("No password hash found for user:", this.email);
      return false;
    }

    if (!candidatePassword) {
      console.error("No candidate password provided for user:", this.email);
      return false;
    }

    console.log("Comparing password for user:", this.email);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password comparison result for", this.email, ":", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Password comparison error for user", this.email, ":", error);
    return false;
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
