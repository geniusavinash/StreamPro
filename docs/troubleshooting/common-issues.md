# Common Issues and Solutions

This guide covers the most frequently encountered issues and their solutions when using the Camera Streaming Platform.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Camera Connection Problems](#camera-connection-problems)
- [Streaming Issues](#streaming-issues)
- [Recording Problems](#recording-problems)
- [Performance Issues](#performance-issues)
- [Authentication Problems](#authentication-problems)
- [Database Issues](#database-issues)
- [Network Problems](#network-problems)
- [Storage Issues](#storage-issues)
- [Monitoring and Alerts](#monitoring-and-alerts)

## Installation Issues

### Docker Services Won't Start

**Symptoms:**
- Services fail to start with `docker-compose up`
- Error messages about port conflicts
- Services exit immediately after starting

**Solutions:**

1. **Check port conflicts:**
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :1935
sudo netstat -tulpn | grep :5432

# Kill conflicting processes
sudo kill -9 <PID>
```

2. **Check Docker daemon:**
```bash
# Restart Docker daemon
sudo systemctl restart docker

# Check Docker status
sudo systemctl status docker
```

3. **Check system resources:**
```bash
# Check available memory
free -h

# Check disk space
df -h

# Clean up Docker
docker system prune -a
```

4. **Review logs:**
```bash
# Check service logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis
```

### Database Migration Fails

**Symptoms:**
- Migration errors during startup
- Database connection refused
- Schema version conflicts

**Solutions:**

1. **Reset database:**
```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm backend_postgres_data

# Restart services
docker-compose up -d

# Wait for database to initialize
sleep 30

# Run migrations
docker-compose exec backend npm run migration:run
```

2. **Manual migration:**
```bash
# Connect to database
docker-compose exec postgres psql -U camera_user -d camera_streaming

# Check current schema version
SELECT * FROM migrations;

# Drop and recreate database
DROP DATABASE camera_streaming;
CREATE DATABASE camera_streaming OWNER camera_user;
```

### Permission Denied Errors

**Symptoms:**
- Docker permission denied
- File system permission errors
- Cannot write to volumes

**Solutions:**

1. **Fix Docker permissions:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker
```

2. **Fix file permissions:**
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./backend
sudo chmod -R 755 ./backend

# Fix specific directories
sudo mkdir -p /var/recordings /var/hls
sudo chown -R 1000:1000 /var/recordings /var/hls
```

## Camera Connection Problems

### Camera Won't Connect to RTMP

**Symptoms:**
- Camera shows as "offline" in dashboard
- RTMP stream not receiving data
- Connection timeout errors

**Solutions:**

1. **Verify RTMP URL:**
```bash
# Check the generated RTMP URL format
# Should be: rtmp://your-server:1935/live/camera_unique_id

# Test RTMP server
telnet your-server 1935
```

2. **Check camera configuration:**
- Verify RTMP URL is correctly entered in camera settings
- Ensure camera supports RTMP streaming
- Check video codec settings (H.264 recommended)
- Verify audio codec settings (AAC recommended)

3. **Network connectivity:**
```bash
# Test from camera network to server
ping your-server

# Check firewall rules
sudo ufw status
sudo iptables -L

# Test RTMP port
nc -zv your-server 1935
```

4. **Camera-specific settings:**

**Hikvision cameras:**
- Go to Configuration → Network → Advanced Settings → RTMP
- Enable RTMP
- Set URL: `rtmp://your-server:1935/live/camera_id`
- Set video bitrate to 2-8 Mbps
- Enable constant bitrate (CBR)

**Dahua cameras:**
- Go to Setup → Network → RTMP
- Enable RTMP service
- Set server address and stream key
- Configure video parameters

**Generic IP cameras:**
- Look for "Streaming" or "Network" settings
- Find RTMP or "Push Stream" options
- Configure server URL and stream key

### Camera Connects But No Video

**Symptoms:**
- Camera shows as "online" but no video stream
- Audio works but no video
- Black screen in player

**Solutions:**

1. **Check video codec:**
```bash
# Check RTMP stream info
ffprobe rtmp://your-server:1935/live/camera_id

# Expected output should show H.264 video stream
```

2. **Verify camera settings:**
- Set video codec to H.264
- Set resolution to 1920x1080 or lower
- Set frame rate to 30fps or lower
- Disable any proprietary codecs

3. **Test with FFmpeg:**
```bash
# Test streaming to your server
ffmpeg -re -i test_video.mp4 -c:v libx264 -c:a aac -f flv rtmp://your-server:1935/live/test_camera

# Check if test stream works in dashboard
```

### Intermittent Connection Drops

**Symptoms:**
- Camera connects and disconnects repeatedly
- Stream quality degrades over time
- Timeout errors in logs

**Solutions:**

1. **Network stability:**
```bash
# Test network stability
ping -c 100 your-server

# Check for packet loss
mtr your-server
```

2. **Increase timeout values:**
```bash
# Edit nginx RTMP configuration
# Add to rtmp block:
timeout 60s;
ping 30s;
ping_timeout 10s;
```

3. **Camera power and cooling:**
- Check camera power supply stability
- Ensure adequate cooling/ventilation
- Check for overheating issues

## Streaming Issues

### HLS Stream Not Playing

**Symptoms:**
- HLS URL returns 404 error
- Video player shows loading indefinitely
- Segments not being generated

**Solutions:**

1. **Check HLS directory:**
```bash
# Verify HLS files are being created
ls -la /var/hls/

# Check permissions
sudo chown -R www-data:www-data /var/hls
sudo chmod -R 755 /var/hls
```

2. **Verify nginx configuration:**
```bash
# Check nginx RTMP configuration
nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx logs
tail -f /var/log/nginx/error.log
```

3. **Test HLS generation:**
```bash
# Stream test video and check HLS output
ffmpeg -re -i test_video.mp4 -c:v libx264 -c:a aac -f flv rtmp://localhost:1935/live/test

# Check if HLS files are created
ls -la /var/hls/test/
```

### WebRTC Connection Fails

**Symptoms:**
- WebRTC offer/answer exchange fails
- ICE connection timeout
- No video in WebRTC player

**Solutions:**

1. **Check STUN/TURN configuration:**
```javascript
// Verify ICE servers configuration
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { 
    urls: 'turn:your-turn-server:3478',
    username: 'username',
    credential: 'password'
  }
];
```

2. **Firewall configuration:**
```bash
# Allow WebRTC ports (UDP)
sudo ufw allow 10000:20000/udp

# For TURN server
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
```

3. **Network troubleshooting:**
- Test from different networks
- Check NAT/firewall settings
- Verify TURN server accessibility

### Poor Stream Quality

**Symptoms:**
- Pixelated or blurry video
- Audio/video sync issues
- Frequent buffering

**Solutions:**

1. **Optimize camera settings:**
- Increase bitrate (2-8 Mbps for 1080p)
- Use constant bitrate (CBR)
- Set appropriate keyframe interval (2-4 seconds)
- Optimize for network conditions

2. **Server optimization:**
```bash
# Increase nginx worker processes
worker_processes auto;

# Optimize buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
```

3. **Network optimization:**
- Use wired connections when possible
- Implement QoS for video traffic
- Monitor bandwidth utilization

## Recording Problems

### Recordings Not Saving

**Symptoms:**
- Recording toggle shows enabled but no files created
- Recording directory is empty
- Database shows recordings but files missing

**Solutions:**

1. **Check storage permissions:**
```bash
# Verify recording directory exists and is writable
ls -la /var/recordings/
sudo chown -R www-data:www-data /var/recordings
sudo chmod -R 755 /var/recordings
```

2. **Check disk space:**
```bash
# Check available disk space
df -h /var/recordings

# Clean old recordings if needed
find /var/recordings -name "*.flv" -mtime +30 -delete
```

3. **Verify nginx RTMP recording configuration:**
```nginx
application live {
    live on;
    
    # Recording configuration
    record all;
    record_path /var/recordings;
    record_unique on;
    record_suffix .flv;
    record_max_size 1000M;
    record_max_frames 2;
}
```

### Recording Files Corrupted

**Symptoms:**
- Recording files cannot be played
- Incomplete or truncated recordings
- Error messages when accessing recordings

**Solutions:**

1. **Check recording process:**
```bash
# Monitor recording process
tail -f /var/log/nginx/error.log

# Check for disk I/O errors
dmesg | grep -i error
```

2. **Verify file integrity:**
```bash
# Check file format
ffprobe /var/recordings/camera_123_20231201_120000.flv

# Repair corrupted files
ffmpeg -i corrupted_file.flv -c copy repaired_file.mp4
```

3. **Improve recording reliability:**
```nginx
# Add to nginx RTMP configuration
record_lock on;
record_notify on;
```

### Recording Playback Issues

**Symptoms:**
- Recordings won't play in browser
- Download links return errors
- Playback stops unexpectedly

**Solutions:**

1. **Check file format compatibility:**
```bash
# Convert FLV to MP4 for better compatibility
ffmpeg -i recording.flv -c:v libx264 -c:a aac recording.mp4
```

2. **Verify download URLs:**
```bash
# Test download URL
curl -I "https://your-server/api/recordings/recording_id/download"

# Check signed URL expiration
```

3. **Browser compatibility:**
- Use MP4 format for better browser support
- Ensure proper MIME types are set
- Test with different browsers

## Performance Issues

### High CPU Usage

**Symptoms:**
- Server CPU usage consistently above 80%
- Slow response times
- Stream quality degradation

**Solutions:**

1. **Identify CPU bottlenecks:**
```bash
# Monitor CPU usage by process
top -p $(pgrep -d',' -f camera-streaming)

# Check nginx processes
top -p $(pgrep -d',' nginx)
```

2. **Optimize video encoding:**
```bash
# Use hardware acceleration if available
ffmpeg -hwaccels

# Configure nginx for hardware encoding
# Add to nginx RTMP configuration:
exec ffmpeg -i rtmp://localhost/live/$name -c:v h264_nvenc -preset fast -f flv rtmp://localhost/hls/$name;
```

3. **Scale horizontally:**
- Add more application servers
- Distribute RTMP load across multiple servers
- Use load balancing

### High Memory Usage

**Symptoms:**
- Memory usage continuously increasing
- Out of memory errors
- System becomes unresponsive

**Solutions:**

1. **Monitor memory usage:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Monitor for memory leaks
valgrind --tool=memcheck --leak-check=full node dist/main.js
```

2. **Optimize application:**
```javascript
// Increase Node.js memory limit
node --max-old-space-size=4096 dist/main.js

// Configure garbage collection
node --expose-gc --optimize-for-size dist/main.js
```

3. **Database optimization:**
```sql
-- Optimize PostgreSQL memory settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

### Slow Database Queries

**Symptoms:**
- API responses are slow
- Database connection timeouts
- High database CPU usage

**Solutions:**

1. **Identify slow queries:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

2. **Add missing indexes:**
```sql
-- Common indexes for performance
CREATE INDEX CONCURRENTLY idx_cameras_active ON cameras(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_recordings_camera_date ON recordings(camera_id, created_at);
CREATE INDEX CONCURRENTLY idx_audit_logs_user_date ON audit_logs(user_id, created_at);
```

3. **Optimize queries:**
```sql
-- Use EXPLAIN ANALYZE to understand query plans
EXPLAIN ANALYZE SELECT * FROM cameras WHERE is_active = true;

-- Consider query rewriting or caching
```

## Authentication Problems

### JWT Token Expired

**Symptoms:**
- 401 Unauthorized errors
- Automatic logout from dashboard
- API calls failing with authentication errors

**Solutions:**

1. **Implement token refresh:**
```javascript
// Automatic token refresh
if (error.response.status === 401) {
  try {
    await refreshToken();
    // Retry original request
    return api.request(originalRequest);
  } catch (refreshError) {
    // Redirect to login
    window.location.href = '/login';
  }
}
```

2. **Adjust token expiration:**
```bash
# Increase token lifetime in environment
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### API Key Not Working

**Symptoms:**
- API key authentication fails
- 403 Forbidden errors
- Rate limiting issues

**Solutions:**

1. **Verify API key format:**
```bash
# API key should start with 'cs_'
# Example: cs_1234567890abcdef1234567890abcdef

# Check API key in database
SELECT * FROM api_tokens WHERE key_hash = encode(digest('your_api_key', 'sha256'), 'hex');
```

2. **Check permissions:**
```bash
# Verify API token has required permissions
curl -H "X-API-Key: your_api_key" \
  https://your-server/api/auth/api-tokens
```

3. **IP whitelist issues:**
```bash
# Check if IP is whitelisted
# Add current IP to whitelist
curl -X PUT https://your-server/api/auth/api-tokens/token_id \
  -H "Authorization: Bearer jwt_token" \
  -d '{"ipWhitelist": ["192.168.1.100", "current.ip.address"]}'
```

## Database Issues

### Connection Pool Exhausted

**Symptoms:**
- "Connection pool exhausted" errors
- Database connection timeouts
- Application becomes unresponsive

**Solutions:**

1. **Increase connection pool size:**
```javascript
// In database configuration
{
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  extra: {
    max: 20, // Increase max connections
    min: 5,  // Minimum connections
    acquire: 30000, // Connection timeout
    idle: 10000     // Idle timeout
  }
}
```

2. **Optimize PostgreSQL settings:**
```sql
-- Increase max connections
ALTER SYSTEM SET max_connections = 200;

-- Optimize connection handling
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

### Database Locks

**Symptoms:**
- Queries hanging indefinitely
- Deadlock errors in logs
- Application timeouts

**Solutions:**

1. **Identify blocking queries:**
```sql
-- Find blocking queries
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

2. **Kill blocking queries:**
```sql
-- Terminate blocking query
SELECT pg_terminate_backend(blocking_pid);
```

## Network Problems

### High Latency

**Symptoms:**
- Slow API responses
- Video streaming delays
- Connection timeouts

**Solutions:**

1. **Network diagnostics:**
```bash
# Test latency
ping -c 10 your-server

# Trace route
traceroute your-server

# Test bandwidth
iperf3 -c your-server
```

2. **Optimize network settings:**
```bash
# Increase network buffers
echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
sysctl -p
```

### Packet Loss

**Symptoms:**
- Intermittent connection issues
- Video quality degradation
- Stream interruptions

**Solutions:**

1. **Monitor packet loss:**
```bash
# Long-term ping test
ping -c 1000 your-server | grep 'packet loss'

# Network monitoring
mtr --report --report-cycles 100 your-server
```

2. **QoS configuration:**
```bash
# Prioritize video traffic
tc qdisc add dev eth0 root handle 1: htb default 30
tc class add dev eth0 parent 1: classid 1:1 htb rate 100mbit
tc class add dev eth0 parent 1:1 classid 1:10 htb rate 80mbit ceil 100mbit
tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 1935 0xffff flowid 1:10
```

## Storage Issues

### Disk Space Full

**Symptoms:**
- Recording failures
- Application errors
- Database write failures

**Solutions:**

1. **Check disk usage:**
```bash
# Check overall disk usage
df -h

# Find large files
du -sh /var/recordings/* | sort -rh | head -10

# Check inode usage
df -i
```

2. **Clean up old recordings:**
```bash
# Delete recordings older than 30 days
find /var/recordings -name "*.flv" -mtime +30 -delete

# Compress old recordings
find /var/recordings -name "*.flv" -mtime +7 -exec gzip {} \;
```

3. **Implement automatic cleanup:**
```bash
# Add to crontab
0 2 * * * find /var/recordings -name "*.flv" -mtime +30 -delete
0 3 * * * find /var/recordings -name "*.flv" -mtime +7 -exec gzip {} \;
```

### Storage Performance Issues

**Symptoms:**
- Slow recording writes
- High I/O wait times
- Recording corruption

**Solutions:**

1. **Monitor I/O performance:**
```bash
# Check I/O statistics
iostat -x 1

# Monitor disk usage
iotop
```

2. **Optimize storage:**
```bash
# Use faster storage (SSD/NVMe)
# Optimize filesystem
mount -o remount,noatime /var/recordings

# Use RAID for redundancy and performance
```

## Monitoring and Alerts

### Metrics Not Collecting

**Symptoms:**
- Grafana dashboards show no data
- Prometheus targets down
- Missing metrics endpoints

**Solutions:**

1. **Check Prometheus configuration:**
```yaml
# Verify scrape configs in prometheus.yml
scrape_configs:
  - job_name: 'camera-streaming'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

2. **Test metrics endpoint:**
```bash
# Test metrics endpoint
curl http://localhost:3000/metrics

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets
```

### Alerts Not Firing

**Symptoms:**
- No alert notifications
- Alertmanager shows no alerts
- Email/SMS notifications not working

**Solutions:**

1. **Check alerting rules:**
```yaml
# Verify alerting rules
groups:
  - name: camera-streaming
    rules:
      - alert: CameraOffline
        expr: camera_status == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Camera {{ $labels.camera_id }} is offline"
```

2. **Test notification channels:**
```bash
# Test email notifications
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    }
  }]'
```

---

## Getting Additional Help

If you're still experiencing issues after trying these solutions:

### Community Support
- [GitHub Issues](https://github.com/camera-streaming/platform/issues) - Report bugs and request features
- [Discussions](https://github.com/camera-streaming/platform/discussions) - Ask questions and share solutions
- [Stack Overflow](https://stackoverflow.com/questions/tagged/camera-streaming-platform) - Technical Q&A

### Enterprise Support
- **Email**: support@camera-streaming.example.com
- **Phone**: +1-800-CAMERAS (24/7 for enterprise customers)
- **Documentation**: [Advanced Troubleshooting Guide](./debugging.md)

### Diagnostic Information to Include

When reporting issues, please include:

1. **System Information:**
```bash
# System details
uname -a
docker --version
docker-compose --version

# Resource usage
free -h
df -h
```

2. **Application Logs:**
```bash
# Application logs
docker-compose logs backend --tail=100

# System logs
journalctl -u camera-streaming --since "1 hour ago"
```

3. **Configuration:**
- Environment variables (sanitized)
- Docker compose configuration
- Network topology
- Camera specifications

4. **Steps to Reproduce:**
- Detailed steps that led to the issue
- Expected vs actual behavior
- Screenshots or video if applicable

---

**Related Documentation:**
- [Debugging Guide](./debugging.md) - Advanced debugging techniques
- [Performance Troubleshooting](./performance.md) - Performance optimization
- [Log Analysis](./logs.md) - Understanding log files
- [Network Troubleshooting](./network.md) - Network-specific issues