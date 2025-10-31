import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import messagingService from '../services/messagingService';
import { useAuth } from './AuthContext';  // Import useAuth to get current user

// Initial state
const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isAuthenticated: false,
  connectedUsers: new Set(),
  loading: false,
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SET_ACTIVE_CONVERSATION: 'SET_ACTIVE_CONVERSATION',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_USER_STATUS: 'SET_USER_STATUS',
  MARK_MESSAGES_READ: 'MARK_MESSAGES_READ',
  UPDATE_MESSAGE_STATUS: 'UPDATE_MESSAGE_STATUS',
};

// Reducer
function messagingReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };

    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case actionTypes.SET_CONNECTED:
      return { ...state, isConnected: action.payload.isConnected, isAuthenticated: action.payload.isAuthenticated };


    case actionTypes.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload, loading: false };

    case actionTypes.SET_ACTIVE_CONVERSATION:
      return { ...state, activeConversation: action.payload };

    case actionTypes.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
        loading: false,
      };

    case actionTypes.ADD_MESSAGE:
      const { message } = action.payload;
      const conversationId = message.conversationId || 
        `${Math.min(message.sender._id, message.receiver._id)}_${Math.max(message.sender._id, message.receiver._id)}`;
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] || []),
            message,
          ],
        },
      };

    case actionTypes.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload, loading: false };

    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };

    case actionTypes.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload._id ? action.payload : notification
        ),
      };

    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        ),
      };

    case actionTypes.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    case actionTypes.SET_USER_STATUS:
      const newConnectedUsers = new Set(state.connectedUsers);
      const userIdStr = String(action.payload.userId);
      if (action.payload.isOnline) {
        newConnectedUsers.add(userIdStr);
      } else {
        newConnectedUsers.delete(userIdStr);
      }
      return { ...state, connectedUsers: newConnectedUsers };

    case actionTypes.MARK_MESSAGES_READ:
      const { senderId } = action.payload;
      const updatedMessages = { ...state.messages };
      
      Object.keys(updatedMessages).forEach(conversationId => {
        if (conversationId.includes(senderId)) {
          updatedMessages[conversationId] = updatedMessages[conversationId].map(msg => ({
            ...msg,
            isRead: msg.sender._id === senderId ? true : msg.isRead,
          }));
        }
      });

      return { ...state, messages: updatedMessages };

    case actionTypes.UPDATE_MESSAGE_STATUS:
      const { messageId, status } = action.payload;
      const allUpdatedMessages = { ...state.messages };
      
      Object.keys(allUpdatedMessages).forEach(conversationId => {
        allUpdatedMessages[conversationId] = allUpdatedMessages[conversationId].map(msg => 
          msg._id === messageId ? { ...msg, status } : msg
        );
      });

      return { ...state, messages: allUpdatedMessages };

    default:
      return state;
  }
}

// Create context
const MessagingContext = createContext();

  // Context provider
  export function MessagingProvider({ children }) {
    const [state, dispatch] = useReducer(messagingReducer, initialState);
    const { user } = useAuth();  // Get current user from AuthContext

    // Initialize messaging service
    useEffect(() => {
      // Only connect if user is authenticated
      if (user && user._id) {
        // Connect to messaging service
        messagingService.connect();

        // Set up listeners
        const unsubscribeMessage = messagingService.onMessage((message) => {
          dispatch({ type: actionTypes.ADD_MESSAGE, payload: { message } });

          // Update conversations list with new lastMessage and unreadCount
          dispatch({
            type: actionTypes.SET_CONVERSATIONS,
            payload: state.conversations.map(conversation => {
              if (conversation._id === message.conversationId) {
                return {
                  ...conversation,
                  lastMessage: message,
                  unreadCount: conversation.unreadCount + 1
                };
              }
              return conversation;
            })
          });
        });

        const unsubscribeNotification = messagingService.onNotification((notification) => {
          dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: notification });
        });

        const unsubscribeUserStatus = messagingService.onUserStatus((userId, isOnline) => {
          dispatch({
            type: actionTypes.SET_USER_STATUS,
            payload: { userId, isOnline },
          });
        });

        // Track connection and authentication status via events instead of polling
        const handleConnect = () => {
          dispatch({
            type: actionTypes.SET_CONNECTED,
            payload: { isConnected: true, isAuthenticated: messagingService.socket?.authenticated || false },
          });
        };

        const handleDisconnect = () => {
          dispatch({
            type: actionTypes.SET_CONNECTED,
            payload: { isConnected: false, isAuthenticated: false },
          });
        };

        // Listen for authentication event
        const handleAuthenticated = () => {
          dispatch({
            type: actionTypes.SET_CONNECTED,
            payload: { isConnected: true, isAuthenticated: true },
          });
        };

        // Set initial connection status
        dispatch({
          type: actionTypes.SET_CONNECTED,
          payload: { isConnected: messagingService.isConnected, isAuthenticated: messagingService.socket?.authenticated || false },
        });

        // Listen for connection changes
        if (messagingService.socket) {
          messagingService.socket.on('connect', handleConnect);
          messagingService.socket.on('disconnect', handleDisconnect);
          messagingService.socket.on('authenticated', handleAuthenticated);
        }

        // Cleanup function
        return () => {
          unsubscribeMessage();
          unsubscribeNotification();
          unsubscribeUserStatus();

          // Remove socket event listeners
          if (messagingService.socket) {
            messagingService.socket.off('connect', handleConnect);
            messagingService.socket.off('disconnect', handleDisconnect);
            messagingService.socket.off('authenticated', handleAuthenticated);
          }

          // Disconnect socket when user logs out
          messagingService.disconnect();
        };
      } else {
        // User not authenticated, disconnect socket
        messagingService.disconnect();
        dispatch({
          type: actionTypes.SET_CONNECTED,
          payload: { isConnected: false, isAuthenticated: false },
        });
      }
    }, [user]); // Depend on user to reconnect when user changes

    // Actions - Memoized to prevent infinite re-renders
    const loadConversations = useCallback(async () => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await messagingService.getConversations();
        // Extract conversations array from response.data.data
        const conversations = Array.isArray(response?.data?.data) ? response.data.data :
                             Array.isArray(response) ? response :
                             Array.isArray(response?.data) ? response.data : [];
        console.log('Loaded conversations:', conversations);

        // Map conversations to flatten lastMessage content for frontend rendering
        const mappedConversations = conversations.map(conv => {
          if (conv.lastMessage && conv.lastMessage.content) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                content: conv.lastMessage.content
              }
            };
          }
          return conv;
        });

        dispatch({ type: actionTypes.SET_CONVERSATIONS, payload: mappedConversations });
      } catch (error) {
        console.error('Error loading conversations:', error);
        dispatch({ type: actionTypes.SET_CONVERSATIONS, payload: [] });
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    }, []);

    const isUserOnline = useCallback((userId) => {
      console.log('Checking online status for userId:', userId);
      console.log('Connected users:', Array.from(state.connectedUsers));
      return state.connectedUsers.has(userId) || state.connectedUsers.has(String(userId));
    }, [state.connectedUsers]);

    const loadConversation = useCallback(async (userId) => {
      if (!user || !user._id) {
        console.warn('Cannot load conversation: User not authenticated');
        return;
      }

      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await messagingService.getConversation(userId);
        const rawMessages = response.data || [];
        // Map messages to rename content to message for frontend consistency
        const messages = rawMessages.map(msg => ({
          ...msg,
          message: msg.content
        }));
        const conversationId = `${Math.min(userId, user._id)}_${Math.max(userId, user._id)}`;  // Use actual user._id here
        dispatch({
          type: actionTypes.SET_MESSAGES,
          payload: { conversationId, messages },
        });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    }, [user]);

    const setActiveConversation = useCallback((conversation) => {
      dispatch({ type: actionTypes.SET_ACTIVE_CONVERSATION, payload: conversation });
    }, []);

    const markMessagesAsRead = useCallback(async (senderId) => {
      try {
        await messagingService.markMessagesAsRead(senderId);
        dispatch({ type: actionTypes.MARK_MESSAGES_READ, payload: { senderId } });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }, []);

    const sendMessage = useCallback((receiverId, content, messageType = 'text') => {
      if (!user || !user._id) {
        console.warn('Cannot send message: User not authenticated');
        return;
      }

      if (!messagingService.socket || !messagingService.isConnected || !messagingService.socket.authenticated) {
        console.warn('⚠️ Cannot send message: Socket not connected or authenticated');
        return;
      }
      // Optimistic UI update: add message immediately to state
      const conversationId = `${Math.min(receiverId, user._id)}_${Math.max(receiverId, user._id)}`;
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        senderId: user._id,
        receiverId: receiverId,
        message: content,
        messageType,
        status: 'sending',
        createdAt: new Date().toISOString(),
        conversationId,
      };
      dispatch({
        type: actionTypes.ADD_MESSAGE,
        payload: { message: tempMessage },
      });
      messagingService.sendMessage(receiverId, content, messageType);
    }, [user, dispatch]);

    const setTyping = useCallback((receiverId, isTyping) => {
      messagingService.setTyping(receiverId, isTyping);
    }, []);

    const loadNotifications = useCallback(async () => {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      try {
        const response = await messagingService.getNotifications();
        // Ensure notifications is always an array
        const notifications = Array.isArray(response) ? response : 
                             Array.isArray(response?.data) ? response.data :
                             Array.isArray(response?.notifications) ? response.notifications : [];
        dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: notifications });
        
        // Also load unread count
        const unreadData = await messagingService.getUnreadNotificationCount();
        dispatch({ type: actionTypes.SET_UNREAD_COUNT, payload: unreadData.count });
      } catch (error) {
        console.error('Error loading notifications:', error);
        dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: [] });
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    }, []);

    const markNotificationAsRead = useCallback(async (notificationId) => {
      try {
        await messagingService.markNotificationAsRead(notificationId);
        const notification = state.notifications.find(n => n._id === notificationId);
        if (notification && !notification.isRead) {
          dispatch({
            type: actionTypes.UPDATE_NOTIFICATION,
            payload: { ...notification, isRead: true },
          });
          dispatch({
            type: actionTypes.SET_UNREAD_COUNT,
            payload: Math.max(0, state.unreadCount - 1),
          });
        }
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    }, [state.notifications, state.unreadCount]);

    const markAllNotificationsAsRead = useCallback(async () => {
      try {
        await messagingService.markAllNotificationsAsRead();
        const updatedNotifications = state.notifications.map(notification => ({
          ...notification,
          isRead: true,
        }));
        dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: updatedNotifications });
        dispatch({ type: actionTypes.SET_UNREAD_COUNT, payload: 0 });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    }, [state.notifications]);

    const deleteNotification = useCallback(async (notificationId) => {
      try {
        await messagingService.deleteNotification(notificationId);
        dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: notificationId });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    }, []);

    const suggestOpportunity = useCallback(async (volunteerId, opportunityId) => {
      try {
        await messagingService.suggestOpportunity(volunteerId, opportunityId);
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    }, []);

    const clearError = useCallback(() => {
      dispatch({ type: actionTypes.SET_ERROR, payload: null });
    }, []);

    const updateMessageStatus = useCallback((messageId, status) => {
      dispatch({
        type: actionTypes.UPDATE_MESSAGE_STATUS,
        payload: { messageId, status },
      });
    }, []);

    const actions = {
      // Conversation actions
      loadConversations,
      loadConversation,
      setActiveConversation,
      markMessagesAsRead,
      sendMessage,
      setTyping,
      // Notification actions
      loadNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      suggestOpportunity,
      // Utility actions
      clearError,
      isUserOnline,
      updateMessageStatus,
      // Socket access
      get socket() {
        return messagingService.socket;
      },
    };

    const value = {
      ...state,
      ...actions,
    };

    return (
      <MessagingContext.Provider value={value}>
        {children}
      </MessagingContext.Provider>
    );
  }

// Custom hook to use messaging context
export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}

export default MessagingContext;
