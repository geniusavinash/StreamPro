const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Camera Streaming Platform API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Multi-Camera Streaming Platform API',
    version: '1.0.0',
    status: 'running'
  });
});

// Auth routes
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      accessToken: 'mock-jwt-token-12345',
      refreshToken: 'mock-refresh-token-12345',
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@streampro.com',
        role: 'admin',
        isActive: true
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Camera routes
app.get('/api/v1/cameras', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Front Door',
      location: 'Main Entrance',
      place: 'Building A',
      rtmpUrl: 'rtmp://localhost:1935/live/camera1',
      isActive: true,
      isRecording: true,
      streamStatus: 'online',
      status: 'online',
      viewers: 12,
      resolution: '1080p',
      fps: 30,
      company: 'Hikvision',
      model: 'DS-2CD2085FWD-I',
      serialNumber: 'HK001234567',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z'
    },
    {
      id: '2',
      name: 'Parking Lot',
      location: 'Parking Area',
      place: 'Building B',
      rtmpUrl: 'rtmp://localhost:1935/live/camera2',
      isActive: true,
      isRecording: false,
      streamStatus: 'online',
      status: 'online',
      viewers: 5,
      resolution: '720p',
      fps: 25,
      company: 'Dahua',
      model: 'DH-IPC-HFW4431R-Z',
      serialNumber: 'DH001234567',
      createdAt: '2024-01-16T09:15:00Z',
      updatedAt: '2024-01-20T16:30:00Z'
    }
  ]);
});

app.get('/api/v1/cameras/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id: id,
    name: 'Front Door',
    location: 'Main Entrance',
    place: 'Building A',
    rtmpUrl: 'rtmp://localhost:1935/live/camera1',
    isActive: true,
    isRecording: true,
    streamStatus: 'online',
    status: 'online',
    viewers: 12,
    resolution: '1080p',
    fps: 30,
    company: 'Hikvision',
    model: 'DS-2CD2085FWD-I',
    serialNumber: 'HK001234567',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z'
  });
});

// Dashboard routes
app.get('/api/v1/dashboard/stats', (req, res) => {
  res.json({
    totalCameras: 2,
    activeCameras: 2,
    totalViewers: 17,
    totalRecordings: 1,
    storageUsed: '2.5 GB',
    uptime: '99.9%',
    lastUpdate: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Camera Streaming API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📱 API docs: http://localhost:${PORT}/api/v1`);
});
