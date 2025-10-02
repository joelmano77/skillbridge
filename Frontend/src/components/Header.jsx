import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { MessagingProvider } from '../contexts/MessagingContext';

const Header = ({ user, onLoginClick, onSignUpClick, onHomeClick, onDashboardClick, onAboutClick, onOpportunitiesClick, onMessagesClick, onNotificationsClick, onLogout, onProfileClick, activePage }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const userRoleRaw = user?.userType || 'volunteer';
  const userRole = userRoleRaw.toLowerCase() === 'ngo' ? 'NGO' : 'Volunteer';

  return (
<header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={onHomeClick}>
            <img src="/SkillBridge logo.png" alt="SkillBridge Logo" className="h-8 w-auto mr-2 cursor-pointer" />
            <span className="text-lg font-semibold text-gray-900"></span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button onClick={onHomeClick} className={`${activePage === 'home' ? 'text-red-600' : 'text-gray-700 hover:text-gray-900'}`}>Home</button>
            <button onClick={onAboutClick} className={`${activePage === 'about' ? 'text-red-600' : 'text-gray-700 hover:text-gray-900'}`}>About</button>
            {user && <button onClick={onDashboardClick} className={`${activePage === 'dashboard' ? 'text-red-600' : 'text-gray-700 hover:text-gray-900'}`}>Dashboard</button>}
            {user && <button onClick={onOpportunitiesClick} className={`${activePage === 'opportunities' ? 'text-red-600' : 'text-gray-700 hover:text-gray-900'}`}>Opportunities</button>}
            {user && (
              <button 
                onClick={onMessagesClick} 
                className={`${activePage === 'messages' ? 'text-red-600' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Messages
              </button>
            )}
          </nav>

          {/* Auth Section */}
          <div className="relative flex items-center space-x-4" ref={dropdownRef}>
            {user ? (
              <>
                {/* Messaging and Notifications */}
                <MessagingProvider>
                  <div className="flex items-center space-x-2">
                    {/* Messages Button */}
                    <button
                      onClick={onMessagesClick}
                      className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
                      title="Messages"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    
                    {/* Notifications */}
                    <NotificationDropdown />
                  </div>
                </MessagingProvider>

                {/* User Role Badge */}
                <div className={`px-2 py-1 rounded text-xs font-semibold ${userRole === 'NGO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {userRole}
                </div>

                {/* Profile Logo */}
                <button onClick={toggleDropdown} className="focus:outline-none">
                  <img
                    src={user.profileImage || '/profileimg.jpeg'}
                    alt="Profile"
                    className="h-10 w-10 rounded-full border-2 border-gray-400 shadow-md"
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-1/2 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-50 translate-x-1/2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onHomeClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onAboutClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      About
                    </button>
                    {user && (
                      <>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onDashboardClick();
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Dashboard
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onMessagesClick();
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Messages
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onDiscoverClick();
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Find Contacts
                        </button>
                      </>
                    )}
                    {user && (
                      <>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onNotificationsClick();
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Notifications
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpportunitiesClick();
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Opportunities
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Login
                </button>
                <button
                  onClick={onSignUpClick}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
