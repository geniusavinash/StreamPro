# Multi-Camera Streaming Platform - VPS Deployment

## 🚀 Quick Start

### 1. Prepare Your VPS
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 2GB RAM, 2 CPU cores, 50GB storage minimum
- Domain name pointing to your VPS IP

### 2. Deploy to VPS

```bash
# Upload code to VPS
./upload-to-vps.sh your-server-ip getfairplay-api

# SSH into your server
ssh getfairplay-api@your-server-ip

# Run deployment script
cd /home/getfairplay-api/htdocs/api.getfairplay.org
./deploy-vps.sh
```

### 3. Setup SSL (Optional)

```bash
# Run SSL setup
./setup-ssl.sh
```

## 📁 Project Structure

```
RTMP_CAMERA_PANEL/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/        # Authentication
│   │   │   ├── cameras/     # Camera Management
│   │   │   ├── streaming/   # RTMP Streaming
│   │   │   ├── dashboard/   # Dashboard API
│   │   │   └── ...
│   │   └── database/        # Database entities
│   ├── package.json
│   └── ecosystem.config.js  # PM2 configuration
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # UI components
│   │   └── services/       # API services
│   └── package.json
├── nginx/                   # Nginx configuration
│   └── nginx.conf
├── deploy-vps.sh           # VPS deployment script
├── upload-to-vps.sh        # Code upload script
├── production.env          # Production environment
└── VPS_DEPLOYMENT_GUIDE.md # Detailed guide
```

## 🔧 Configuration

### Environment Variables

Copy `production.env` to `.env` on your VPS:

```env
# Database
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_USERNAME=camerauser
DB_PASSWORD=camerapass123
DB_NAME=camera

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key

# Domains
CORS_ORIGIN=https://getfairplay.org
RTMP_BASE_URL=rtmp://api.getfairplay.org:1935/live
HLS_BASE_URL=https://api.getfairplay.org/hls
```

### Nginx Configuration

The deployment script automatically configures:
- RTMP server on port 1935
- HLS streaming on port 8080
- API proxy to port 3000
- Static file serving

## 🌐 Access Points

After deployment:
- **Frontend**: `https://getfairplay.org`
- **API**: `https://api.getfairplay.org/api/v1`
- **RTMP**: `rtmp://api.getfairplay.org:1935/live`
- **HLS**: `https://api.getfairplay.org/hls`
- **Swagger**: `https://api.getfairplay.org/api`

## 📊 Services

### Backend Service (PM2)
```bash
# Start
sudo systemctl start camera-streaming.service

# Stop
sudo systemctl stop camera-streaming.service

# Restart
sudo systemctl restart camera-streaming.service

# Status
sudo systemctl status camera-streaming.service

# Logs
pm2 logs camera-streaming-backend
```

### Database (MySQL)
```bash
# Start
sudo systemctl start mysql

# Status
sudo systemctl status mysql

# Connect
mysql -u camerauser -p camera
```

### Cache (Redis)
```bash
# Start
sudo systemctl start redis-server

# Status
sudo systemctl status redis-server

# Connect
redis-cli
```

### Web Server (Nginx)
```bash
# Start
sudo systemctl start nginx

# Restart
sudo systemctl restart nginx

# Test config
sudo nginx -t

# Logs
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Updates

### Deploy Updates
```bash
# Run deployment script
./deploy.sh

# Or manually:
git pull origin main
npm install --production
npm run build
npm run migration:run
./build-frontend.sh
sudo systemctl restart camera-streaming.service
```

### Backup
```bash
# Database backup
mysqldump -u camerauser -p camera > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /home/getfairplay-api/htdocs/api.getfairplay.org/
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port 3000 in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   sudo systemctl restart mysql
   sudo mysql -e "SHOW DATABASES;"
   ```

3. **Permission denied**
   ```bash
   sudo chown -R getfairplay-api:getfairplay-api /home/getfairplay-api
   sudo chown -R www-data:www-data /var/www/html
   ```

4. **Nginx error**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Log Locations

- **Application**: `/home/getfairplay-api/logs/`
- **Nginx**: `/var/log/nginx/`
- **System**: `/var/log/syslog`
- **MySQL**: `/var/log/mysql/`

## 📈 Monitoring

### Health Checks
```bash
# API health
curl http://localhost:3000/api/v1/health

# Nginx health
curl http://localhost/health

# All services
sudo systemctl status nginx mysql redis-server camera-streaming.service
```

### Performance
```bash
# System resources
htop
df -h
free -h

# PM2 monitoring
pm2 monit

# Database processes
sudo mysql -e "SHOW PROCESSLIST;"
```

## 🔒 Security

### Firewall
```bash
# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 1935/tcp  # RTMP
sudo ufw enable
```

### SSL Certificates
```bash
# Setup SSL
./setup-ssl.sh

# Renew certificates
sudo certbot renew
```

## 📞 Support

For issues:
1. Check logs first
2. Review this README
3. Check system resources
4. Verify configuration files

## 🎯 Features

### ✅ Implemented
- User authentication and authorization
- Camera management (CRUD operations)
- Real-time dashboard with statistics
- RTMP streaming with HLS output
- Video recording with file management
- API token management
- WebSocket integration (pending)
- Multi-bitrate streaming
- Security and audit logging

### 🔄 In Progress
- WebSocket real-time updates
- Advanced analytics
- Cloud storage integration

### 📋 Future
- Mobile app
- Advanced monitoring
- CDN integration
- Multi-region deployment
