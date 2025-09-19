# Quick Start Guide

Get the Camera Streaming Platform up and running in just 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM and 20GB disk space
- Network access for camera connections

## 1. Clone and Start

```bash
# Clone the repository
git clone https://github.com/camera-streaming/platform.git
cd platform

# Start the platform
cd backend
docker-compose up -d

# Wait for services to start (about 2 minutes)
docker-compose logs -f
```

## 2. Access the Platform

Once all services are running:

- **Frontend Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Monitoring (Grafana)**: http://localhost:3001
- **Metrics (Prometheus)**: http://localhost:9090

## 3. Initial Login

Use the default admin credentials:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default password immediately after first login!

## 4. Add Your First Camera

### Option A: Using the Web Interface

1. Navigate to http://localhost:3000
2. Login with admin credentials
3. Go to "Cameras" → "Add Camera"
4. Fill in camera details:
   - **Name**: "My First Camera"
   - **Company**: Your camera manufacturer
   - **Model**: Camera model
   - **Serial Number**: Unique identifier
   - **Location**: Where the camera is located
   - **Placement**: Specific placement details

### Option B: Using the API

```bash
curl -X POST http://localhost:3000/api/cameras \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My First Camera",
    "company": "Hikvision",
    "model": "DS-2CD2043G0-I",
    "serialNumber": "HK001234567890",
    "location": "Front Entrance",
    "place": "Mounted on wall, facing parking lot",
    "isRecording": true
  }'
```

## 5. Configure Camera Streaming

After adding a camera, you'll get an RTMP URL like:
```
rtmp://localhost:1935/live/camera_UNIQUE_ID
```

Configure your camera to stream to this URL:

### For IP Cameras:
1. Access your camera's web interface
2. Go to Network → Streaming settings
3. Set RTMP URL to the provided URL
4. Set video quality (recommended: 1080p, 30fps)
5. Enable streaming

### For Software (OBS, FFmpeg):
```bash
# Using FFmpeg to stream a test video
ffmpeg -re -i test_video.mp4 -c:v libx264 -c:a aac -f flv rtmp://localhost:1935/live/camera_UNIQUE_ID
```

## 6. View Live Stream

Once your camera starts streaming:

1. Go to the Dashboard
2. You'll see your camera status change to "Online"
3. Click on the camera to view the live stream
4. The stream will be available in multiple formats:
   - **HLS**: For web browsers
   - **WebRTC**: For ultra-low latency
   - **RTMP**: For direct access

## 7. Enable Recording

Recording is enabled by default, but you can manage it:

### Via Web Interface:
1. Go to "Cameras" page
2. Click the recording toggle for your camera
3. Recordings will be saved automatically

### Via API:
```bash
curl -X POST http://localhost:3000/api/cameras/CAMERA_ID/toggle-recording \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 8. View Recordings

### Via Web Interface:
1. Go to "Recordings" page
2. Filter by camera, date range, etc.
3. Click play to view recordings
4. Download recordings if needed

### Via API:
```bash
# Get recordings
curl http://localhost:3000/api/recordings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get download URL
curl http://localhost:3000/api/recordings/RECORDING_ID/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 9. Monitor System Health

### Dashboard Metrics:
- Navigate to the main dashboard
- View real-time statistics:
  - Online/offline cameras
  - Active streams
  - Storage usage
  - System health

### Grafana Monitoring:
1. Go to http://localhost:3001
2. Login with `admin` / `admin`
3. View pre-configured dashboards:
   - Camera Streaming Overview
   - System Performance
   - Network Statistics

## 10. Create API Tokens

For programmatic access:

### Via Web Interface:
1. Go to "Settings" → "API Tokens"
2. Click "Create Token"
3. Set permissions and expiration
4. Copy the generated API key

### Via API:
```bash
curl -X POST http://localhost:3000/api/auth/api-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My API Token",
    "permissions": ["camera:read", "camera:write", "stream:view"],
    "expiresIn": "30d",
    "rateLimit": 1000
  }'
```

## Next Steps

Now that you have the platform running:

### For Developers:
- [Explore the API Documentation](../api/rest-api.md)
- [Try the SDKs](../sdks/javascript.md)
- [Build custom integrations](../advanced/integrations.md)

### For System Administrators:
- [Set up production deployment](../deployment/production.md)
- [Configure monitoring and alerts](../admin/monitoring.md)
- [Implement security best practices](../features/security.md)

### For End Users:
- [Learn about camera management](../features/camera-management.md)
- [Explore recording features](../features/recording.md)
- [Set up user accounts](../features/user-management.md)

## Troubleshooting

### Common Issues:

**Services won't start:**
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Check system resources
docker system df
```

**Camera won't connect:**
- Verify RTMP URL is correct
- Check network connectivity
- Ensure camera supports RTMP streaming
- Check firewall settings (port 1935)

**Can't access web interface:**
- Verify port 3000 is not blocked
- Check if services are running: `docker-compose ps`
- Try accessing via IP address instead of localhost

**Recording not working:**
- Check storage space: `df -h`
- Verify recording is enabled for the camera
- Check logs: `docker-compose logs backend`

### Getting Help:

- [Common Issues Guide](../troubleshooting/common-issues.md)
- [Debugging Guide](../troubleshooting/debugging.md)
- [Community Support](https://github.com/camera-streaming/platform/discussions)
- [Enterprise Support](mailto:support@camera-streaming.example.com)

## Performance Tips

### For Better Performance:
1. **Allocate more resources**:
   ```bash
   # Edit docker-compose.yml to increase memory limits
   mem_limit: 2g  # Increase from default
   ```

2. **Use SSD storage** for better recording performance

3. **Configure camera settings**:
   - Use H.264 encoding
   - Set appropriate bitrate (2-8 Mbps for 1080p)
   - Enable constant bitrate (CBR)

4. **Network optimization**:
   - Use wired connections for cameras
   - Ensure sufficient bandwidth
   - Configure QoS if needed

### Scaling Up:
- [Kubernetes Deployment](../deployment/kubernetes.md) for container orchestration
- [Load Balancing](../advanced/scaling.md) for high availability
- [Multi-region Setup](../advanced/multi-tenant.md) for global deployment

---

**Congratulations!** 🎉 You now have a fully functional camera streaming platform. Start adding more cameras and exploring the advanced features!