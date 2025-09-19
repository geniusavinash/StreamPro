#!/bin/bash

# Camera Streaming Platform - Production Deployment Script
# This script deploys the application to a VPS with MySQL

set -e

echo "🚀 Deploying Camera Streaming Platform to Production..."

# Configuration
APP_NAME="camera-streaming-platform"
APP_USER="camera-streaming"
APP_DIR="/var/www/camera-streaming"
DB_NAME="camera_streaming_prod"
DB_USER="camera_streaming_prod"
NGINX_RTMP_VERSION="1.24.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons."
   exit 1
fi

print_header "1. System Update and Dependencies"

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
    curl \
    wget \
    git \
    nginx \
    mysql-server \
    redis-server \
    nodejs \
    npm \
    pm2 \
    ufw \
    certbot \
    python3-certbot-nginx \
    build-essential \
    ffmpeg

print_status "System updated and dependencies installed."

print_header "2. Node.js Setup"

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js $node_version and npm $npm_version installed."

print_header "3. MySQL Configuration"

# Secure MySQL installation
print_status "Configuring MySQL..."

# Generate random passwords
DB_ROOT_PASSWORD=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)

# Configure MySQL
sudo mysql << EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_ROOT_PASSWORD';
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "MySQL configured with database: $DB_NAME"

print_header "4. Redis Configuration"

# Configure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Generate Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)

# Configure Redis with password
sudo tee /etc/redis/redis.conf > /dev/null << EOF
bind 127.0.0.1
port 6379
requirepass $REDIS_PASSWORD
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

sudo systemctl restart redis-server
print_status "Redis configured with authentication."

print_header "5. Application User Setup"

# Create application user
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash $APP_USER
    print_status "Created user: $APP_USER"
fi

# Create application directory
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

print_header "6. Application Deployment"

# Clone or copy application files
print_status "Deploying application files..."

# Copy application files (assuming they're in current directory)
sudo cp -r . $APP_DIR/
sudo chown -R $APP_USER:$APP_USER $APP_DIR

# Switch to app user for npm operations
sudo -u $APP_USER bash << EOF
cd $APP_DIR

# Install dependencies
npm ci --production

# Build application
npm run build

# Install PM2 globally for app user
npm install -g pm2
EOF

print_header "7. Environment Configuration"

# Create production environment file
sudo -u $APP_USER tee $APP_DIR/.env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=https://getfairplay.org

# MySQL Database Configuration
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# RTMP Configuration
RTMP_PORT=1935
RTMP_BASE_URL=rtmp://api.getfairplay.org:1935/live
HLS_BASE_URL=https://api.getfairplay.org/hls
HLS_PATH=/var/www/hls
RECORDING_PATH=/var/www/recordings

# Storage Configuration
STORAGE_TYPE=local
STORAGE_PATH=/var/www/storage

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Security
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info

# SSL/TLS
SSL_ENABLED=true
EOF

print_status "Environment configuration created."

print_header "8. Nginx Configuration"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/$APP_NAME << 'EOF'
# Camera Streaming Platform - Nginx Configuration

# Upstream for Node.js application
upstream camera_streaming_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name _;

    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.getfairplay.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.getfairplay.org/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API routes
    location /api/ {
        proxy_pass http://camera_streaming_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://camera_streaming_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # HLS streaming
    location /hls/ {
        alias /var/www/hls/;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods GET;
        
        location ~* \.(m3u8)$ {
            expires -1;
        }
        
        location ~* \.(ts)$ {
            expires 1m;
        }
    }

    # Static files
    location / {
        root /var/www/camera-streaming/frontend/build;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# RTMP server configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        allow publish all;
        allow play all;

        application live {
            live on;
            
            # HLS configuration
            hls on;
            hls_path /var/www/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            hls_continuous on;
            hls_cleanup on;
            hls_nested on;
            
            # Authentication
            on_publish http://127.0.0.1:3000/api/v1/streaming/auth;
            on_publish_done http://127.0.0.1:3000/api/v1/streaming/done;
            
            # Recording
            record all;
            record_path /var/www/recordings;
            record_unique on;
            record_suffix .flv;
            
            # Notifications
            on_record_done http://127.0.0.1:3000/api/v1/streaming/record-done;
        }
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

print_header "9. Directory Setup"

# Create required directories
sudo mkdir -p /var/www/hls /var/www/recordings /var/www/storage
sudo chown -R $APP_USER:$APP_USER /var/www/hls /var/www/recordings /var/www/storage
sudo chmod 755 /var/www/hls /var/www/recordings /var/www/storage

print_header "10. PM2 Process Management"

# Create PM2 ecosystem file
sudo -u $APP_USER tee $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'camera-streaming-backend',
    script: 'dist/main.js',
    cwd: '$APP_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/camera-streaming/error.log',
    out_file: '/var/log/camera-streaming/out.log',
    log_file: '/var/log/camera-streaming/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/camera-streaming
sudo chown $APP_USER:$APP_USER /var/log/camera-streaming

# Start application with PM2
sudo -u $APP_USER bash << EOF
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup
EOF

print_header "11. Firewall Configuration"

# Configure UFW firewall
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1935/tcp  # RTMP
sudo ufw reload

print_status "Firewall configured."

print_header "12. SSL Certificate"

print_warning "SSL certificate setup requires a domain name."
print_warning "Please run: sudo certbot --nginx -d api.getfairplay.org"
print_warning "After obtaining SSL certificate, update the Nginx configuration."

print_header "13. Service Management"

# Enable services
sudo systemctl enable nginx
sudo systemctl enable mysql
sudo systemctl enable redis-server

# Start services
sudo systemctl start nginx
sudo systemctl restart mysql
sudo systemctl restart redis-server

print_header "14. Database Migration"

# Run database migrations
sudo -u $APP_USER bash << EOF
cd $APP_DIR
npm run migration:run
EOF

print_status "Database migrations completed."

# Save credentials to file
sudo tee /root/camera-streaming-credentials.txt << EOF
# Camera Streaming Platform - Production Credentials
# Generated on: $(date)

## Database
MySQL Root Password: $DB_ROOT_PASSWORD
Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASSWORD

## Redis
Redis Password: $REDIS_PASSWORD

## Application
Application Directory: $APP_DIR
Application User: $APP_USER

## Important Commands
# View application logs: sudo -u $APP_USER pm2 logs
# Restart application: sudo -u $APP_USER pm2 restart camera-streaming-backend
# View system status: sudo systemctl status nginx mysql redis-server

## Security Notes
- Change default SSH port
- Set up fail2ban
- Regular security updates
- Monitor logs regularly
EOF

sudo chmod 600 /root/camera-streaming-credentials.txt

echo
echo "🎉 Deployment completed successfully!"
echo
echo "📋 Summary:"
echo "   ✅ System updated and secured"
echo "   ✅ MySQL database configured"
echo "   ✅ Redis cache configured"
echo "   ✅ Application deployed"
echo "   ✅ Nginx configured"
echo "   ✅ PM2 process manager setup"
echo "   ✅ Firewall configured"
echo "   ✅ Services enabled and started"
echo
echo "🔐 Credentials saved to: /root/camera-streaming-credentials.txt"
echo
echo "🌐 Next Steps:"
echo "   1. Point api.getfairplay.org to this server"
echo "   2. Run: sudo certbot --nginx -d api.getfairplay.org"
echo "   3. Update Nginx configuration with your domain"
echo "   4. Test the application: https://api.getfairplay.org"
echo
echo "📊 Application Status:"
sudo -u $APP_USER pm2 status
echo
echo "🔧 Useful Commands:"
echo "   View logs: sudo -u $APP_USER pm2 logs"
echo "   Restart app: sudo -u $APP_USER pm2 restart camera-streaming-backend"
echo "   Check services: sudo systemctl status nginx mysql redis-server"
echo
print_status "Your Camera Streaming Platform is now live! 🚀"