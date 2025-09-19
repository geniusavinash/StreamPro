import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  CogIcon,
  VideoCameraIcon,
  DocumentIcon,
  ServerIcon,
  BellIcon,
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('streaming');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    streaming: {
      rtmpPort: 1935,
      hlsPort: 8080,
      maxBitrate: 4000,
      quality: 'high',
      autoStart: true,
    },
    recording: {
      format: 'mp4',
      quality: 'high',
      retentionDays: 30,
      autoDelete: true,
      compression: 'medium',
    },
    storage: {
      maxSize: 1000, // GB
      path: '/var/recordings',
      compression: true,
      cloudSync: false,
    },
    notifications: {
      email: true,
      push: true,
      cameraOffline: true,
      storageWarning: true,
      recordingComplete: false,
    },
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiService.getSettings(),
    retry: 3,
    retryDelay: 1000,
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => apiService.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (settings) {
      setFormData(settings);
    }
    setIsEditing(false);
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const tabs = [
    { id: 'streaming', name: 'Streaming', icon: VideoCameraIcon },
    { id: 'recording', name: 'Recording', icon: DocumentIcon },
    { id: 'storage', name: 'Storage', icon: ServerIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your camera streaming platform</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {tabs.find(tab => tab.id === activeTab)?.name} Settings
              </h2>
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={updateSettingsMutation.isPending}
                      className="btn btn-success flex items-center"
                    >
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {updateSettingsMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn btn-secondary flex items-center"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary flex items-center"
                  >
                    <CogIcon className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Streaming Settings */}
            {activeTab === 'streaming' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RTMP Port
                    </label>
                    <input
                      type="number"
                      value={formData.streaming.rtmpPort}
                      onChange={(e) => handleInputChange('streaming', 'rtmpPort', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HLS Port
                    </label>
                    <input
                      type="number"
                      value={formData.streaming.hlsPort}
                      onChange={(e) => handleInputChange('streaming', 'hlsPort', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Bitrate (kbps)
                    </label>
                    <input
                      type="number"
                      value={formData.streaming.maxBitrate}
                      onChange={(e) => handleInputChange('streaming', 'maxBitrate', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Quality
                    </label>
                    <select
                      value={formData.streaming.quality}
                      onChange={(e) => handleInputChange('streaming', 'quality', e.target.value)}
                      disabled={!isEditing}
                      className="input"
                    >
                      <option value="low">Low (480p)</option>
                      <option value="medium">Medium (720p)</option>
                      <option value="high">High (1080p)</option>
                      <option value="ultra">Ultra (4K)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.streaming.autoStart}
                      onChange={(e) => handleInputChange('streaming', 'autoStart', e.target.checked)}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Auto-start cameras when they come online</span>
                  </label>
                </div>
              </div>
            )}

            {/* Recording Settings */}
            {activeTab === 'recording' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recording Format
                    </label>
                    <select
                      value={formData.recording.format}
                      onChange={(e) => handleInputChange('recording', 'format', e.target.value)}
                      disabled={!isEditing}
                      className="input"
                    >
                      <option value="mp4">MP4</option>
                      <option value="avi">AVI</option>
                      <option value="mov">MOV</option>
                      <option value="mkv">MKV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality
                    </label>
                    <select
                      value={formData.recording.quality}
                      onChange={(e) => handleInputChange('recording', 'quality', e.target.value)}
                      disabled={!isEditing}
                      className="input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retention (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.recording.retentionDays}
                      onChange={(e) => handleInputChange('recording', 'retentionDays', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compression
                    </label>
                    <select
                      value={formData.recording.compression}
                      onChange={(e) => handleInputChange('recording', 'compression', e.target.value)}
                      disabled={!isEditing}
                      className="input"
                    >
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recording.autoDelete}
                      onChange={(e) => handleInputChange('recording', 'autoDelete', e.target.checked)}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Automatically delete old recordings</span>
                  </label>
                </div>
              </div>
            )}

            {/* Storage Settings */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Storage (GB)
                    </label>
                    <input
                      type="number"
                      value={formData.storage.maxSize}
                      onChange={(e) => handleInputChange('storage', 'maxSize', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Storage Path
                    </label>
                    <input
                      type="text"
                      value={formData.storage.path}
                      onChange={(e) => handleInputChange('storage', 'path', e.target.value)}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.storage.compression}
                      onChange={(e) => handleInputChange('storage', 'compression', e.target.checked)}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Enable compression for storage optimization</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.storage.cloudSync}
                      onChange={(e) => handleInputChange('storage', 'cloudSync', e.target.checked)}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Sync recordings to cloud storage</span>
                  </label>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Notification Channels</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.email}
                        onChange={(e) => handleInputChange('notifications', 'email', e.target.checked)}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.push}
                        onChange={(e) => handleInputChange('notifications', 'push', e.target.checked)}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Push notifications</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.cameraOffline}
                        onChange={(e) => handleInputChange('notifications', 'cameraOffline', e.target.checked)}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Camera goes offline</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.storageWarning}
                        onChange={(e) => handleInputChange('notifications', 'storageWarning', e.target.checked)}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Storage space warning</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.recordingComplete}
                        onChange={(e) => handleInputChange('notifications', 'recordingComplete', e.target.checked)}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Recording completed</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Security Settings
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Security settings are managed by your system administrator.</p>
                        <p className="mt-1">Contact support if you need to modify these settings.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current User Role
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
                      {user?.role?.toUpperCase() || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
                      {user?.permissions?.join(', ') || 'No permissions assigned'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
