import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const Layout: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <Header />
        
        {/* Network Status Banner */}
        {!isOnline && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 text-center text-sm shadow-lg">
            <span className="font-medium">⚠️ You are offline</span>
            <span className="ml-2">Some features may not be available.</span>
          </div>
        )}
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/80 via-blue-50/80 to-indigo-50/80 backdrop-blur-sm">
          <div className="p-8 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;