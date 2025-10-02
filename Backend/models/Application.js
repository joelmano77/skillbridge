const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  opportunity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  volunteer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Index for better query performance
applicationSchema.index({ opportunity_id: 1 });
applicationSchema.index({ volunteer_id: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate applications
applicationSchema.index({ opportunity_id: 1, volunteer_id: 1 }, { unique: true });

// Instance method to get public application data
applicationSchema.methods.getPublicData = function() {
  const applicationObject = this.toObject();
  return applicationObject;
};

// Static method to find by opportunity
applicationSchema.statics.findByOpportunity = function(opportunityId) {
  return this.find({ opportunity_id: opportunityId })
    .populate('volunteer_id', 'firstName lastName profile.skills profile.experience profile.location')
    .sort({ createdAt: -1 });
};

// Static method to find by volunteer
applicationSchema.statics.findByVolunteer = function(volunteerId) {
  return this.find({ volunteer_id: volunteerId })
    .populate('opportunity_id', 'title description required_skills location duration')
    .sort({ createdAt: -1 });
};

// Static method to check if volunteer already applied
applicationSchema.statics.hasApplied = function(opportunityId, volunteerId) {
  return this.findOne({ opportunity_id: opportunityId, volunteer_id: volunteerId });
};

module.exports = mongoose.model('Application', applicationSchema);
