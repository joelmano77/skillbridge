import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Circle, Plus } from 'lucide-react';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';
import messagingService from '../services/messagingService';

const ConversationList = ({ onSelectUser, selectedUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  const { 
    conversations, 
    loadConversations, 
    isUserOnline, 
    loading 
  } = useMessaging();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          await loadConversations();
        } catch (error) {
          console.error('Error loading conversations:', error);
          // Don't show error to user for initial load - just log it
        }
      }
    };
    
    loadData();
  }, [user, loadConversations]);

  useEffect(() => {
    if (!conversations || !Array.isArray(conversations)) {
      setFilteredConversations([]);
      return;
    }
    
    const filtered = conversations.filter(conversation => {
      if (!conversation.participants || !Array.isArray(conversation.participants)) {
        return false;
      }
      const otherUser = conversation.participants.find(p => p._id !== user._id);
      return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredConversations(filtered);
  }, [conversations, searchTerm, user]);

  // Search for users to start new conversations
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim() && showUserSearch) {
        try {
          const response = await messagingService.discoverUsers({ 
            search: searchTerm,
            limit: 10 
          });
          // Handle the nested response structure
          const users = response.data?.users || response.users || response;
          // Filter out the current user
          const filteredUsers = Array.isArray(users) ? users.filter(u => u._id !== user._id) : [];
          setSearchResults(filteredUsers);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchTerm, showUserSearch, user]);

  const handleStartConversation = async (selectedUser) => {
    try {
      await messagingService.startConversation(selectedUser._id);
      setShowUserSearch(false);
      setSearchTerm('');
      onSelectUser(selectedUser);
      loadConversations(); // Refresh conversations
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const formatLastMessageTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else if (diffInMinutes < 10080) {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Messages</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={showUserSearch ? "Search for people to message..." : "Search conversations..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowUserSearch(true)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {showUserSearch && (
            <button
              onClick={() => {
                setShowUserSearch(false);
                setSearchTerm('');
              }}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Toggle between conversations and user search */}
        <div className="mt-2 flex space-x-2">
          <button
            onClick={() => {
              setShowUserSearch(false);
              setSearchTerm('');
            }}
            className={`flex-1 py-1 px-2 text-xs font-medium rounded ${
              !showUserSearch 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setShowUserSearch(true)}
            className={`flex-1 py-1 px-2 text-xs font-medium rounded ${
              showUserSearch 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            New Chat
          </button>
        </div>
      </div>

      {/* Conversations or User Search Results */}
      <div className="flex-1 overflow-y-auto">
        {showUserSearch ? (
          /* User Search Results */
          <div>
            {searchResults.length === 0 && searchTerm.trim() ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-sm text-gray-500">
                  Try searching with a different name or keyword
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Find people to chat with</h3>
                <p className="text-sm text-gray-500">
                  Search for NGOs, volunteers, or organizations to start a conversation
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((searchUser) => (
                  <div
                    key={searchUser._id}
                    onClick={() => handleStartConversation(searchUser)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={searchUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(searchUser.name)}&background=random`}
                          alt={searchUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {isUserOnline(searchUser._id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {searchUser.name}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {searchUser.bio || searchUser.description || 'No bio available'}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            searchUser.userType === 'volunteer' 
                              ? 'bg-green-100 text-green-800' 
                              : searchUser.userType === 'ngo'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {searchUser.userType === 'volunteer' ? 'Volunteer' : 
                             searchUser.userType === 'ngo' ? 'NGO' : 
                             searchUser.userType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Regular Conversations */
          filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'No conversations match your search' : 'Click "New Chat" to start a conversation'}
              </p>
            </div>
          ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              if (!conversation.participants || !Array.isArray(conversation.participants)) {
                console.warn('Conversation missing participants array:', conversation);
                return null;
              }
              if (!user || !user._id) {
                console.warn('User or user._id is undefined:', user);
                return null;
              }
              const otherUser = conversation.participants.find(p => p && p._id && p._id.toString() !== user._id.toString());
              if (!otherUser) {
                console.warn('Other user not found in participants:', conversation.participants);
                console.error('Full conversation object:', conversation);
                return (
                  <div key={conversation._id} className="p-4 text-red-600">
                    Error: Invalid conversation data
                  </div>
                );
              }
              const isSelected = selectedUser && selectedUser._id === otherUser._id;
              const isOnline = isUserOnline(otherUser._id);
              
              return (
                <div
                  key={conversation._id}
                  onClick={() => onSelectUser(otherUser)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={otherUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium truncate ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {otherUser.name}
                        </h3>
                        
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatLastMessageTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        {conversation.lastMessage ? (
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.senderId && conversation.lastMessage.senderId._id === user._id && (
                              <span className="text-gray-500">You: </span>
                            )}
                            {truncateMessage(conversation.lastMessage.content)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No messages yet</p>
                        )}

                        {/* Unread indicator */}
                        {conversation.unreadCount > 0 && (
                          <div className="flex-shrink-0 ml-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* User role */}
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          otherUser.role === 'volunteer' 
                            ? 'bg-green-100 text-green-800' 
                            : otherUser.role === 'ngo'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {otherUser.role === 'volunteer' ? 'Volunteer' : 
                           otherUser.role === 'ngo' ? 'NGO' : 
                           otherUser.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )
        )}
      </div>
    </div>
  );
};

export default ConversationList;