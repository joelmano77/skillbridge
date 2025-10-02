import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, X, MessageCircle, Calendar, UserCheck, AlertCircle, Filter } from 'lucide-react';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';

const NotificationsPage = () => {
  const [filter, setFilter] = useState('all'); // all, unread, messages, applications
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  
  const { 
    notifications, 
    unreadCount,
    loadNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification,
    loading,
    error 
  } = useMessaging();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...notifications];
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'messages':
        filtered = notifications.filter(n => n.type === 'message');
        break;
      case 'applications':
        filtered = notifications.filter(n => n.type === 'application' || n.type === 'application_status');
        break;
      case 'opportunities':
        filtered = notifications.filter(n => n.type === 'opportunity_match');
        break;
      default:
        filtered = notifications;
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-6 h-6 text-blue-500" />;
      case 'application':
        return <UserCheck className="w-6 h-6 text-green-500" />;
      case 'opportunity_match':
        return <Calendar className="w-6 h-6 text-purple-500" />;
      case 'application_status':
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
        return 'border-l-blue-500 bg-blue-50';
      case 'application':
        return 'border-l-green-500 bg-green-50';
      case 'opportunity_match':
        return 'border-l-purple-500 bg-purple-50';
      case 'application_status':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }
    
    // For single-page app, we'd need navigation handlers passed as props
    // For now, just mark as read
    console.log('Notification clicked:', notification.type);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) !== 1 ? 's' : ''} ago`;
    if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) !== 1 ? 's' : ''} ago`;
    return notificationDate.toLocaleDateString();
  };

  const filterOptions = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
    { value: 'applications', label: 'Applications', count: notifications.filter(n => n.type === 'application' || n.type === 'application_status').length },
    { value: 'opportunities', label: 'Opportunities', count: notifications.filter(n => n.type === 'opportunity_match').length },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Please log in to view notifications
          </h2>
          <p className="text-gray-600">
            You need to be logged in to see your notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                Stay updated with your latest activities and messages
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-1 overflow-x-auto pb-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{option.label}</span>
                {option.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    filter === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to load notifications</h3>
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-sm">
                {filter === 'all' 
                  ? "You're all caught up! No notifications yet."
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                    !notification.isRead ? getNotificationColor(notification.type) : 'border-l-gray-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        
                        <div className="flex items-center space-x-3">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mt-2">
                        {notification.message}
                      </p>
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notification._id);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                            >
                              <Check className="w-4 h-4" />
                              <span>Mark as read</span>
                            </button>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;