import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Camera } from '../types';
import {
  Squares2X2Icon,
  Square3Stack3DIcon,
  ViewColumnsIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type GridSize = 1 | 4 | 8 | 16 | 32;

const LiveView: React.FC = () => {
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);

  const { data: camerasData, isLoading, error } = useQuery<Camera[]>({
    queryKey: ['cameras', { isActive: true }],
    queryFn: () => apiService.getCameras({ isActive: true }),
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if enabled
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
  const onlineCameras = cameras.filter((camera: Camera) => camera.streamStatus === 'online');

  // Auto-select first cameras when grid size changes
  useEffect(() => {
    if (cameras.length > 0 && selectedCameras.length === 0) {
      const initialSelection = cameras.slice(0, Math.min(gridSize, cameras.length)).map((c: Camera) => c.id);
      setSelectedCameras(initialSelection);
    }
  }, [cameras, gridSize, selectedCameras.length]);

  const getGridColumns = (size: GridSize) => {
    switch (size) {
      case 1: return 1;
      case 4: return 2;
      case 8: return 3;
      case 16: return 4;
      case 32: return 6;
      default: return 2;
    }
  };

  const getGridRows = (size: GridSize) => {
    switch (size) {
      case 1: return 1;
      case 4: return 2;
      case 8: return 3;
      case 16: return 4;
      case 32: return 6;
      default: return 2;
    }
  };

  const handleCameraSelection = (cameraId: string, selected: boolean) => {
    if (selected) {
      if (selectedCameras.length < gridSize) {
        setSelectedCameras([...selectedCameras, cameraId]);
      }
    } else {
      setSelectedCameras(selectedCameras.filter(id => id !== cameraId));
    }
  };

  const getCameraById = (id: string) => cameras.find((c: Camera) => c.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '16rem' }}>
        <div className="animate-spin" style={{ height: '8rem', width: '8rem', border: '4px solid #e5e7eb', borderTop: '4px solid #2563eb', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
        <div className="flex">
          <ExclamationTriangleIcon style={{ height: '1.25rem', width: '1.25rem', color: '#f87171' }} />
          <div style={{ marginLeft: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#991b1b' }}>Failed to load cameras</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#b91c1c' }}>Please check your connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live View</h1>
          <p className="text-gray-600 mt-1">
            {onlineCameras.length} of {cameras.length} cameras online
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Grid Size Selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setGridSize(1)}
              className={`btn ${gridSize === 1 ? 'btn-primary' : 'btn-secondary'}`}
              title="Single View"
            >
              <ViewColumnsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setGridSize(4)}
              className={`btn ${gridSize === 4 ? 'btn-primary' : 'btn-secondary'}`}
              title="2x2 Grid"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setGridSize(8)}
              className={`btn ${gridSize === 8 ? 'btn-primary' : 'btn-secondary'}`}
              title="3x3 Grid"
            >
              <Square3Stack3DIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setGridSize(16)}
              className={`btn ${gridSize === 16 ? 'btn-primary' : 'btn-secondary'}`}
              title="4x4 Grid"
            >
              16
            </button>
            <button
              onClick={() => setGridSize(32)}
              className={`btn ${gridSize === 32 ? 'btn-primary' : 'btn-secondary'}`}
              title="6x6 Grid"
            >
              32
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-secondary"
            title="Settings"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="text-lg font-medium text-gray-900" style={{ marginBottom: '1rem' }}>Live View Settings</h3>
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Auto-refresh camera status (30s)</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex" style={{ height: 'calc(100vh - 12rem)', gap: '1.5rem' }}>
        {/* Camera Grid */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${getGridColumns(gridSize)}, 1fr)`,
              gridTemplateRows: `repeat(${getGridRows(gridSize)}, 1fr)`,
              gap: '0.5rem',
              height: '100%',
            }}
          >
            {Array.from({ length: gridSize }).map((_, index) => {
              const cameraId = selectedCameras[index];
              const camera = cameraId ? getCameraById(cameraId) : null;
              
              return (
                <div
                  key={index}
                  className="card"
                  style={{
                    padding: '0',
                    backgroundColor: camera ? '#000' : '#f9fafb',
                    border: camera ? '2px solid #10b981' : '2px dashed #d1d5db',
                    position: 'relative',
                    minHeight: '200px',
                  }}
                >
                  {camera ? (
                    <CameraStream
                      camera={camera}
                      onFullscreen={() => setFullscreenCamera(camera.id)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <PlayIcon style={{ height: '3rem', width: '3rem', color: '#9ca3af', margin: '0 auto 0.5rem' }} />
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          Select a camera to view
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Camera Selection Panel */}
        <div style={{ width: '20rem', flexShrink: 0 }}>
          <div className="card" style={{ height: '100%' }}>
            <h3 className="text-lg font-medium text-gray-900" style={{ marginBottom: '1rem' }}>
              Available Cameras ({cameras.length})
            </h3>
            
            <div style={{ height: 'calc(100% - 3rem)', overflowY: 'auto' }}>
              {cameras.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No cameras available</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cameras.map((camera: Camera) => (
                    <div
                      key={camera.id}
                      className={`card cursor-pointer transition-colors ${
                        selectedCameras.includes(camera.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleCameraSelection(
                        camera.id,
                        !selectedCameras.includes(camera.id)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center" style={{ marginBottom: '0.25rem' }}>
                            <div
                              style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                borderRadius: '50%',
                                backgroundColor: camera.streamStatus === 'online' ? '#10b981' : '#ef4444',
                                marginRight: '0.5rem',
                              }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {camera.name}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {camera.location}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {camera.company} {camera.model}
                          </p>
                        </div>
                        
                        {selectedCameras.includes(camera.id) && (
                          <div
                            style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              backgroundColor: '#2563eb',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {selectedCameras.indexOf(camera.id) + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenCamera && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setFullscreenCamera(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              cursor: 'pointer',
              zIndex: 51,
            }}
          >
            <XMarkIcon style={{ height: '1.5rem', width: '1.5rem', color: 'white' }} />
          </button>
          
          <div style={{ width: '90%', height: '90%' }}>
            <CameraStream
              camera={getCameraById(fullscreenCamera)!}
              fullscreen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Camera Stream Component
interface CameraStreamProps {
  camera: Camera;
  fullscreen?: boolean;
  onFullscreen?: () => void;
}

const CameraStream: React.FC<CameraStreamProps> = ({ camera, fullscreen = false, onFullscreen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Simulate HLS stream URL generation
  const getStreamUrl = (camera: Camera) => {
    // In a real implementation, this would generate the actual HLS URL
    return `/api/streams/${camera.id}/playlist.m3u8`;
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Camera Info Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '0.5rem',
          left: '0.5rem',
          right: '0.5rem',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            fontSize: fullscreen ? '1rem' : '0.75rem',
          }}
        >
          <div style={{ fontWeight: '500' }}>{camera.name}</div>
          <div style={{ opacity: 0.8 }}>{camera.location}</div>
        </div>

        {!fullscreen && onFullscreen && (
          <button
            onClick={onFullscreen}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <ArrowsPointingOutIcon style={{ height: '1rem', width: '1rem', color: 'white' }} />
          </button>
        )}
      </div>

      {/* Recording Indicator */}
      {camera.isRecording && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: fullscreen ? '3rem' : '0.5rem',
            zIndex: 10,
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '0.5rem',
              height: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '50%',
              marginRight: '0.25rem',
              animation: 'pulse 2s infinite',
            }}
          />
          REC
        </div>
      )}

      {/* Video Stream */}
      {camera.streamStatus === 'online' ? (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
              }}
            >
              <div className="animate-spin" style={{ height: '2rem', width: '2rem', border: '2px solid #e5e7eb', borderTop: '2px solid #2563eb', borderRadius: '50%' }}></div>
            </div>
          )}
          
          {hasError ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: '#1f2937',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <div>
                <ExclamationTriangleIcon style={{ height: '2rem', width: '2rem', margin: '0 auto 0.5rem', color: '#f87171' }} />
                <p style={{ fontSize: '0.875rem' }}>Stream Error</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Unable to load video stream</p>
              </div>
            </div>
          ) : (
            <video
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              muted
              playsInline
              onLoadStart={handleVideoLoad}
              onError={handleVideoError}
            >
              <source src={getStreamUrl(camera)} type="application/x-mpegURL" />
              Your browser does not support HLS video streaming.
            </video>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: '#1f2937',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <div>
            <ExclamationTriangleIcon style={{ height: '2rem', width: '2rem', margin: '0 auto 0.5rem', color: '#f87171' }} />
            <p style={{ fontSize: '0.875rem' }}>Camera Offline</p>
            <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              Status: {camera.streamStatus.charAt(0).toUpperCase() + camera.streamStatus.slice(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveView;