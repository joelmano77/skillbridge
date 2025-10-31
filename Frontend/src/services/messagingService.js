import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://skillbridge-backend-zc0r.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class MessagingService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageListeners = [];
    this.notificationListeners = [];
    this.userStatusListeners = [];
    this.connectedUsers = new Set();
    this.messageQueue = []; // Queue messages until authenticated
  }

  // Initialize Socket.IO connection
  initializeSocket() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(API_BASE_URL, {
      autoConnect: false,
      withCredentials: true,
    });

    this.socket.authenticated = false; // Add authenticated flag

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to messaging server');
      this.isConnected = true;
      this.authenticate();
    });

    this.socket.on('authenticated', () => {
      console.log('🔐 Socket authenticated successfully');
      this.socket.authenticated = true;
      // Flush queued messages
      while (this.messageQueue.length > 0) {
        const { receiverId, content, messageType } = this.messageQueue.shift();
        this.sendMessage(receiverId, content, messageType);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from messaging server, reason:', reason);
      this.isConnected = false;
      this.socket.authenticated = false;
    });

    // Message events
    this.socket.on('newMessage', (message) => {
      console.log('📨 New message received:', message);
      this.messageListeners.forEach(listener => listener(message));
    });

    // Notification events
    this.socket.on('newNotification', (notification) => {
      console.log('🔔 New notification received:', notification);
      this.notificationListeners.forEach(listener => listener(notification));
    });

    // User status events
    this.socket.on('userOnline', ({ userId }) => {
      console.log('🟢 User came online:', userId);
      this.connectedUsers.add(userId);
      this.userStatusListeners.forEach(listener => listener(userId, true));
    });

    this.socket.on('userOffline', ({ userId }) => {
      console.log('🔴 User went offline:', userId);
      this.connectedUsers.delete(userId);
      this.userStatusListeners.forEach(listener => listener(userId, false));
    });

    // Typing events
    this.socket.on('userTyping', ({ userId, isTyping }) => {
      console.log(`⌨️ User ${userId} is ${isTyping ? 'typing' : 'stopped typing'}`);
      // You can add typing indicator listeners here
    });

    // Error events
    this.socket.on('authError', (error) => {
      console.error('🔐 Authentication error:', error);
      // Try to reconnect after authentication error
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.authenticate();
        }
      }, 5000);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      // Don't log "Failed to send message" as it's too verbose
      if (!error.toString().includes('Failed to send message')) {
        console.error('❌ Socket error details:', error);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });

    return this.socket;
  }

  // Authenticate with JWT token
  authenticate() {
    const token = localStorage.getItem('token');
    console.log('🔐 Authenticating socket, token:', token ? 'Present' : 'Missing');
    if (token && this.socket) {
      console.log('🔐 Authenticating socket with token...');
      this.socket.emit('authenticate', token);
    } else {
      console.error('❌ No token available for socket authentication');
    }
  }

  // Connect to messaging server
  connect() {
    if (!this.socket) {
      this.initializeSocket();
    }
    if (!this.isConnected) {
      this.socket.connect();
    }
    // Add auto-reconnect logic
    if (this.socket) {
      this.socket.io.opts.reconnection = true;
      this.socket.io.opts.reconnectionAttempts = Infinity;
      this.socket.io.opts.reconnectionDelay = 1000;
      this.socket.io.opts.reconnectionDelayMax = 5000;
    }
  }

  // Disconnect from messaging server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send a message
  sendMessage(receiverId, content, messageType = 'text') {
    if (this.socket && this.isConnected) {
      if (!this.socket.authenticated) {
        console.warn('⚠️ Socket not authenticated yet. Message sending delayed.');
        // Queue message for sending after authentication
        this.messageQueue.push({ receiverId, content, messageType });
        return;
      }
      const messageData = {
        receiverId,
        message: content,
        messageType
      };
      console.log('📤 Sending message via socket:', messageData);
      this.socket.emit('sendMessage', messageData);
    } else {
      console.error('❌ Socket not connected. Cannot send message. Connected:', this.isConnected);
    }
  }

  // Send typing indicator
  setTyping(receiverId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit(isTyping ? 'typing' : 'stop-typing', {
        receiverId,
        isTyping
      });
    }
  }

  // Add message listener
  onMessage(callback) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  // Add notification listener
  onNotification(callback) {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(listener => listener !== callback);
    };
  }

  // Add user status listener
  onUserStatus(callback) {
    this.userStatusListeners.push(callback);
    return () => {
      this.userStatusListeners = this.userStatusListeners.filter(listener => listener !== callback);
    };
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // API Methods for user discovery
  async discoverUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await api.get(`/users/discover?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error discovering users:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const response = await api.get(`/users/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async startConversation(userId, initialMessage = '') {
    try {
      const response = await api.post('/conversations/start', {
        userId,
        initialMessage
      });
      return response.data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  // API Methods for messages
  async getConversation(userId, limit = 50, skip = 0) {
    try {
      // Validate userId
      if (!userId || typeof userId !== 'string' || userId.length !== 24) {
        throw new Error('Invalid user ID provided');
      }

      const response = await api.get(`/messages/conversation/${userId}`, {
        params: { limit, skip }
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch conversation');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      
      // Handle different error types
      if (error.response?.status === 400) {
        throw new Error('Invalid conversation parameters');
      } else if (error.response?.status === 404) {
        throw new Error('Conversation not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error while fetching conversation');
      }
      
      throw error;
    }
  }

  async getConversations() {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async markMessagesAsRead(senderId) {
    try {
      // Validate senderId
      if (!senderId || typeof senderId !== 'string' || senderId.length !== 24) {
        console.warn('Invalid sender ID provided for marking messages as read:', senderId);
        return { success: false, error: 'Invalid sender ID' };
      }

      const response = await api.put(`/messages/read/${senderId}`);
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      
      // Don't throw error for read receipts as it's not critical functionality
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to mark messages as read' 
      };
    }
  }

  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // API Methods for notifications
  async getNotifications(limit = 20, skip = 0) {
    try {
      const response = await api.get('/notifications', {
        params: { limit, skip }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead() {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async suggestOpportunity(volunteerId, opportunityId) {
    try {
      const response = await api.post('/notifications/suggest-opportunity', {
        volunteerId,
        opportunityId
      });
      return response.data;
    } catch (error) {
      console.error('Error suggesting opportunity:', error);
      throw error;
    }
  }
}

// Create singleton instance
const messagingService = new MessagingService();

export default messagingService;