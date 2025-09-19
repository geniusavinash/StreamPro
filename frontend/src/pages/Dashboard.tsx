import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';
import {
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  EyeIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import {
  VideoCameraIcon as VideoCameraSolid,
  PlayIcon as PlaySolid,
  DocumentIcon as DocumentSolid,
  ServerIcon as ServerSolid,
} from '@heroicons/react/24/solid';
import MetricCard from '../components/UI/MetricCard';
import LoadingState from '../components/UI/LoadingState';
import ErrorState from '../components/UI/ErrorState';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: apiService.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: 1000,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingState message="Loading dashboard data..." size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <ErrorState 
          title="Failed to load dashboard"
          message="Unable to fetch dashboard data. Please check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const cameraStats = stats?.cameras || { total: 0, online: 0, offline: 0, recording: 0 };
  const recordingStats = stats?.recordings || { totalCount: 0, totalSize: 0, activeSessions: 0 };
  const systemStats = stats?.system || { uptime: 0, memory: { used: 0, total: 0, percentage: 0 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Dashboard Overview
              </h1>
              <p className="text-gray-600 text-lg">
                Real-time monitoring of your camera streaming platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                System Online
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Cameras"
            value={cameraStats.total}
            subtitle={`${cameraStats.online} online, ${cameraStats.offline} offline`}
            icon={VideoCameraSolid}
            color="blue"
            trend={{
              value: 12,
              label: 'vs last month',
              direction: 'up'
            }}
          />
          
          <MetricCard
            title="Recording"
            value={cameraStats.recording}
            subtitle={`${recordingStats.activeSessions} active sessions`}
            icon={PlaySolid}
            color="red"
            trend={{
              value: 8,
              label: 'vs yesterday',
              direction: 'up'
            }}
          />
          
          <MetricCard
            title="Recordings"
            value={recordingStats.totalCount}
            subtitle={`${formatBytes(recordingStats.totalSize)} used`}
            icon={DocumentSolid}
            color="purple"
            trend={{
              value: 5,
              label: 'storage growth',
              direction: 'up'
            }}
          />
          
          <MetricCard
            title="System Status"
            value="Healthy"
            subtitle={`Uptime: ${formatUptime(systemStats.uptime)}`}
            icon={ServerSolid}
            color="green"
            trend={{
              value: 99.9,
              label: 'availability',
              direction: 'up'
            }}
          />
        </div>

        {/* Modern Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                Recent Activity
              </h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="bg-green-500 p-2 rounded-full mr-4">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Camera <span className="text-green-600">Front Door</span> came online
                  </p>
                  <p className="text-xs text-gray-500 mt-1">System automatically detected connection</p>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  2 min ago
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="bg-blue-500 p-2 rounded-full mr-4">
                  <PlayIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Recording started for <span className="text-blue-600">Parking Lot</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Scheduled recording session initiated</p>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  5 min ago
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="bg-amber-500 p-2 rounded-full mr-4">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Storage usage reached <span className="text-amber-600">85%</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Consider archiving old recordings</p>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  10 min ago
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <EyeIcon className="h-5 w-5 text-purple-600 mr-2" />
                Live Viewers
              </h4>
              <div className="text-3xl font-bold text-purple-600 mb-2">1,247</div>
              <div className="text-sm text-gray-500">Active viewers across all cameras</div>
              <div className="mt-4 flex items-center space-x-2">
                <div className="flex-1 bg-purple-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full w-4/5"></div>
                </div>
                <span className="text-xs text-purple-600">+12%</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CpuChipIcon className="h-5 w-5 text-indigo-600 mr-2" />
                System Load
              </h4>
              <div className="text-3xl font-bold text-indigo-600 mb-2">23%</div>
              <div className="text-sm text-gray-500">CPU usage across all nodes</div>
              <div className="mt-4 flex items-center space-x-2">
                <div className="flex-1 bg-indigo-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full w-1/4"></div>
                </div>
                <span className="text-xs text-green-600">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;