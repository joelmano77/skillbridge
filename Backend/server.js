const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

// Import models
const User = require('./models/User');
const Opportunity = require('./models/Opportunity');
const Application = require('./models/Application');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Allow localhost on any port during development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port during development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow specific production origins
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5174',  // In case 5173 is busy
      'http://localhost:5175',  // In case 5174 is busy
      'https://skillbridge-fpz3.onrender.com'  // Deployed frontend
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Helper functions
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Authentication middleware
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'No user found with this token'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error in authentication'
    });
  }
};

// Authentication Routes
const { sendOTPEmail, sendApplicationNotificationEmail, sendStatusUpdateNotificationEmail, sendOpportunityMatchNotificationEmail } = require('./src/utils/emailService');
const crypto = require('crypto');

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, password: password ? '[PROVIDED]' : '[MISSING]' });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const user = await User.findByEmail(email);
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('Testing password against hash...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    const token = generateToken(user._id);
    const userProfile = user.getPublicProfile();

    res.status(200).json({
      success: true,
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging in'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      userType,
      firstName,
      lastName,
      organizationName,
      contactPerson,
      ...profileData
    } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, and user type'
      });
    }

    if (userType === 'volunteer' && (!firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        error: 'First and last name are required for volunteers'
      });
    }

    if (userType === 'ngo' && (!organizationName || !contactPerson)) {
      return res.status(400).json({
        success: false,
        error: 'Organization name and contact person are required for NGOs'
      });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'email already registered'
      });
    }

    // Create user data object
    const userData = {
      email: email.toLowerCase(),
      password,
      userType,
      firstName,
      lastName,
      organizationName,
      contactPerson,
      profile: {
        phone: profileData.phone || '',
        location: profileData.location || '',
        website: profileData.website || '',
        bio: profileData.bio || '',
        skills: profileData.skills || [],
        experience: profileData.experience || '',
        availability: profileData.availability || '',
        interests: profileData.interests || [],
        description: profileData.description || '',
        mission: profileData.mission || '',
        focusAreas: profileData.focusAreas || [],
        size: profileData.size || '',
        foundedYear: profileData.foundedYear || null,
        registrationNumber: profileData.registrationNumber || ''
      }
    };

    const newUser = new User(userData);
    await newUser.save();

    const token = generateToken(newUser._id);
    const userProfile = newUser.getPublicProfile();

    res.status(201).json({
      success: true,
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating user account'
    });
  }
});

// Get current user
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const userProfile = req.user.getPublicProfile();
    res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user data'
    });
  }
});

// Forgot password - send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // For security, do not reveal if email exists or not
      return res.status(200).json({ success: true, message: 'If the email exists, an OTP has been sent' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiry (15 minutes)
    user.passwordResetToken = otp;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Error processing forgot password request' });
  }
});

// Reset password - verify OTP and update password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid email or OTP' });
    }

    if (!user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({ success: false, error: 'No password reset request found' });
    }

    if (user.passwordResetToken !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    // Update password and clear reset token fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Error resetting password' });
  }
});

// User management routes
app.put('/api/users/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updates.email;
    delete updates.password;
    delete updates.userType;
    delete updates._id;
    delete updates.__v;

    // Update user profile
    Object.keys(updates).forEach(key => {
      if (key === 'profile' && updates.profile) {
        // Merge profile data
        req.user.profile = { ...req.user.profile, ...updates.profile };
      } else if (key !== 'profile') {
        req.user[key] = updates[key];
      }
    });

    await req.user.save();
    const userProfile = req.user.getPublicProfile();

    res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating profile'
    });
  }
});

// Get volunteers (for NGOs and other users)
app.get('/api/users/volunteers', protect, async (req, res) => {
  try {
    const { skills, interests, experience, availability, location } = req.query;
    
    let query = { userType: 'volunteer', isActive: true };

    // Build MongoDB query based on filters
    if (skills) {
      const skillsArray = skills.split(',');
      query['profile.skills'] = { $in: skillsArray };
    }

    if (interests) {
      const interestsArray = interests.split(',');
      query['profile.interests'] = { $in: interestsArray };
    }

    if (experience) {
      query['profile.experience'] = experience;
    }

    if (availability) {
      query['profile.availability'] = availability;
    }

    if (location) {
      query['profile.location'] = { $regex: location, $options: 'i' };
    }

    const volunteers = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching volunteers'
    });
  }
});

// Get NGOs (for volunteers)
app.get('/api/users/ngos', protect, async (req, res) => {
  try {
    const { focusAreas, size, location } = req.query;

    let query = { userType: 'ngo', isActive: true };

    // Build MongoDB query based on filters
    if (focusAreas) {
      const focusAreasArray = focusAreas.split(',');
      query['profile.focusAreas'] = { $in: focusAreasArray };
    }

    if (size) {
      query['profile.size'] = size;
    }

    if (location) {
      query['profile.location'] = { $regex: location, $options: 'i' };
    }

    const ngos = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: ngos.length,
      data: ngos
    });
  } catch (error) {
    console.error('Get NGOs error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching NGOs'
    });
  }
});

// ==================== OPPORTUNITY ROUTES ====================

// Get all opportunities (with optional filters)
app.get('/api/opportunities', async (req, res) => {
  try {
    const { skills, location, status, duration, ngo_id, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (skills) filters.skills = skills;
    if (location) filters.location = location;
    if (status) filters.status = status;
    if (duration) filters.duration = duration;
    if (ngo_id) filters.ngo_id = ngo_id;

    const skip = (page - 1) * limit;
    const opportunities = await Opportunity.searchWithFilters(filters)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Count total for the applied filters
    const totalQuery = {};
    if (filters.status) {
      totalQuery.status = filters.status;
    } else {
      totalQuery.status = 'open';
    }
    if (filters.skills) {
      totalQuery.required_skills = { $elemMatch: { $regex: filters.skills, $options: 'i' } };
    }
    if (filters.location) {
      totalQuery.location = { $regex: filters.location, $options: 'i' };
    }
    if (filters.duration) {
      totalQuery.duration = { $regex: filters.duration, $options: 'i' };
    }
    if (filters.ngo_id) {
      totalQuery.ngo_id = filters.ngo_id;
    }
    const total = await Opportunity.countDocuments(totalQuery);

    res.status(200).json({
      success: true,
      count: opportunities.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: opportunities
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching opportunities'
    });
  }
});

// Get single opportunity
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('ngo_id', 'organizationName profile.location profile.website profile.description');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found'
      });
    }

    res.status(200).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching opportunity'
    });
  }
});

// Create opportunity (NGO only)
app.post('/api/opportunities', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'ngo') {
      return res.status(403).json({
        success: false,
        error: 'Only NGOs can create opportunities'
      });
    }

    const { title, description, required_skills, duration, location } = req.body;

    if (!title || !description || !required_skills || !duration || !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    const opportunity = new Opportunity({
      ngo_id: req.user._id,
      title,
      description,
      required_skills,
      duration,
      location
    });

    await opportunity.save();

    res.status(201).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating opportunity'
    });
  }
});

// Update opportunity (NGO only, their own)
app.put('/api/opportunities/:id', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'ngo') {
      return res.status(403).json({
        success: false,
        error: 'Only NGOs can update opportunities'
      });
    }

    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found'
      });
    }

    if (opportunity.ngo_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own opportunities'
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'ngo_id' && key !== '_id') {
        opportunity[key] = updates[key];
      }
    });

    await opportunity.save();

    res.status(200).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating opportunity'
    });
  }
});

// Delete opportunity (NGO only, their own)
app.delete('/api/opportunities/:id', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'ngo') {
      return res.status(403).json({
        success: false,
        error: 'Only NGOs can delete opportunities'
      });
    }

    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found'
      });
    }

    if (opportunity.ngo_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own opportunities'
      });
    }

    await opportunity.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting opportunity'
    });
  }
});

// ==================== APPLICATION ROUTES ====================

// Create application (Volunteer only)
app.post('/api/applications', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'volunteer') {
      return res.status(403).json({
        success: false,
        error: 'Only volunteers can apply for opportunities'
      });
    }

    const { opportunity_id, message } = req.body;

    if (!opportunity_id) {
      return res.status(400).json({
        success: false,
        error: 'Please provide opportunity ID'
      });
    }

    // Check if opportunity exists and is open
    const opportunity = await Opportunity.findById(opportunity_id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found'
      });
    }

    if (opportunity.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'This opportunity is no longer accepting applications'
      });
    }

    // Check if volunteer already applied
    const existingApplication = await Application.hasApplied(opportunity_id, req.user._id);
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied for this opportunity'
      });
    }

    const application = new Application({
      opportunity_id,
      volunteer_id: req.user._id,
      message: message || ''
    });

    await application.save();

    // Create notification for NGO about new application
    try {
      const notification = await Notification.createApplicationNotification(
        req.user._id,
        opportunity.ngo_id,
        opportunity.title
      );

      // Send real-time notification if NGO is online
      io.to(`user_${opportunity.ngo_id}`).emit('newNotification', notification);
      
      console.log(`📢 Application notification sent to NGO ${opportunity.ngo_id}`);

      // Send email notification to NGO
      try {
        const ngo = await User.findById(opportunity.ngo_id);
        if (ngo && ngo.email) {
          await sendApplicationNotificationEmail(
            ngo.email,
            ngo.organizationName || ngo.firstName || 'NGO',
            req.user.firstName + ' ' + req.user.lastName,
            opportunity.title
          );
          console.log(`📧 Application email sent to NGO ${ngo.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send application email:', emailError);
      }
    } catch (notificationError) {
      console.error('Failed to create application notification:', notificationError);
      // Don't fail the application creation if notification fails
    }

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating application'
    });
  }
});

// Get active volunteers count (for all users)
app.get('/api/volunteers/active-count', protect, async (req, res) => {
  try {
    // Count unique volunteers who have applications
    const activeVolunteersCount = await Application.distinct('volunteer_id').then(ids => ids.length);

    res.status(200).json({
      success: true,
      count: activeVolunteersCount
    });
  } catch (error) {
    console.error('Get active volunteers count error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching active volunteers count'
    });
  }
});

// Get applications for NGO's opportunities
app.get('/api/applications', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'ngo') {
      return res.status(403).json({
        success: false,
        error: 'Only NGOs can view applications'
      });
    }

    // Find all opportunities by this NGO
    const opportunities = await Opportunity.find({ ngo_id: req.user._id });
    const opportunityIds = opportunities.map(opp => opp._id);

    const applications = await Application.find({ opportunity_id: { $in: opportunityIds } })
      .populate('opportunity_id', 'title description')
      .populate('volunteer_id', 'firstName lastName profile.skills profile.experience profile.location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching applications'
    });
  }
});

// Get applications for the current volunteer
app.get('/api/applications/my', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'volunteer') {
      return res.status(403).json({
        success: false,
        error: 'Only volunteers can view their own applications'
      });
    }

    const applications = await Application.find({ volunteer_id: req.user._id })
      .populate({
        path: 'opportunity_id',
        select: 'title description location required_skills',
        populate: {
          path: 'ngo_id',
          select: 'organizationName'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching applications'
    });
  }
});

// Update application status (NGO only)
app.put('/api/applications/:id', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'ngo') {
      return res.status(403).json({
        success: false,
        error: 'Only NGOs can update application status'
      });
    }

    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const application = await Application.findById(req.params.id)
      .populate('opportunity_id', 'ngo_id');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if NGO owns the opportunity
    if (application.opportunity_id.ngo_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only update applications for your own opportunities'
      });
    }

    application.status = status;
    await application.save();

    // Create notification for volunteer about status update
    try {
      if (status !== 'pending') { // Only notify for accepted/rejected, not pending
        await application.populate('opportunity_id', 'title');
        
        const notification = await Notification.createStatusUpdateNotification(
          req.user._id,
          application.volunteer_id,
          status,
          application.opportunity_id.title
        );

        // Send real-time notification if volunteer is online
        io.to(`user_${application.volunteer_id}`).emit('newNotification', notification);
        
        console.log(`📢 Status update notification sent to volunteer ${application.volunteer_id}: ${status}`);

        // Send email notification to volunteer
        try {
          const volunteer = await User.findById(application.volunteer_id);
          if (volunteer && volunteer.email) {
            await sendStatusUpdateNotificationEmail(
              volunteer.email,
              volunteer.firstName + ' ' + volunteer.lastName,
              status,
              application.opportunity_id.title,
              req.user.organizationName || req.user.firstName || 'NGO'
            );
            console.log(`📧 Status update email sent to volunteer ${volunteer.email}: ${status}`);
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
        }
      }
    } catch (notificationError) {
      console.error('Failed to create status update notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating application'
    });
  }
});

// Delete/withdraw application (Volunteer only)
app.delete('/api/applications/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if the user is the applicant
    if (application.volunteer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this application'
      });
    }

    // Only allow deletion if status is pending
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot withdraw application that is not pending'
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// ==========================================
// MESSAGE ROUTES
// ==========================================

// Send a new message
app.post('/api/messages', protect, async (req, res) => {
  try {
    const { receiverId, message, messageType = 'text', metadata } = req.body;
    
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID and message are required'
      });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }
    
    const newMessage = new Message({
      senderId: req.user.id,
      receiverId,
      content: message,
      messageType,
      metadata,
      status: 'sent'
    });
    
    await newMessage.save();
    
    // Populate sender and receiver details
    await newMessage.populate('senderId', 'firstName lastName profilePicture name');
    await newMessage.populate('receiverId', 'firstName lastName profilePicture name');
    
    // Format message for frontend
    const formattedMessage = {
      _id: newMessage._id,
      message: newMessage.content,
      sender: {
        _id: newMessage.senderId._id,
        name: newMessage.senderId.name || `${newMessage.senderId.firstName} ${newMessage.senderId.lastName}`,
        profilePicture: newMessage.senderId.profilePicture
      },
      receiver: {
        _id: newMessage.receiverId._id,
        name: newMessage.receiverId.name || `${newMessage.receiverId.firstName} ${newMessage.receiverId.lastName}`,
        profilePicture: newMessage.receiverId.profilePicture
      },
      status: newMessage.status,
      messageType: newMessage.messageType,
      isRead: newMessage.isRead,
      createdAt: newMessage.createdAt,
      conversationId: newMessage.conversationId
    };
    
    // Emit real-time message via Socket.IO to receiver
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new-message', formattedMessage);
      // Update status to delivered
      newMessage.status = 'delivered';
      newMessage.deliveredAt = new Date();
      await newMessage.save();
      formattedMessage.status = 'delivered';
      
      // Notify sender about delivery
      const senderSocketId = connectedUsers.get(req.user.id);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message-delivered', { 
          messageId: newMessage._id,
          status: 'delivered'
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: formattedMessage
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get conversation between two users
app.get('/api/messages/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current user ID'
      });
    }
    
    const messages = await Message.getConversation(
      req.user.id,
      userId,
      parseInt(limit),
      parseInt(skip)
    );
    
    // Mark messages as read
    await Message.markConversationAsRead(userId, req.user.id);
    
    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all conversations for the current user
app.get('/api/messages/conversations', protect, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user.id);
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations'
    });
  }
});

// Mark messages as read
app.put('/api/messages/read/:senderId', protect, async (req, res) => {
  try {
    const { senderId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender ID format'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current user ID'
      });
    }
    
    await Message.markConversationAsRead(senderId, req.user.id);
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a message
app.delete('/api/messages/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Check if user is sender or receiver
    if (message.senderId.toString() !== req.user.id && message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this message'
      });
    }
    
    // Add user to deletedBy array instead of actually deleting
    message.deletedBy.push({
      user: req.user.id,
      deletedAt: new Date()
    });
    
    // If both users deleted, mark as deleted
    if (message.deletedBy.length === 2) {
      message.isDeleted = true;
    }
    
    await message.save();
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

// Get user notifications
app.get('/api/notifications', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const notifications = await Notification.getUserNotifications(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      unreadOnly === 'true'
    );
    
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications'
    });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', protect, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access this notification'
      });
    }
    
    await notification.markAsRead();
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
app.put('/api/notifications/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Get unread notification count
app.get('/api/notifications/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      count: unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// Delete notification
app.delete('/api/notifications/:notificationId', protect, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this notification'
      });
    }
    
    notification.isDeleted = true;
    await notification.save();
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// Suggest opportunity to volunteer (NGO only)
app.post('/api/notifications/suggest-opportunity', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'ngo') {
      return res.status(403).json({
        success: false,
        error: 'Only NGOs can suggest opportunities'
      });
    }

    const { volunteerId, opportunityId } = req.body;

    if (!volunteerId || !opportunityId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide volunteer ID and opportunity ID'
      });
    }

    // Verify opportunity belongs to the NGO
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found'
      });
    }

    if (opportunity.ngo_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only suggest your own opportunities'
      });
    }

    // Verify volunteer exists
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.userType !== 'volunteer') {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    // Create opportunity match notification
    const notification = await Notification.createOpportunityMatchNotification(
      req.user._id,
      volunteerId,
      opportunity.title
    );

    // Send real-time notification if volunteer is online
    io.to(`user_${volunteerId}`).emit('newNotification', notification);

    // Send email notification to volunteer
    try {
      if (volunteer.email) {
        await sendOpportunityMatchNotificationEmail(
          volunteer.email,
          volunteer.firstName + ' ' + volunteer.lastName,
          opportunity.title,
          req.user.organizationName || req.user.firstName || 'NGO'
        );
        console.log(`📧 Opportunity match email sent to volunteer ${volunteer.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send opportunity match email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Opportunity suggested successfully',
      data: notification
    });

    console.log(`📢 Opportunity "${opportunity.title}" suggested to volunteer ${volunteerId} by NGO ${req.user._id}`);
  } catch (error) {
    console.error('Suggest opportunity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest opportunity'
    });
  }
});

// =====================================
// USER DISCOVERY & SEARCH ROUTES
// =====================================

// Search for users (volunteers/NGOs) to start conversations
app.get('/api/users/discover', protect, async (req, res) => {
  try {
    const { 
      role, 
      search, 
      skills, 
      location, 
      page = 1, 
      limit = 20 
    } = req.query;

    // Build search criteria
    const criteria = {
      isActive: true,
      _id: { $ne: req.user._id } // Exclude current user
    };

    // Filter by role (opposite role for chat discovery)
    if (role) {
      criteria.userType = role;
    } else {
      // Default: show opposite role
      criteria.userType = req.user.userType === 'volunteer' ? 'ngo' : 'volunteer';
    }

    // Text search in name, organization, or description
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      criteria.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { organizationName: searchRegex },
        { bio: searchRegex },
        { description: searchRegex }
      ];
    }

    // Filter by skills (for volunteers)
    if (skills && criteria.userType === 'volunteer') {
      const skillsArray = skills.split(',').map(s => s.trim());
      criteria.skills = { $in: skillsArray };
    }

    // Filter by location
    if (location) {
      const locationRegex = new RegExp(location.trim(), 'i');
      criteria.$or = criteria.$or || [];
      criteria.$or.push(
        { city: locationRegex },
        { state: locationRegex },
        { country: locationRegex }
      );
    }

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(criteria)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(criteria);

    // Format response
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.userType === 'volunteer' 
        ? `${user.firstName} ${user.lastName}` 
        : user.organizationName,
      role: user.userType,
      profilePicture: user.profilePicture,
      bio: user.bio || user.description,
      skills: user.skills || [],
      location: [user.city, user.state, user.country].filter(Boolean).join(', '),
      verified: user.isActive,
      lastActive: user.lastLogin || user.createdAt,
      rating: user.rating || 0,
      projectsCompleted: user.projectsCompleted || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('User discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover users'
    });
  }
});

// Get detailed profile for a specific user
app.get('/api/users/profile/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -__v')
      .populate('applications')
      .populate('opportunities');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Format detailed profile
    const profile = {
      _id: user._id,
      name: user.userType === 'volunteer' 
        ? `${user.firstName} ${user.lastName}` 
        : user.organizationName,
      role: user.userType,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      bio: user.bio || user.description,
      skills: user.skills || [],
      location: {
        city: user.city,
        state: user.state,
        country: user.country,
        address: user.address
      },
      verified: user.isActive,
      joinedDate: user.createdAt,
      lastActive: user.lastLogin || user.createdAt,
      rating: user.rating || 0,
      projectsCompleted: user.projectsCompleted || 0,
      
      // Role-specific data
      ...(user.userType === 'volunteer' && {
        experience: user.experience,
        availability: user.availability,
        interests: user.interests || []
      }),
      
      ...(user.userType === 'ngo' && {
        website: user.website,
        established: user.established,
        focusAreas: user.focusAreas || [],
        teamSize: user.teamSize
      })
    };

    res.status(200).json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Start a new conversation with a user
app.post('/api/conversations/start', protect, async (req, res) => {
  try {
    const { userId, initialMessage } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Verify the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if conversation already exists
    const existingMessage = await Message.findOne({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    });

    if (existingMessage) {
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        data: {
          conversationExists: true,
          otherUser: {
            _id: otherUser._id,
            name: otherUser.userType === 'volunteer' 
              ? `${otherUser.firstName} ${otherUser.lastName}` 
              : otherUser.organizationName,
            role: otherUser.userType,
            profilePicture: otherUser.profilePicture
          }
        }
      });
    }

    // Create initial message if provided
    let firstMessage = null;
    if (initialMessage && initialMessage.trim()) {
      firstMessage = new Message({
        sender: req.user._id,
        receiver: userId,
        message: initialMessage.trim(),
        messageType: 'text',
        isRead: false
      });

      await firstMessage.save();
      await firstMessage.populate(['sender', 'receiver']);

      // Send real-time message
      io.to(`user_${userId}`).emit('newMessage', firstMessage);

      // Create message notification
      const notification = await Notification.createMessageNotification(
        req.user._id,
        userId,
        initialMessage.trim()
      );

      // Send real-time notification
      io.to(`user_${userId}`).emit('newNotification', notification);

      console.log(`💬 New conversation started between ${req.user._id} and ${userId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Conversation started successfully',
      data: {
        conversationExists: false,
        firstMessage,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.userType === 'volunteer' 
            ? `${otherUser.firstName} ${otherUser.lastName}` 
            : otherUser.organizationName,
          role: otherUser.userType,
          profilePicture: otherUser.profilePicture
        }
      }
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  try {
    const userCount = await User.countDocuments({ isActive: true });
    const volunteerCount = await User.countDocuments({ userType: 'volunteer', isActive: true });
    const ngoCount = await User.countDocuments({ userType: 'ngo', isActive: true });
    const opportunityCount = await Opportunity.countDocuments();
    const applicationCount = await Application.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Server is running',
      status: {
        server: 'healthy',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      users: {
        total: userCount,
        volunteers: volunteerCount,
        ngos: ngoCount
      },
      opportunities: {
        total: opportunityCount,
        open: await Opportunity.countDocuments({ status: 'open' })
      },
      applications: {
        total: applicationCount,
        pending: await Application.countDocuments({ status: 'pending' }),
        accepted: await Application.countDocuments({ status: 'accepted' }),
        rejected: await Application.countDocuments({ status: 'rejected' })
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      status: {
        server: 'healthy',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      users: {
        total: 0,
        volunteers: 0,
        ngos: 0
      },
      opportunities: {
        total: 0,
        open: 0
      },
      applications: {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0
      }
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SkillBridge Backend API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password'
      },
      users: {
        profile: 'PUT /api/users/profile',
        volunteers: 'GET /api/users/volunteers',
        ngos: 'GET /api/users/ngos'
      },
      opportunities: {
        list: 'GET /api/opportunities',
        get: 'GET /api/opportunities/:id',
        create: 'POST /api/opportunities',
        update: 'PUT /api/opportunities/:id',
        delete: 'DELETE /api/opportunities/:id'
      },
      applications: {
        create: 'POST /api/applications',
        list: 'GET /api/applications',
        update: 'PUT /api/applications/:id'
      },
      volunteers: {
        activeCount: 'GET /api/volunteers/active-count'
      },
      health: 'GET /api/health'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('✅ Connected to MongoDB Atlas');
      
      // Create sample users if none exist
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('📝 Creating sample users...');
        
        const sampleUsers = [
          {
            email: 'volunteer@example.com',
            password: 'password123',
            userType: 'volunteer',
            firstName: 'John',
            lastName: 'Doe',
            profile: {
              bio: 'Experienced developer passionate about making a difference',
              skills: ['JavaScript', 'React', 'Node.js'],
              experience: 'advanced',
              availability: 'part-time',
              interests: ['Education', 'Technology', 'Environment'],
              location: 'New York, NY'
            }
          },
          {
            email: 'ngo@example.com',
            password: 'password123',
            userType: 'ngo',
            organizationName: 'Help Foundation',
            contactPerson: 'Jane Smith',
            profile: {
              description: 'We help communities through education and technology',
              mission: 'Making the world a better place through innovation',
              focusAreas: ['Education', 'Health', 'Technology'],
              size: 'medium',
              foundedYear: 2015,
              location: 'San Francisco, CA',
              website: 'https://helpfoundation.org'
            }
          }
        ];
        
        for (const userData of sampleUsers) {
          const user = new User(userData);
          await user.save();
        }
        
        console.log('✅ Sample users created successfully');
      } else {
        console.log(`📊 Database contains ${userCount} users`);
      }
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('💡 Please check your MongoDB Atlas connection string in .env file');
      console.log('📝 App will continue but database features won\'t work');
    });
} else {
  console.log('⚠️  No MongoDB URI provided. Please set MONGODB_URI in .env file');
}

// Socket.IO connection handling
const connectedUsers = new Map(); // Track connected users

io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Handle user authentication for socket
  socket.on('authenticate', (token) => {
    try {
      console.log('🔐 Authenticating socket with token:', token ? '[REDACTED]' : 'No token');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      connectedUsers.set(decoded.id, socket.id);

      // Join user to their own room for private messages
      socket.join(`user_${decoded.id}`);

      // Broadcast user online status
      socket.broadcast.emit('userOnline', { userId: decoded.id });

      // Emit authenticated event to client
      socket.emit('authenticated');

      console.log(`✅ User authenticated: ${decoded.id}`);
    } catch (error) {
      console.log('❌ Socket authentication failed:', error.message);
      socket.emit('authError', 'Invalid token');
    }
  });
  
  // Handle private messages
  socket.on('sendMessage', async (data) => {
    try {
      console.log('📨 Received sendMessage event:', { socketId: socket.id, userId: socket.userId, data });

      const { receiverId, message, messageType = 'text', metadata } = data;

      if (!socket.userId) {
        console.error('❌ Socket not authenticated for message sending');
        socket.emit('error', 'User not authenticated');
        return;
      }

      if (!receiverId || !message) {
        console.error('❌ Missing required fields:', { receiverId, message });
        socket.emit('error', 'Missing required fields: receiverId and message');
        return;
      }

      console.log('💾 Saving message to database...');

      // Generate conversationId manually to avoid validation issues
      const participants = [socket.userId.toString(), receiverId.toString()].sort();
      const conversationId = participants.join('_');

      // Create message data with all required fields including conversationId
      const messageData = {
        senderId: socket.userId,
        receiverId,
        content: message,
        messageType,
        metadata,
        conversationId
      };

      console.log('📝 Message data to save:', messageData);

      // Save message to database
      const newMessage = new Message(messageData);

      await newMessage.save();
      console.log('✅ Message saved with ID:', newMessage._id);
      console.log('📝 Saved message document:', newMessage);

      // Populate sender details for real-time emission
      await newMessage.populate('senderId', 'firstName lastName profilePicture');
      await newMessage.populate('receiverId', 'firstName lastName profilePicture');

      console.log('🔔 Creating notification...');

      // Create notification for the receiver
      const notification = await Notification.createMessageNotification(
        socket.userId,
        receiverId,
        message
      );

      console.log('📡 Emitting to receiver...');

      // Format message for frontend
      const formattedMessage = {
        _id: newMessage._id,
        message: newMessage.content,
        sender: {
          _id: newMessage.senderId._id,
          name: `${newMessage.senderId.firstName} ${newMessage.senderId.lastName}`,
          profilePicture: newMessage.senderId.profilePicture
        },
        receiver: {
          _id: newMessage.receiverId._id,
          name: `${newMessage.receiverId.firstName} ${newMessage.receiverId.lastName}`,
          profilePicture: newMessage.receiverId.profilePicture
        },
        status: newMessage.status,
        messageType: newMessage.messageType,
        isRead: newMessage.isRead,
        createdAt: newMessage.createdAt,
        conversationId: newMessage.conversationId
      };

      // Send to receiver if online
      io.to(`user_${receiverId}`).emit('newMessage', formattedMessage);
      io.to(`user_${receiverId}`).emit('newNotification', notification);

      // Send confirmation to sender
      socket.emit('message-delivered', {
        messageId: newMessage._id,
        message: newMessage
      });

      console.log(`💬 Message saved and sent from ${socket.userId} to ${receiverId}`);
    } catch (error) {
      console.error('❌ Message sending error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      socket.emit('error', 'Failed to send message');
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    if (socket.userId) {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('userTyping', {
        userId: socket.userId,
        conversationId: `${Math.min(socket.userId, receiverId)}_${Math.max(socket.userId, receiverId)}`
      });
    }
  });

  socket.on('stop-typing', (data) => {
    if (socket.userId) {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('userStoppedTyping', {
        userId: socket.userId,
        conversationId: `${Math.min(socket.userId, receiverId)}_${Math.max(socket.userId, receiverId)}`
      });
    }
  });

  // Handle message read receipts
  socket.on('message-read', async (data) => {
    try {
      const { messageId } = data;
      
      if (!socket.userId) {
        socket.emit('error', 'User not authenticated');
        return;
      }

      // Update message status to read
      const message = await Message.findById(messageId);
      if (message && message.receiverId.toString() === socket.userId) {
        message.status = 'read';
        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        // Notify sender
        const senderSocketId = connectedUsers.get(message.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-read', {
            messageId: messageId,
            status: 'read'
          });
        }
      }
    } catch (error) {
      console.error('❌ Message read error:', error);
    }
  });

  // Join conversation rooms
  socket.on('join-conversation', (data) => {
    if (socket.userId) {
      const { conversationId } = data;
      socket.join(`conversation_${conversationId}`);
      console.log(`📞 User ${socket.userId} joined conversation ${conversationId}`);
    }
  });

  // Leave conversation rooms
  socket.on('leave-conversation', (data) => {
    if (socket.userId) {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      console.log(`📱 User ${socket.userId} left conversation ${conversationId}`);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Broadcast user offline status
      socket.broadcast.emit('userOffline', { userId: socket.userId });
      
      console.log(`👋 User disconnected: ${socket.userId}`);
    } else {
      console.log(`👋 Anonymous user disconnected: ${socket.id}`);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Not configured'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`💬 Socket.IO enabled for real-time communication`);
});

module.exports = { app, server, io };
