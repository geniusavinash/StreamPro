import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Camera } from '../types';
import {
  VideoCameraIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  TrashIcon,
  SignalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  VideoCameraIcon as VideoCameraSolid,
  PlayIcon as PlaySolid,
} from '@heroicons/react/24/solid';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingState from '../components/UI/LoadingState';
import ErrorState from '../components/UI/ErrorState';
import { useErrorHandler } from '../hooks/useErrorHandler';

const Cameras: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'recording'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);
  const [showRtmpModal, setShowRtmpModal] = useState(false);
  const [rtmpData, setRtmpData] = useState<{
    rtmpUrl: string;
    streamKey: string;
    hlsUrl: string;
    dashUrl: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const { data: camerasData, isLoading, error } = useQuery<Camera[]>({
    queryKey: ['cameras'],
    queryFn: apiService.getCameras,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 3,
    retryDelay: 1000,
  });

  const cameras = useMemo(() => {
    if (Array.isArray(camerasData)) {
      return camerasData;
    } else if (camerasData && typeof camerasData === 'object' && 'cameras' in camerasData && Array.isArray((camerasData as any).cameras)) {
      return (camerasData as any).cameras;
    }
    return [];
  }, [camerasData]);

  // Mutations
  const deleteCameraMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteCamera(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setShowDeleteConfirm(false);
      setCameraToDelete(null);
    },
    onError: (error: any) => {
      const errorMessage = handleError(error, 'delete camera');
      console.error('Delete camera error:', errorMessage);
    },
  });

  const toggleRecordingMutation = useMutation({
    mutationFn: (id: string) => apiService.toggleRecording(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error, 'toggle recording');
      console.error('Toggle recording error:', errorMessage);
    },
  });

  const generateRtmpMutation = useMutation({
    mutationFn: (cameraId: string) => apiService.generateRtmpUrl(cameraId),
    onSuccess: (data) => {
      setRtmpData(data);
      setShowRtmpModal(true);
    },
    onError: (error: any) => {
      const errorMessage = handleError(error, 'generate RTMP URL');
      console.error('Generate RTMP error:', errorMessage);
    },
  });

  const startStreamMutation = useMutation({
    mutationFn: (cameraId: string) => apiService.startStream(cameraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error, 'start stream');
      console.error('Start stream error:', errorMessage);
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: (cameraId: string) => apiService.stopStream(cameraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error, 'stop stream');
      console.error('Stop stream error:', errorMessage);
    },
  });

  const activateCameraMutation = useMutation({
    mutationFn: (id: string) => apiService.activateCamera(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error, 'activate camera');
      console.error('Activate camera error:', errorMessage);
    },
  });

  const deactivateCameraMutation = useMutation({
    mutationFn: (id: string) => apiService.deactivateCamera(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error, 'deactivate camera');
      console.error('Deactivate camera error:', errorMessage);
    },
  });

  // Handler functions
  const handleAddCamera = () => {
    setShowAddModal(true);
  };

  const handleEditCamera = (camera: Camera) => {
    setSelectedCamera(camera);
    setShowEditModal(true);
  };

  const handleDeleteCamera = (camera: Camera) => {
    setCameraToDelete(camera);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (cameraToDelete) {
      deleteCameraMutation.mutate(cameraToDelete.id);
    }
  };

  const handleToggleRecording = (camera: Camera) => {
    toggleRecordingMutation.mutate(camera.id);
  };

  const handleViewCamera = (camera: Camera) => {
    // Navigate to live view with specific camera
    window.location.href = `/live-view?camera=${camera.id}`;
  };

  const handleToggleCameraStatus = (camera: Camera) => {
    if (camera.status === 'online') {
      deactivateCameraMutation.mutate(camera.id);
    } else {
      activateCameraMutation.mutate(camera.id);
    }
  };

  const filteredCameras = cameras?.filter((camera: Camera) => {
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'online') return matchesSearch && camera.status === 'online';
    if (filterStatus === 'offline') return matchesSearch && camera.status === 'offline';
    if (filterStatus === 'recording') return matchesSearch && camera.isRecording;
    
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <LoadingState message="Loading cameras..." size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <ErrorState 
          title="Failed to load cameras"
          message="Unable to fetch camera data. Please check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <VideoCameraSolid className="h-8 w-8 text-blue-600 mr-3" />
                Camera Management
              </h1>
              <p className="text-gray-600 text-lg">
                Monitor and manage all your cameras from one central location
              </p>
            </div>
            <button 
              onClick={handleAddCamera}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Camera</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cameras by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-3">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Cameras</option>
                <option value="online">Online Only</option>
                <option value="offline">Offline Only</option>
                <option value="recording">Recording</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{cameras?.length || 0}</div>
                <div className="text-sm text-gray-500">Total Cameras</div>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <VideoCameraSolid className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {cameras?.filter((c: Camera) => c.status === 'online').length || 0}
                </div>
                <div className="text-sm text-gray-500">Online</div>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <SignalIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {cameras?.filter((c: Camera) => c.status === 'offline').length || 0}
                </div>
                <div className="text-sm text-gray-500">Offline</div>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {cameras?.filter((c: Camera) => c.isRecording).length || 0}
                </div>
                <div className="text-sm text-gray-500">Recording</div>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <PlaySolid className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCameras.map((camera: Camera) => (
            <div key={camera.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              {/* Camera Preview */}
              <div className="relative h-48 bg-gray-900">
                {camera.status === 'online' ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <VideoCameraIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Live Feed</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <VideoCameraIcon className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">No Signal</p>
                    </div>
                  </div>
                )}
                
                {/* Status Overlay */}
                <div className="absolute top-3 left-3">
                  <button
                    onClick={() => handleToggleCameraStatus(camera)}
                    disabled={activateCameraMutation.isPending || deactivateCameraMutation.isPending}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <StatusBadge 
                      status={camera.status === 'online' ? 'online' : 'offline'} 
                      size="sm"
                    />
                  </button>
                </div>
                
                {/* Recording Indicator */}
                {camera.isRecording && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                      REC
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{camera.name}</h3>
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{camera.viewers || 0}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{camera.location}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Resolution: {camera.resolution || '1080p'}</span>
                  <span>FPS: {camera.fps || 30}</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Primary Actions */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewCamera(camera)}
                      className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={camera.status === 'offline'}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    
                    <button 
                      onClick={() => generateRtmpMutation.mutate(camera.id)}
                      className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={generateRtmpMutation.isPending}
                    >
                      {generateRtmpMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-1"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <SignalIcon className="h-4 w-4 mr-1" />
                          RTMP
                        </>
                      )}
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleToggleRecording(camera)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                        camera.isRecording 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      disabled={camera.status === 'offline' || toggleRecordingMutation.isPending}
                    >
                      {toggleRecordingMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-1"></div>
                          {camera.isRecording ? 'Stopping...' : 'Starting...'}
                        </>
                      ) : camera.isRecording ? (
                        <>
                          <StopIcon className="h-4 w-4 mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Record
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleEditCamera(camera)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      title="Edit Camera"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteCamera(camera)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete Camera"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCameras.length === 0 && (
          <div className="text-center py-20">
            <VideoCameraIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cameras found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first camera to the system.'
              }
            </p>
            <button 
              onClick={handleAddCamera}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Camera
            </button>
          </div>
        )}
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Camera</h3>
            <p className="text-gray-600 mb-6">Camera management functionality will be implemented soon.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Camera Modal */}
      {showEditModal && selectedCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Camera</h3>
            <p className="text-gray-600 mb-2">Camera: <strong>{selectedCamera.name}</strong></p>
            <p className="text-gray-600 mb-6">Camera editing functionality will be implemented soon.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && cameraToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Delete Camera</h3>
            <p className="text-gray-600 mb-2">Are you sure you want to delete <strong>{cameraToDelete.name}</strong>?</p>
            <p className="text-red-600 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                disabled={deleteCameraMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn btn-danger"
                disabled={deleteCameraMutation.isPending}
              >
                {deleteCameraMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Camera'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RTMP URL Modal */}
      {showRtmpModal && rtmpData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">RTMP Stream URLs</h3>
              <button
                onClick={() => setShowRtmpModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* RTMP URL */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <label className="block text-sm font-semibold text-blue-900 mb-2">RTMP URL (for streaming)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rtmpData.rtmpUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(rtmpData.rtmpUrl)}
                    className="btn btn-primary text-sm px-3 py-2"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Stream Key */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <label className="block text-sm font-semibold text-green-900 mb-2">Stream Key</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rtmpData.streamKey}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(rtmpData.streamKey)}
                    className="btn btn-success text-sm px-3 py-2"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* HLS URL */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                <label className="block text-sm font-semibold text-purple-900 mb-2">HLS URL (for playback)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rtmpData.hlsUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(rtmpData.hlsUrl)}
                    className="btn btn-secondary text-sm px-3 py-2"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* DASH URL */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                <label className="block text-sm font-semibold text-orange-900 mb-2">DASH URL (for playback)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rtmpData.dashUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-orange-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(rtmpData.dashUrl)}
                    className="btn btn-secondary text-sm px-3 py-2"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h4 className="font-semibold text-yellow-900 mb-2">📋 How to use:</h4>
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Use the <strong>RTMP URL</strong> in your streaming software (OBS, FFmpeg, etc.)</li>
                <li>Use the <strong>Stream Key</strong> as the stream key in your software</li>
                <li>Use the <strong>HLS URL</strong> for web playback with video.js or similar</li>
                <li>Use the <strong>DASH URL</strong> for adaptive streaming</li>
              </ol>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowRtmpModal(false)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cameras;