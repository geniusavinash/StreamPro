import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Camera } from '../types';
import {
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CalendarDaysIcon,
  VideoCameraIcon,
  XMarkIcon,
  ForwardIcon,
  BackwardIcon,
} from '@heroicons/react/24/outline';

interface RecordingWithDetails {
  id: string;
  cameraId: string;
  filename: string;
  duration: number;
  size: number;
  fileSize: number;
  storageTier: 'hot' | 'warm' | 'cold';
  startTime: string;
  endTime?: string;
  status: 'recording' | 'completed' | 'failed';
  createdAt: string;
  camera: {
    id: string;
    name: string;
    location: string;
  };
  downloadUrl?: string;
  thumbnailUrl?: string;
}

const Recordings: React.FC = () => {
  const [filters, setFilters] = useState({
    cameraId: '',
    startDate: '',
    endDate: '',
    storageTier: '',
  });
  const [selectedRecording, setSelectedRecording] = useState<RecordingWithDetails | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { data: camerasData } = useQuery<Camera[]>({
    queryKey: ['cameras'],
    queryFn: () => apiService.getCameras({}),
    retry: 3,
    retryDelay: 1000,
  });

  const { data: recordingsData, isLoading, error } = useQuery<RecordingWithDetails[]>({
    queryKey: ['recordings', filters, currentPage, pageSize],
    queryFn: async () => {
      const data = await apiService.getRecordings({
        ...filters,
        page: currentPage,
        limit: pageSize,
      });
      return data.map(recording => ({
        ...recording,
        camera: {
          id: recording.cameraId,
          name: camerasData?.find(c => c.id === recording.cameraId)?.name || 'Camera ' + recording.cameraId,
          location: camerasData?.find(c => c.id === recording.cameraId)?.location || 'Unknown Location'
        },
        fileSize: recording.size,
        storageTier: 'hot' as const,
        downloadUrl: undefined,
        thumbnailUrl: undefined
      }));
    },
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
  const recordings = recordingsData || [];
  const totalRecordings = recordings.length;
  const totalPages = Math.ceil(totalRecordings / pageSize);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStorageTierColor = (tier: string) => {
    switch (tier) {
      case 'hot': return '#10b981';
      case 'warm': return '#f59e0b';
      case 'cold': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleDownload = async (recording: RecordingWithDetails) => {
    try {
      const response = await apiService.getRecordingDownloadUrl(recording.id);
      const link = document.createElement('a');
      link.href = response.downloadUrl;
      link.download = recording.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download recording:', error);
    }
  };

  const handleDelete = async (recording: RecordingWithDetails) => {
    if (window.confirm(`Are you sure you want to delete recording "${recording.filename}"?`)) {
      try {
        await apiService.deleteRecording(recording.id);
        // Refresh the recordings list
        window.location.reload();
      } catch (error) {
        console.error('Failed to delete recording:', error);
      }
    }
  };

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
        <p style={{ color: '#b91c1c' }}>Failed to load recordings. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
          <p className="text-gray-600 mt-2">Browse and manage recorded footage</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              <VideoCameraIcon style={{ height: '1rem', width: '1rem', display: 'inline', marginRight: '0.25rem' }} />
              Camera
            </label>
            <select
              className="form-input"
              value={filters.cameraId}
              onChange={(e) => setFilters({ ...filters, cameraId: e.target.value })}
            >
              <option value="">All Cameras</option>
              {cameras.map((camera: any) => (
                <option key={camera.id} value={camera.id}>
                  {camera.name} - {camera.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              <CalendarDaysIcon style={{ height: '1rem', width: '1rem', display: 'inline', marginRight: '0.25rem' }} />
              Start Date
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              <CalendarDaysIcon style={{ height: '1rem', width: '1rem', display: 'inline', marginRight: '0.25rem' }} />
              End Date
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Storage Tier</label>
            <select
              className="form-input"
              value={filters.storageTier}
              onChange={(e) => setFilters({ ...filters, storageTier: e.target.value })}
            >
              <option value="">All Tiers</option>
              <option value="hot">Hot Storage</option>
              <option value="warm">Warm Storage</option>
              <option value="cold">Cold Storage</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center" style={{ marginTop: '1rem' }}>
          <button
            onClick={() => setFilters({ cameraId: '', startDate: '', endDate: '', storageTier: '' })}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {totalRecordings} recording{totalRecordings !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Recordings List */}
      {recordings.length === 0 ? (
        <div className="card text-center py-12">
          <VideoCameraIcon style={{ height: '3rem', width: '3rem', color: '#9ca3af', margin: '0 auto 1rem' }} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings found</h3>
          <p className="text-gray-600">Try adjusting your filters or check back later for new recordings</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {recordings.map((recording: RecordingWithDetails) => (
            <div key={recording.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ flex: 1 }}>
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '120px',
                      height: '68px',
                      backgroundColor: '#000',
                      borderRadius: '0.375rem',
                      marginRight: '1rem',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {recording.thumbnailUrl ? (
                      <img
                        src={recording.thumbnailUrl}
                        alt="Recording thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <VideoCameraIcon style={{ height: '1.5rem', width: '1.5rem', color: '#6b7280' }} />
                      </div>
                    )}
                    
                    {/* Duration Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.25rem',
                        right: '0.25rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '0.125rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      {formatDuration(recording.duration)}
                    </div>
                  </div>

                  {/* Recording Info */}
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center" style={{ marginBottom: '0.5rem' }}>
                      <h3 className="text-lg font-medium text-gray-900" style={{ marginRight: '1rem' }}>
                        {recording.camera.name}
                      </h3>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getStorageTierColor(recording.storageTier) + '20',
                          color: getStorageTierColor(recording.storageTier),
                        }}
                      >
                        {recording.storageTier.toUpperCase()}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div>
                        <strong>Location:</strong> {recording.camera.location}
                      </div>
                      <div>
                        <strong>Start Time:</strong> {new Date(recording.startTime).toLocaleString()}
                      </div>
                      <div>
                        <strong>End Time:</strong> {recording.endTime ? new Date(recording.endTime).toLocaleString() : 'N/A'}
                      </div>
                      <div>
                        <strong>File Size:</strong> {formatFileSize(recording.fileSize)}
                      </div>
                      <div>
                        <strong>Filename:</strong> {recording.filename}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRecording(recording);
                      setShowPlayer(true);
                    }}
                    className="btn btn-primary"
                    title="Play Recording"
                  >
                    <PlayIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDownload(recording)}
                    className="btn btn-success"
                    title="Download Recording"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(recording)}
                    className="btn btn-danger"
                    title="Delete Recording"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2" style={{ marginTop: '2rem' }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`btn ${currentPage === 1 ? 'btn-secondary' : 'btn-primary'}`}
          >
            <BackwardIcon className="w-4 h-4" />
          </button>

          <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`btn ${currentPage === totalPages ? 'btn-secondary' : 'btn-primary'}`}
          >
            <ForwardIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Video Player Modal */}
      {showPlayer && selectedRecording && (
        <VideoPlayerModal
          recording={selectedRecording}
          onClose={() => {
            setShowPlayer(false);
            setSelectedRecording(null);
          }}
        />
      )}
    </div>
  );
};

// Video Player Modal Component
interface VideoPlayerModalProps {
  recording: RecordingWithDetails;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ recording, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
  };

  const handlePlaybackRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
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
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{recording.camera.name}</h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {new Date(recording.startTime).toLocaleString()} - {recording.endTime ? new Date(recording.endTime).toLocaleString() : 'N/A'}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
        >
          <XMarkIcon style={{ height: '1.5rem', width: '1.5rem' }} />
        </button>
      </div>

      {/* Video Player */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video
          ref={videoRef}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          controls={false}
        >
          <source src={recording.downloadUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
        }}
      >
        {/* Timeline */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            style={{ width: '100%' }}
          />
          <div className="flex justify-between" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              {isPlaying ? (
                <PauseIcon style={{ height: '1.5rem', width: '1.5rem' }} />
              ) : (
                <PlayIcon style={{ height: '1.5rem', width: '1.5rem' }} />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <span style={{ fontSize: '0.875rem' }}>Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{ width: '100px' }}
              />
            </div>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center space-x-2">
            <span style={{ fontSize: '0.875rem' }}>Speed:</span>
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => handlePlaybackRateChange(rate)}
                style={{
                  background: playbackRate === rate ? '#2563eb' : 'transparent',
                  border: '1px solid #374151',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recordings;