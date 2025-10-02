const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  ngo_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  required_skills: [{
    type: String,
    trim: true
  }],
  duration: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

// Index for better query performance
opportunitySchema.index({ ngo_id: 1 });
opportunitySchema.index({ status: 1 });
opportunitySchema.index({ required_skills: 1 });
opportunitySchema.index({ location: 1 });
opportunitySchema.index({ createdAt: -1 });

// Virtual for application count
opportunitySchema.virtual('applicationCount', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'opportunity_id',
  count: true
});

// Instance method to get public opportunity data
opportunitySchema.methods.getPublicData = function() {
  const opportunityObject = this.toObject();
  return opportunityObject;
};

// Static method to find by NGO
opportunitySchema.statics.findByNGO = function(ngoId) {
  return this.find({ ngo_id: ngoId });
};

// Static method to find open opportunities
opportunitySchema.statics.findOpen = function() {
  return this.find({ status: 'open' });
};

// Static method to search opportunities with filters
opportunitySchema.statics.searchWithFilters = function(filters = {}) {
  let query = {};

  // Default to open status if no status filter specified
  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = 'open';
  }

  if (filters.skills) {
    query.required_skills = { $elemMatch: { $regex: filters.skills, $options: 'i' } };
  }

  if (filters.location) {
    query.location = { $regex: filters.location, $options: 'i' };
  }

  if (filters.duration) {
    query.duration = { $regex: filters.duration, $options: 'i' };
  }

  if (filters.ngo_id) {
    query.ngo_id = filters.ngo_id;
  }

  return this.find(query).populate('ngo_id', 'organizationName profile.location profile.website');
};

module.exports = mongoose.model('Opportunity', opportunitySchema);
