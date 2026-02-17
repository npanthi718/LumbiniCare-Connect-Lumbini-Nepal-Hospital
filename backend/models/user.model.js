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

userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    // Only hash the password if it has been modified or is new
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      return false;
    }

    if (!candidatePassword) {
      return false;
    }

    // If stored password is not a bcrypt hash, fallback to plain comparison
    if (typeof this.password === 'string' && !this.password.startsWith('$2')) {
      return candidatePassword === this.password;
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    return false;
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
