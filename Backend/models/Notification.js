const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['message', 'application_status', 'new_opportunity', 'reminder', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

notificationSchema.statics.getUserNotifications = function(userId, limit = 20, skip = 0) {
  return this.find({ recipientId: userId })
    .populate('senderId', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to create message notification
notificationSchema.statics.createMessageNotification = async function(senderId, receiverId, messageContent) {
  const messagePreview = messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent;
  
  return this.create({
    recipientId: receiverId,
    senderId: senderId,
    type: 'message',
    title: 'New Message',
    content: `You have a new message: "${messagePreview}"`
  });
};

// Static method to create application notification
notificationSchema.statics.createApplicationNotification = async function(volunteerId, ngoId, opportunityTitle) {
  return this.create({
    recipientId: ngoId,
    senderId: volunteerId,
    type: 'application_status',
    title: 'New Application Received',
    content: `A volunteer has applied for your opportunity: "${opportunityTitle}"`
  });
};

// Static method to create opportunity match notification
notificationSchema.statics.createOpportunityMatchNotification = async function(ngoId, volunteerId, opportunityTitle) {
  return this.create({
    recipientId: volunteerId,
    senderId: ngoId,
    type: 'new_opportunity',
    title: 'New Opportunity Match',
    content: `We found a perfect opportunity for you: "${opportunityTitle}"`
  });
};

// Static method to create application status update notification
notificationSchema.statics.createStatusUpdateNotification = async function(ngoId, volunteerId, status, opportunityTitle) {
  const statusMessages = {
    'accepted': 'Congratulations! Your application has been accepted',
    'rejected': 'Thank you for your interest. Your application was not selected this time',
    'under_review': 'Your application is currently under review'
  };
  
  return this.create({
    recipientId: volunteerId,
    senderId: ngoId,
    type: 'application_status',
    title: 'Application Status Update',
    content: `${statusMessages[status]} for "${opportunityTitle}"`
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    recipientId: userId, 
    isRead: false 
  });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = function(notificationIds, userId) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds }, 
      recipientId: userId, 
      isRead: false 
    },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { 
      recipientId: userId, 
      isRead: false 
    },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
