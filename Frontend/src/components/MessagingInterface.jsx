import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, ArrowLeft, Circle, Check, CheckCheck } from 'lucide-react';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';

const MessagingInterface = ({ selectedUser, onBack }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const {
    messages,
    sendMessage,
    markMessagesAsRead,
    loadConversation,
    setTyping,
    isUserOnline,
    activeConversation,
    setActiveConversation,
    socket,
    isConnected,
    isAuthenticated,
    updateMessageStatus
  } = useMessaging();
  const { user } = useAuth();

  const conversationId = selectedUser ? 
    `${Math.min(user._id, selectedUser._id)}_${Math.max(user._id, selectedUser._id)}` : null;
  const conversationMessages = conversationId ? 
    (Array.isArray(messages[conversationId]) ? messages[conversationId] : []) : [];

  useEffect(() => {
    if (selectedUser) {
      setActiveConversation(selectedUser);
      loadConversation(selectedUser._id);
      markMessagesAsRead(selectedUser._id);
    }
  }, [selectedUser, setActiveConversation, loadConversation, markMessagesAsRead]);

  // Socket listeners for real-time features
  useEffect(() => {
    if (socket && conversationId) {
      // Listen for typing indicators
      socket.on('user-typing', ({ userId, conversationId: convId }) => {
        if (userId !== user._id && convId === conversationId) {
          setOtherUserTyping(true);
        }
      });

      socket.on('user-stopped-typing', ({ userId, conversationId: convId }) => {
        if (userId !== user._id && convId === conversationId) {
          setOtherUserTyping(false);
        }
      });

      // Listen for message status updates
      socket.on('message-delivered', ({ messageId }) => {
        if (updateMessageStatus) {
          updateMessageStatus(messageId, 'delivered');
        }
      });

      socket.on('message-read', ({ messageId }) => {
        if (updateMessageStatus) {
          updateMessageStatus(messageId, 'read');
        }
      });

      return () => {
        socket.off('user-typing');
        socket.off('user-stopped-typing');
        socket.off('message-delivered');
        socket.off('message-read');
      };
    }
  }, [socket, conversationId, user._id, updateMessageStatus]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedUser) {
      sendMessage(selectedUser._id, message.trim());
      setMessage('');
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleTyping = (value) => {
    setMessage(value);
    
    // Handle typing indicators
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      if (socket && conversationId) {
        socket.emit('typing', { conversationId, userId: user._id });
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && conversationId) {
        socket.emit('stop-typing', { conversationId, userId: user._id });
      }
    }, 1000);
  };

  const formatMessageTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // If today, show time
    if (diffInDays === 0) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    // If yesterday
    else if (diffInDays === 1) {
      return `Yesterday ${messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    // If within this week
    else if (diffInDays < 7) {
      return `${messageDate.toLocaleDateString([], { weekday: 'short' })} ${messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    // If older than a week
    else {
      return messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const diffInDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'long' });
    } else if (diffInDays < 365) {
      return messageDate.toLocaleDateString([], { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      return messageDate.toLocaleDateString([], { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric' 
      });
    }
  };

  const getMessageStatusIcon = (message) => {
    if (message.sender !== user._id) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-300" />;
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    // Ensure messages is an array before using forEach
    const messagesArray = Array.isArray(messages) ? messages : [];
    messagesArray.forEach(message => { 
      const date = formatMessageDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const filteredMessages = searchQuery 
    ? (Array.isArray(conversationMessages) ? conversationMessages.filter(msg => 
        msg.message && msg.message.toLowerCase().includes(searchQuery.toLowerCase())
      ) : [])
    : conversationMessages;

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
          <p className="text-gray-500">Select a contact to begin messaging</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(filteredMessages);

  return (
    <div className="flex flex-col h-[92vh] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random`}
                alt={selectedUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {isUserOnline(String(selectedUser._id)) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900">{selectedUser.name}</h2>
              <p className="text-sm text-gray-500">
                {isUserOnline(String(selectedUser._id)) ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Video className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 hover:bg-gray-100 rounded-lg ${showSearch ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {searchQuery && (
          <div className="flex items-center justify-center py-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} found
            </div>
          </div>
        )}
        
        {Object.entries(messageGroups).map(([date, messages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-xs text-gray-600 font-medium">{date}</span>
              </div>
            </div>

            {/* Messages for this date */}
              {messages.map((msg, index) => {
                console.log('user._id:', user?._id, 'msg.senderId:', msg.senderId);
                const isOwnMessage = msg.senderId && user?._id && String(msg.senderId._id || msg.senderId) === String(user._id);
                if (!msg.senderId) {
                  console.warn('Message missing senderId:', msg);
                }
                const showAvatar = !isOwnMessage && (
                  index === 0 || 
                  (messages[index - 1].senderId && String(messages[index - 1].senderId._id || messages[index - 1].senderId) !== String(msg.senderId || ''))
                );

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                      showAvatar || isOwnMessage ? 'mb-4' : 'mb-1'
                    }`}
                  >
                  {!isOwnMessage && (
                    <div className="w-8 mr-2 flex-shrink-0">
                      {showAvatar && msg.sender && (
                        <img
                          src={msg.sender.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=random`}
                          alt={msg.sender.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-3 py-2 rounded-lg relative ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-white text-gray-900 border border-gray-200'
                      } ${
                        showAvatar || isOwnMessage ? 'mb-1' : 'mb-0.5'
                      }`}
                      style={{
                        borderRadius: isOwnMessage 
                          ? '18px 18px 4px 18px' 
                          : '18px 18px 18px 4px'
                      }}
                    >
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      
                      {/* Timestamp and status in message */}
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {isOwnMessage && (
                          <div className="flex-shrink-0">
                            {getMessageStatusIcon(msg)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex justify-start mb-4">
            <div className="w-8 mr-2 flex-shrink-0">
              <img
                src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random`}
                alt={selectedUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div className="max-w-xs lg:max-w-md">
              <div className="px-4 py-2 rounded-2xl bg-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <div className="flex items-end bg-gray-50 rounded-2xl">
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <textarea
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder={isConnected && isAuthenticated ? "Type a message..." : "Connecting..."}
                className="flex-1 bg-transparent border-0 resize-none py-3 px-1 text-sm focus:outline-none max-h-32"
                rows="1"
                disabled={!isConnected || !isAuthenticated}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-3 text-gray-500 hover:text-gray-700"
                disabled={!isConnected || !isAuthenticated}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || !isConnected || !isAuthenticated}
            className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isConnected ? "Connecting to server..." : !isAuthenticated ? "Authenticating..." : ""}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessagingInterface;