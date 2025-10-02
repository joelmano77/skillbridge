const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    required: true,
    enum: ['volunteer', 'ngo']
  },
  
  // Volunteer specific fields
  firstName: {
    type: String,
    required: function() { return this.userType === 'volunteer'; }
  },
  lastName: {
    type: String,
    required: function() { return this.userType === 'volunteer'; }
  },
  
  // NGO specific fields
  organizationName: {
    type: String,
    required: function() { return this.userType === 'ngo'; }
  },
  contactPerson: {
    type: String,
    required: function() { return this.userType === 'ngo'; }
  },
  
  // Common profile fields
  profilePicture: String,
  profile: {
    phone: String,
    location: String,
    website: String,

    // Volunteer specific profile
    bio: String,
    skills: [String],
    experience: {
      type: String,
      enum: ['', 'beginner', 'intermediate', 'advanced', 'expert']
    },
    availability: {
      type: String,
      enum: ['', 'few-hours-week', 'few-hours-month', 'part-time', 'full-time', 'project-based']
    },
    interests: [String],

    // NGO specific profile
    description: String,
    mission: String,
    focusAreas: [String],
    size: {
      type: String,
      enum: ['', 'small', 'medium', 'large', 'enterprise']
    },
    foundedYear: Number,
    registrationNumber: String
  },
  
  // Authentication and verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Timestamps
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
// Note: email index is already created by unique: true
userSchema.index({ userType: 1 });
userSchema.index({ 'profile.skills': 1 });
userSchema.index({ 'profile.focusAreas': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove sensitive information
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  
  return userObject;
};

// Virtual for name
userSchema.virtual('name').get(function() {
  if (this.userType === 'volunteer') {
    return `${this.firstName} ${this.lastName}`.trim();
  } else if (this.userType === 'ngo') {
    return this.organizationName;
  }
  return this.email; // fallback
});

// Virtual for role (alias for userType)
userSchema.virtual('role').get(function() {
  return this.userType;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);
