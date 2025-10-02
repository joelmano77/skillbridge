const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'link'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  deliveredAt: {
    type: Date,
    default: Date.now
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    const participants = [this.senderId.toString(), this.receiverId.toString()].sort();
    this.conversationId = participants.join('_');
  }
  next();
});

messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, skip = 0) {
  const participants = [userId1.toString(), userId2.toString()].sort();
  const conversationId = participants.join('_');
  
  return this.find({ conversationId })
    .populate('senderId', 'username email')
    .populate('receiverId', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

messageSchema.statics.getUserConversations = async function(userId) {
  const userIdStr = userId.toString();

  // Get current user for participants
  const User = mongoose.model('User');
  const currentUser = await User.findById(userId).select('username email profilePicture userType firstName lastName organizationName contactPerson');

  // Find all unique conversation IDs where user is participant
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(userIdStr) },
          { receiverId: new mongoose.Types.ObjectId(userIdStr) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiverId', new mongoose.Types.ObjectId(userIdStr)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);

  // Populate user details
  const populatedConversations = await Promise.all(
    conversations
      .filter(conv => conv.lastMessage && conv.lastMessage._id) // Filter out invalid lastMessage
      .map(async (conv) => {
        const lastMessage = await this.findById(conv.lastMessage._id)
          .populate('senderId', 'username email profilePicture userType firstName lastName organizationName contactPerson')
          .populate('receiverId', 'username email profilePicture userType firstName lastName organizationName contactPerson');

        if (!lastMessage || !lastMessage.senderId || !lastMessage.receiverId) {
          // Skip conversations with invalid lastMessage participants
          return null;
        }

        const otherUser = lastMessage.senderId._id.toString() === userIdStr
          ? lastMessage.receiverId
          : lastMessage.senderId;

        if (!otherUser || !otherUser._id) {
          return null;
        }

        return {
          _id: conv._id,
          participants: [currentUser, otherUser],
          lastMessage: lastMessage,
          unreadCount: conv.unreadCount
        };
      })
      .filter(conv => conv !== null) // Remove null entries
  );

  return populatedConversations;
};

// Mark conversation messages as read
messageSchema.statics.markConversationAsRead = async function(senderId, receiverId) {
  try {
    const participants = [senderId.toString(), receiverId.toString()].sort();
    const conversationId = participants.join('_');
    
    const result = await this.updateMany(
      {
        conversationId: conversationId,
        senderId: senderId,
        receiverId: receiverId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          status: 'read',
          readAt: new Date()
        }
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

module.exports = mongoose.model('Message', messageSchema);
