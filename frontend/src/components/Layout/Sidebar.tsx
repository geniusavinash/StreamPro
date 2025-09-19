import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  VideoCameraIcon,
  PlayIcon,
  DocumentIcon,
  KeyIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  SignalIcon,
  CloudIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  VideoCameraIcon as VideoCameraSolid,
  PlayIcon as PlaySolid,
  DocumentIcon as DocumentSolid,
  KeyIcon as KeySolid,
  ChartBarIcon as ChartBarSolid,
  CogIcon as CogSolid,
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'operator', 'viewer'] },
  { name: 'Cameras', href: '/cameras', icon: VideoCameraIcon, roles: ['admin', 'operator', 'viewer'] },
  { name: 'Live View', href: '/live', icon: PlayIcon, roles: ['admin', 'operator', 'viewer'] },
  { name: 'Recordings', href: '/recordings', icon: DocumentIcon, roles: ['admin', 'operator', 'viewer'] },
  { name: 'API Tokens', href: '/api-tokens', icon: KeyIcon, roles: ['admin', 'operator'] },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['admin', 'operator'] },
  { name: 'Settings', href: '/settings', icon: CogIcon, roles: ['admin'] },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="flex flex-col w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50 backdrop-blur-xl">
      {/* Modern Header */}
      <div className="flex items-center h-24 px-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg">
          <VideoCameraSolid className="h-10 w-10 text-white" />
        </div>
        <div className="ml-4 relative z-10">
          <span className="text-2xl font-bold text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            StreamPro
          </span>
          <div className="text-sm text-blue-100 font-medium">
            Camera Platform
          </div>
        </div>
      </div>
      
      {/* User Info */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 p-2 rounded-full">
            <UserIcon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-white">{user?.name || user?.email}</div>
            <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          const IconComponent = isActive ? 
            (item.icon === HomeIcon ? HomeSolid :
             item.icon === VideoCameraIcon ? VideoCameraSolid :
             item.icon === PlayIcon ? PlaySolid :
             item.icon === DocumentIcon ? DocumentSolid :
             item.icon === KeyIcon ? KeySolid :
             item.icon === ChartBarIcon ? ChartBarSolid :
             item.icon === CogIcon ? CogSolid : item.icon) : item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-5 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 relative overflow-hidden
                ${isActive
                  ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-xl transform scale-105 border border-blue-400/30'
                  : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:transform hover:scale-105 hover:shadow-lg'
                }
              `}
            >
              <IconComponent
                className={`
                  mr-4 h-6 w-6 flex-shrink-0 transition-all duration-300 relative z-10
                  ${isActive ? 'text-white drop-shadow-lg' : 'text-slate-400 group-hover:text-white group-hover:scale-110'}
                `}
              />
              <span className="relative z-10">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse relative z-10"></div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Modern Footer */}
      <div className="flex-shrink-0 p-4 border-t border-slate-700/50">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <SignalIcon className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-300">System Status</span>
            </div>
            <div className="text-xs text-green-400 font-medium">Online</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CloudIcon className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-300">Storage</span>
            </div>
            <div className="text-xs text-blue-400 font-medium">67% Used</div>
          </div>
        </div>
        
        <div className="mt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
            Logout
          </button>
          <div className="text-center mt-2">
            <div className="text-xs text-slate-500">
              StreamPro v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;