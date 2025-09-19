import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import {
  ChartBarIcon,
  EyeIcon,
  PlayIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: cameraAnalytics } = useQuery({
    queryKey: ['analytics', 'cameras', timeRange],
    queryFn: () => apiService.getCameraAnalytics(timeRange),
    retry: 3,
    retryDelay: 1000,
  });

  const { data: recordingAnalytics } = useQuery({
    queryKey: ['analytics', 'recordings', timeRange],
    queryFn: () => apiService.getRecordingAnalytics(timeRange),
    retry: 3,
    retryDelay: 1000,
  });

  const { data: streamingAnalytics } = useQuery({
    queryKey: ['analytics', 'streaming', timeRange],
    queryFn: () => apiService.getStreamingAnalytics(timeRange),
    retry: 3,
    retryDelay: 1000,
  });

  const { data: systemAnalytics } = useQuery({
    queryKey: ['analytics', 'system', timeRange],
    queryFn: () => apiService.getSystemAnalytics(timeRange),
    retry: 3,
    retryDelay: 1000,
  });

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'cameras', name: 'Cameras' },
    { id: 'recordings', name: 'Recordings' },
    { id: 'streaming', name: 'Streaming' },
    { id: 'system', name: 'System' },
  ];

  // Helper functions for formatting data
  // const formatNumber = (num: number) => {
  //   if (num >= 1000000) {
  //     return (num / 1000000).toFixed(1) + 'M';
  //   } else if (num >= 1000) {
  //     return (num / 1000).toFixed(1) + 'K';
  //   }
  //   return num.toString();
  // };

  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  // const formatDuration = (seconds: number) => {
  //   const hours = Math.floor(seconds / 3600);
  //   const minutes = Math.floor((seconds % 3600) / 60);
  //   return `${hours}h ${minutes}m`;
  // };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your streaming platform</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Views"
              value="12,847"
              change={12.5}
              icon={EyeIcon}
              color="blue"
            />
            <MetricCard
              title="Recording Hours"
              value="1,247"
              change={8.2}
              icon={PlayIcon}
              color="green"
            />
            <MetricCard
              title="Active Cameras"
              value="8"
              change={-2.1}
              icon={ChartBarIcon}
              color="purple"
            />
            <MetricCard
              title="Uptime"
              value="99.9%"
              change={0.1}
              icon={ClockIcon}
              color="indigo"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Viewership Trends</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recording Activity</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PlayIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <ActivityItem
                icon={EyeIcon}
                title="Peak viewership reached"
                description="1,247 concurrent viewers on Front Door camera"
                time="2 hours ago"
                type="success"
              />
              <ActivityItem
                icon={PlayIcon}
                title="Recording completed"
                description="Parking Lot camera - 2.5 hours recorded"
                time="4 hours ago"
                type="info"
              />
              <ActivityItem
                icon={ChartBarIcon}
                title="Storage usage alert"
                description="Storage usage reached 85% capacity"
                time="6 hours ago"
                type="warning"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cameras Tab */}
      {activeTab === 'cameras' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera Performance</h3>
                <div className="space-y-4">
                  {cameraAnalytics?.cameras?.map((camera: any) => (
                    <div key={camera.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{camera.name}</h4>
                        <p className="text-sm text-gray-600">{camera.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {camera.uptime}%
                        </div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cameras</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Front Door</span>
                    <span className="text-sm font-medium text-gray-900">1,247 views</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Parking Lot</span>
                    <span className="text-sm font-medium text-gray-900">892 views</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lobby</span>
                    <span className="text-sm font-medium text-gray-900">654 views</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Online</span>
                    <span className="text-sm font-medium text-green-600">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Offline</span>
                    <span className="text-sm font-medium text-red-600">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Recording</span>
                    <span className="text-sm font-medium text-blue-600">5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recordings Tab */}
      {activeTab === 'recordings' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Recordings"
              value="1,247"
              change={15.2}
              icon={PlayIcon}
              color="blue"
            />
            <MetricCard
              title="Storage Used"
              value="4.2 TB"
              change={8.7}
              icon={ChartBarIcon}
              color="green"
            />
            <MetricCard
              title="Avg Duration"
              value="2.5h"
              change={-3.1}
              icon={ClockIcon}
              color="purple"
            />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recording Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <PlayIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Recording analytics chart would go here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streaming Tab */}
      {activeTab === 'streaming' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Streams"
              value="2,847"
              change={22.1}
              icon={PlayIcon}
              color="blue"
            />
            <MetricCard
              title="Peak Viewers"
              value="1,247"
              change={18.5}
              icon={EyeIcon}
              color="green"
            />
            <MetricCard
              title="Avg Bitrate"
              value="2.4 Mbps"
              change={-5.2}
              icon={ChartBarIcon}
              color="purple"
            />
            <MetricCard
              title="Quality Score"
              value="4.8/5"
              change={0.3}
              icon={ClockIcon}
              color="indigo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stream Quality</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Quality metrics chart would go here</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Viewer Distribution</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <EyeIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Viewer distribution chart would go here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="CPU Usage"
              value="23%"
              change={-2.1}
              icon={ChartBarIcon}
              color="blue"
            />
            <MetricCard
              title="Memory Usage"
              value="6.4 GB"
              change={1.2}
              icon={ClockIcon}
              color="green"
            />
            <MetricCard
              title="Storage Usage"
              value="67%"
              change={5.8}
              icon={PlayIcon}
              color="purple"
            />
            <MetricCard
              title="Network I/O"
              value="145 Mbps"
              change={12.3}
              icon={EyeIcon}
              color="indigo"
            />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">System performance chart would go here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 ${colorClasses[color as keyof typeof colorClasses]}`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <div className="flex items-center mt-1">
            {change > 0 ? (
              <ArrowUpIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs previous period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Item Component
interface ActivityItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ icon: Icon, title, description, time, type }) => {
  const typeClasses = {
    success: 'text-green-600 bg-green-100',
    info: 'text-blue-600 bg-blue-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
  };

  return (
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-full ${typeClasses[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

export default Analytics;
