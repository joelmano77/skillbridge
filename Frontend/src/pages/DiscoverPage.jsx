import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageCircle, User, MapPin, Star, Award, Calendar, Phone, Mail, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';
import messagingService from '../services/messagingService';

const DiscoverPage = ({ onStartConversation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '', // 'volunteer' or 'ngo'
    skills: '',
    location: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const { user } = useAuth();
  const { sendMessage } = useMessaging();

  // Load users on component mount and when filters change
  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, filters, pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filters.role) params.append('role', filters.role);
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.location) params.append('location', filters.location);

      const response = await fetch(`/api/users/discover?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const handleStartConversation = async (targetUser) => {
    if (!messageText.trim()) {
      setSelectedUser(targetUser);
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: targetUser._id,
          initialMessage: messageText
        })
      });

      const data = await response.json();
      if (data.success) {
        setSelectedUser(null);
        setMessageText('');
        
        // Navigate to messages page with this user
        if (onStartConversation) {
          onStartConversation(targetUser);
        }
        
        alert('Conversation started successfully!');
      } else {
        alert(data.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation');
    } finally {
      setSendingMessage(false);
    }
  };

  const getUserRoleDisplay = () => {
    return user?.userType === 'volunteer' ? 'NGOs' : 'Volunteers';
  };

  const getDefaultRole = () => {
    return user?.userType === 'volunteer' ? 'ngo' : 'volunteer';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Please log in to discover users
          </h2>
          <p className="text-gray-600">
            You need to be logged in to find and chat with other users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Discover {getUserRoleDisplay()}
          </h1>
          <p className="text-gray-600 mt-2">
            Find and connect with {getUserRoleDisplay().toLowerCase()} to start meaningful conversations
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${getUserRoleDisplay().toLowerCase()} by name, skills, or description...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={getDefaultRole()}>
                    {user?.userType === 'volunteer' ? 'NGOs' : 'Volunteers'}
                  </option>
                  <option value="">All Users</option>
                  <option value="volunteer">Volunteers</option>
                  <option value="ngo">NGOs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  placeholder="e.g., Web Development, Teaching"
                  value={filters.skills}
                  onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., New York, California"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {users.map((discoveredUser) => (
                <div
                  key={discoveredUser._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Profile Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={discoveredUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(discoveredUser.name)}&background=random`}
                      alt={discoveredUser.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {discoveredUser.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        discoveredUser.role === 'volunteer' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {discoveredUser.role === 'volunteer' ? 'Volunteer' : 'NGO'}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {discoveredUser.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {discoveredUser.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {discoveredUser.skills?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {discoveredUser.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {discoveredUser.skills.length > 3 && (
                          <span className="text-gray-500 text-xs">
                            +{discoveredUser.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location & Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    {discoveredUser.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{discoveredUser.location}</span>
                      </div>
                    )}
                    
                    {discoveredUser.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{discoveredUser.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartConversation(discoveredUser)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Start Conversation</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && users.length === 0 && (
              <div className="text-center py-12">
                <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {getUserRoleDisplay().toLowerCase()} found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or filters
                </p>
              </div>
            )}
          </>
        )}

        {/* Message Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Start conversation with {selectedUser.name}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random`}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedUser.role === 'volunteer' ? 'Volunteer' : 'NGO'}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write a friendly introduction message..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStartConversation(selectedUser)}
                  disabled={!messageText.trim() || sendingMessage}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;