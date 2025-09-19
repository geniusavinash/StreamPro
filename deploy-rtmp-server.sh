#!/bin/bash

# RTMP Camera Streaming Platform - Server Deployment Script
# This script deploys the complete RTMP streaming system to a production server

set -e

# Configuration
APP_NAME="camera-streaming-platform"
APP_USER="camera-streaming"
APP_DIR="/var/www/$APP_NAME"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$APP_NAME"
RTMP_PORT="1935"
HTTP_PORT="80"
HTTPS_PORT="443"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_header "RTMP Camera Streaming Platform - Server Deployment"

# Update system
print_header "1. System Update"
apt update && apt upgrade -y
print_success "System updated"

# Install required packages
print_header "2. Installing Required Packages"
apt install -y nginx nginx-module-rtmp ffmpeg nodejs npm pm2 mysql-server git curl wget unzip

# Install Node.js 18.x if not already installed
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    print_warning "Installing Node.js 18.x"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

print_success "Required packages installed"

# Create application user
print_header "3. Creating Application User"
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG www-data "$APP_USER"
    print_success "User $APP_USER created"
else
    print_warning "User $APP_USER already exists"
fi

# Create application directory
print_header "4. Setting Up Application Directory"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Clone or copy application files
if [ -d ".git" ]; then
    print_warning "Copying application files from current directory"
    cp -r . "$APP_DIR/"
else
    print_warning "Please ensure application files are in $APP_DIR"
fi

# Set up backend
print_header "5. Setting Up Backend"
cd "$APP_DIR/backend"

# Install dependencies
sudo -u "$APP_USER" npm install --production
print_success "Backend dependencies installed"

# Build backend
sudo -u "$APP_USER" npm run build
print_success "Backend built successfully"

# Set up frontend
print_header "6. Setting Up Frontend"
cd "$APP_DIR/frontend"

# Install dependencies
sudo -u "$APP_USER" npm install --production
print_success "Frontend dependencies installed"

# Build frontend
sudo -u "$APP_USER" npm run build
print_success "Frontend built successfully"

# Configure MySQL
print_header "7. Configuring MySQL"
mysql -e "CREATE DATABASE IF NOT EXISTS camera_streaming;"
mysql -e "CREATE USER IF NOT EXISTS 'camera_user'@'localhost' IDENTIFIED BY 'camera_password_2024';"
mysql -e "GRANT ALL PRIVILEGES ON camera_streaming.* TO 'camera_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
print_success "MySQL configured"

# Create environment file
print_header "8. Creating Environment Configuration"
cat > "$APP_DIR/backend/.env" << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=camera_user
DB_PASSWORD=camera_password_2024
DB_NAME=camera_streaming

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# RTMP Configuration
RTMP_HOST=api.getfairplay.org
RTMP_PORT=1935

# CORS Configuration
CORS_ORIGIN=https://getfairplay.org

# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_PATH=/var/www/uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/camera-streaming.log
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/backend/.env"
print_success "Environment configuration created"

# Configure Nginx with RTMP
print_header "9. Configuring Nginx with RTMP Module"
cat > "$NGINX_CONF" << 'EOF'
# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        max_streams 1000;
        
        application live {
            live on;
            
            # Authentication callbacks
            on_publish http://127.0.0.1:3000/api/v1/streaming/auth/publish;
            on_play http://127.0.0.1:3000/api/v1/streaming/auth/play;
            
            # Stream event notifications
            on_publish_done http://127.0.0.1:3000/api/v1/streaming/events/publish_done;
            on_play_done http://127.0.0.1:3000/api/v1/streaming/events/play_done;
            on_record_done http://127.0.0.1:3000/api/v1/streaming/events/record_done;
            
            # Connection events
            on_connect http://127.0.0.1:3000/api/v1/streaming/events/connect;
            on_disconnect http://127.0.0.1:3000/api/v1/streaming/events/disconnect;
            
            # HLS configuration
            hls on;
            hls_path /var/www/hls;
            hls_fragment 6;
            hls_playlist_length 30;
            hls_continuous on;
            hls_cleanup on;
            hls_nested on;
            hls_fragment_naming system;
            
            # Multiple HLS variants for adaptive bitrate
            hls_variant _low BANDWIDTH=400000 RESOLUTION=640x360;
            hls_variant _mid BANDWIDTH=800000 RESOLUTION=1280x720;
            hls_variant _high BANDWIDTH=1500000 RESOLUTION=1920x1080;
            
            # DASH configuration
            dash on;
            dash_path /var/www/dash;
            dash_fragment 6;
            dash_playlist_length 30;
            dash_cleanup on;
            dash_nested on;
            
            # Recording configuration
            record all;
            record_path /var/www/recordings;
            record_unique on;
            record_suffix .mp4;
            record_append on;
            record_max_size 1000M;
            record_max_frames 2;
            record_interval 1h;
            
            # Stream quality control
            drop_idle_publisher 10s;
            sync 10ms;
            
            # Allow publishing and playing
            allow publish all;
            allow play all;
        }
    }
}

# HTTP Configuration
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name api.getfairplay.org getfairplay.org;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "strict-origin-when-cross-origin";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
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

        # DASH streaming
        location /dash/ {
            alias /var/www/dash/;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods GET;
            
            location ~* \.(mpd)$ {
                expires -1;
            }
            
            location ~* \.(m4s)$ {
                expires 1m;
            }
        }

        # Static files
        location / {
            root /var/www/camera-streaming-platform/frontend/build;
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
}
EOF

# Enable site
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
print_success "Nginx configuration created and tested"

# Create required directories
print_header "10. Creating Required Directories"
mkdir -p /var/www/hls /var/www/dash /var/www/recordings /var/www/uploads
chown -R "$APP_USER:$APP_USER" /var/www/hls /var/www/dash /var/www/recordings /var/www/uploads
chmod -R 755 /var/www/hls /var/www/dash /var/www/recordings /var/www/uploads
print_success "Required directories created"

# Set up PM2
print_header "11. Setting Up PM2"
sudo -u "$APP_USER" npm install -g pm2

# Create PM2 ecosystem file
cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'camera-streaming-backend',
    script: './dist/main.js',
    cwd: '/var/www/camera-streaming-platform/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/camera-streaming-error.log',
    out_file: '/var/log/camera-streaming-out.log',
    log_file: '/var/log/camera-streaming.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.js"

# Start application with PM2
cd "$APP_DIR/backend"
sudo -u "$APP_USER" pm2 start ecosystem.config.js
sudo -u "$APP_USER" pm2 save
sudo -u "$APP_USER" pm2 startup

print_success "PM2 configured and application started"

# Configure firewall
print_header "12. Configuring Firewall"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp
ufw --force enable
print_success "Firewall configured"

# Start services
print_header "13. Starting Services"
systemctl enable nginx
systemctl restart nginx
systemctl enable mysql
systemctl restart mysql

print_success "Services started"

# Run database migrations
print_header "14. Running Database Migrations"
cd "$APP_DIR/backend"
sudo -u "$APP_USER" npm run migration:run
print_success "Database migrations completed"

# Final status check
print_header "15. Final Status Check"
echo "Checking services..."
systemctl is-active --quiet nginx && print_success "Nginx is running" || print_error "Nginx is not running"
systemctl is-active --quiet mysql && print_success "MySQL is running" || print_error "MySQL is not running"
sudo -u "$APP_USER" pm2 status | grep -q "online" && print_success "Application is running" || print_error "Application is not running"

print_header "Deployment Complete!"
echo -e "${GREEN}🎉 RTMP Camera Streaming Platform successfully deployed!${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Frontend: http://getfairplay.org"
echo -e "  API: http://api.getfairplay.org/api/v1"
echo -e "  RTMP: rtmp://api.getfairplay.org:1935/live"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Configure SSL certificates for HTTPS"
echo -e "  2. Set up monitoring and logging"
echo -e "  3. Configure backup strategies"
echo -e "  4. Test RTMP streaming functionality"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "  - Change default passwords in production"
echo -e "  - Configure proper SSL certificates"
echo -e "  - Set up regular backups"
echo -e "  - Monitor system resources"
