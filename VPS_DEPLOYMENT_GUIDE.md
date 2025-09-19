# VPS Deployment Guide - Multi-Camera Streaming Platform

## Prerequisites

- Ubuntu 20.04+ / CentOS 8+ / Debian 11+ VPS
- Root or sudo access
- Domain name pointing to your VPS IP
- At least 2GB RAM, 2 CPU cores, 50GB storage

## Quick Deployment

### 1. Run the Deployment Script

```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/your-repo/deploy-vps.sh
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### 2. Upload Your Code

```bash
# Upload your project files to the server
scp -r . getfairplay-api@your-server-ip:/home/getfairplay-api/htdocs/api.getfairplay.org/
```

### 3. Install Dependencies and Build

```bash
# SSH into your server
ssh getfairplay-api@your-server-ip

# Navigate to project directory
cd /home/getfairplay-api/htdocs/api.getfairplay.org

# Install backend dependencies
npm install --production

# Build the backend
npm run build

# Run database migrations
npm run migration:run

# Build and deploy frontend
./build-frontend.sh
```

### 4. Start the Services

```bash
# Start the application
sudo systemctl start camera-streaming.service

# Check status
sudo systemctl status camera-streaming.service

# View logs
pm2 logs camera-streaming-backend
```

### 5. Setup SSL Certificates

```bash
# Run SSL setup script
./setup-ssl.sh
```

## Manual Installation (Alternative)

If you prefer manual installation:

### 1. Install Required Packages

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install packages
sudo apt install -y curl wget git nginx mysql-server redis-server ffmpeg nodejs npm certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### 2. Configure Database

```bash
# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and user
sudo mysql -e "CREATE DATABASE camera;"
sudo mysql -e "CREATE USER 'camerauser'@'localhost' IDENTIFIED BY 'camerapass123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON camera.* TO 'camerauser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 3. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/api.getfairplay.org

# Enable site
sudo ln -s /etc/nginx/sites-available/api.getfairplay.org /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configure Application

```bash
# Create environment file
nano /home/getfairplay-api/htdocs/api.getfairplay.org/.env

# Set permissions
sudo chown -R getfairplay-api:getfairplay-api /home/getfairplay-api
```

## Configuration Files

### Environment Variables (.env)

```env
# Database Configuration
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=camerauser
DB_PASSWORD=camerapass123
DB_NAME=camera
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://getfairplay.org

# RTMP Configuration
RTMP_BASE_URL=rtmp://api.getfairplay.org:1935/live
HLS_BASE_URL=https://api.getfairplay.org/hls

# FFmpeg Configuration
FFMPEG_PATH=/usr/bin/ffmpeg

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Frontend URL
FRONTEND_URL=https://getfairplay.org
```

### PM2 Configuration (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'camera-streaming-backend',
    script: 'dist/main.js',
    cwd: '/home/getfairplay-api/htdocs/api.getfairplay.org',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/getfairplay-api/logs/error.log',
    out_file: '/home/getfairplay-api/logs/out.log',
    log_file: '/home/getfairplay-api/logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

## Service Management

### Start/Stop/Restart Services

```bash
# Start application
sudo systemctl start camera-streaming.service

# Stop application
sudo systemctl stop camera-streaming.service

# Restart application
sudo systemctl restart camera-streaming.service

# Check status
sudo systemctl status camera-streaming.service

# Enable auto-start
sudo systemctl enable camera-streaming.service
```

### View Logs

```bash
# PM2 logs
pm2 logs camera-streaming-backend

# System logs
sudo journalctl -u camera-streaming.service -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Update Application

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

## Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 1935/tcp  # RTMP
sudo ufw enable
```

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3000/api/v1/health

# Nginx health
curl http://localhost/health

# Check services
sudo systemctl status nginx mysql redis-server camera-streaming.service
```

### Performance Monitoring

```bash
# System resources
htop
df -h
free -h

# PM2 monitoring
pm2 monit

# Database status
sudo mysql -e "SHOW PROCESSLIST;"
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   sudo systemctl restart mysql
   sudo mysql -e "SHOW DATABASES;"
   ```

3. **Nginx configuration error**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Permission denied**
   ```bash
   sudo chown -R getfairplay-api:getfairplay-api /home/getfairplay-api
   sudo chown -R www-data:www-data /var/www/html
   ```

### Log Locations

- Application logs: `/home/getfairplay-api/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`
- MySQL logs: `/var/log/mysql/`

## Security Considerations

1. **Change default passwords**
2. **Enable firewall**
3. **Use SSL certificates**
4. **Regular security updates**
5. **Monitor logs for suspicious activity**

## Backup

### Database Backup

```bash
# Create backup
mysqldump -u camerauser -p camera > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u camerauser -p camera < backup_20240101.sql
```

### Application Backup

```bash
# Backup application
tar -czf app_backup_$(date +%Y%m%d).tar.gz /home/getfairplay-api/htdocs/api.getfairplay.org/

# Backup recordings
tar -czf recordings_backup_$(date +%Y%m%d).tar.gz /var/www/html/recordings/
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx as load balancer
2. **Multiple Backend Instances**: Run multiple PM2 instances
3. **Database Replication**: Set up MySQL master-slave replication
4. **CDN**: Use CloudFlare or AWS CloudFront for static content

### Vertical Scaling

1. **Increase RAM**: For more concurrent streams
2. **SSD Storage**: For better I/O performance
3. **More CPU Cores**: For video processing

## Support

For issues and support:
- Check logs first
- Review this guide
- Check system resources
- Verify configuration files