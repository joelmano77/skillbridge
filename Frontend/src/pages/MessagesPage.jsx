import React, { useState, useEffect } from 'react';
import ConversationList from '../components/ConversationList';
import MessagingInterface from '../components/MessagingInterface';
import { MessagingProvider } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConversations, setShowConversations] = useState(true);
  const { user } = useAuth();

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowConversations(false); // Hide conversation list on mobile
  };

  const handleBackToConversations = () => {
    setShowConversations(true);
    setSelectedUser(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Please log in to access messages
          </h2>
          <p className="text-gray-600">
            You need to be logged in to send and receive messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MessagingProvider>
      <div className="h-screen bg-gray-50 flex">
        <div className="max-w-7xl mx-auto flex-1 flex">
          {/* Conversation List - Show/Hide based on mobile/desktop */}
          <div className={`${
            showConversations ? 'block' : 'hidden lg:block'
          } w-full lg:w-80 flex-shrink-0`}>
            <ConversationList 
              onSelectUser={handleSelectUser}
              selectedUser={selectedUser}
            />
          </div>

          {/* Messaging Interface - Show/Hide based on mobile/desktop */}
          <div className={`${
            !showConversations || selectedUser ? 'block' : 'hidden lg:block'
          } flex-1`}>
            <MessagingInterface 
              selectedUser={selectedUser}
              onBack={handleBackToConversations}
            />
          </div>
        </div>
      </div>
    </MessagingProvider>
  );
};

export default MessagesPage;