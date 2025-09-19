import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BellIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  SignalIcon,
  ServerIcon,
  CloudIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  BellIcon as BellSolid,
} from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Camera Online',
      message: 'Front Door camera reconnected successfully',
      time: '2 min ago',
      read: false,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Storage Alert',
      message: 'Storage usage reached 85% capacity',
      time: '10 min ago',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      title: 'Recording Complete',
      message: 'Scheduled recording for Parking Lot finished',
      time: '1 hour ago',
      read: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cameras, recordings, or settings..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center space-x-4 mx-6">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
            <div className="flex items-center space-x-2">
              <SignalIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Online</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">4 Cameras</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <CloudIcon className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600">67% Storage</span>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              {unreadCount > 0 ? (
                <BellSolid className="h-6 w-6 text-blue-600" />
              ) : (
                <BellIcon className="h-6 w-6" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Mark all read
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200 ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${
                          notification.type === 'success' ? 'bg-green-100' :
                          notification.type === 'warning' ? 'bg-amber-100' :
                          'bg-blue-100'
                        }`}>
                          {notification.type === 'warning' ? (
                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                          ) : (
                            <SignalIcon className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
            <Cog6ToothIcon className="h-6 w-6" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-full">
                <UserCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user?.name || user?.email}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-full">
                      <UserCircleIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user?.name || user?.email}</div>
                      <div className="text-xs text-gray-500 capitalize">{user?.role} Account</div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                    <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400" />
                    Profile Settings
                  </button>
                  <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                    <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400" />
                    Preferences
                  </button>
                </div>
                <div className="border-t border-gray-100 py-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;