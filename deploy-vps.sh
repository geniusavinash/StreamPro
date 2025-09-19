#!/bin/bash

# Multi-Camera Streaming Platform - VPS Deployment Script
# For Ubuntu 20.04+ / CentOS 8+ / Debian 11+

set -e

echo "=========================================="
echo "Multi-Camera Streaming Platform"
echo "VPS Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="api.getfairplay.org"
FRONTEND_DOMAIN="getfairplay.org"
DB_NAME="camera"
DB_USER="camerauser"
DB_PASS="camerapass123"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-$(date +%s)"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect OS version"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx mysql-server redis-server ffmpeg nodejs npm certbot python3-certbot-nginx

# Install Node.js 18.x if not available
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    print_status "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Create application user
print_status "Creating application user..."
sudo useradd -m -s /bin/bash getfairplay-api || true
sudo usermod -aG sudo getfairplay-api || true

# Create application directories
print_status "Creating application directories..."
sudo mkdir -p /home/getfairplay-api/htdocs/api.getfairplay.org
sudo mkdir -p /home/getfairplay-api/logs
sudo mkdir -p /var/www/html/hls
sudo mkdir -p /var/www/html/recordings
sudo mkdir -p /var/www/html/dash

# Set permissions
sudo chown -R getfairplay-api:getfairplay-api /home/getfairplay-api
sudo chown -R www-data:www-data /var/www/html

# Configure MySQL
print_status "Configuring MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Configure Redis
print_status "Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx RTMP module
print_status "Installing Nginx with RTMP module..."
sudo apt install -y nginx-module-rtmp

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/api.getfairplay.org > /dev/null <<EOF
# Load RTMP module
load_module modules/ngx_rtmp_module.so;

# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            allow publish all;
            allow play all;
            
            # HLS configuration
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # Recording configuration
            record all;
            record_path /var/www/html/recordings;
            record_unique on;
            record_suffix .flv;
            record_append on;
            
            # Notify URLs
            on_publish http://localhost:3000/api/v1/streaming/on-publish;
            on_play http://localhost:3000/api/v1/streaming/on-play;
            on_record_done http://localhost:3000/api/v1/streaming/on-record-done;
            on_done http://localhost:3000/api/v1/streaming/on-done;
            on_publish http://localhost:3000/api/v1/streaming/auth-publish;
        }
    }
}

# HTTP Configuration
server {
    listen 80;
    server_name $DOMAIN;
    
    # HLS server
    location /hls {
        root /var/www/html;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
    }
    
    # Recordings
    location /recordings {
        alias /var/www/html/recordings;
        add_header Access-Control-Allow-Origin *;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/api.getfairplay.org /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create environment file
print_status "Creating environment configuration..."
sudo tee /home/getfairplay-api/htdocs/api.getfairplay.org/.env > /dev/null <<EOF
# Database Configuration
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://$FRONTEND_DOMAIN

# RTMP Configuration
RTMP_BASE_URL=rtmp://$DOMAIN:1935/live
HLS_BASE_URL=https://$DOMAIN/hls

# FFmpeg Configuration
FFMPEG_PATH=/usr/bin/ffmpeg

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Frontend URL
FRONTEND_URL=https://$FRONTEND_DOMAIN
EOF

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
sudo tee /home/getfairplay-api/htdocs/api.getfairplay.org/ecosystem.config.js > /dev/null <<EOF
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
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/getfairplay-api/logs/error.log',
    out_file: '/home/getfairplay-api/logs/out.log',
    log_file: '/home/getfairplay-api/logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# Create frontend build script
print_status "Creating frontend build script..."
sudo tee /home/getfairplay-api/htdocs/api.getfairplay.org/build-frontend.sh > /dev/null <<EOF
#!/bin/bash
cd /home/getfairplay-api/htdocs/api.getfairplay.org/frontend
npm install
npm run build
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
EOF

sudo chmod +x /home/getfairplay-api/htdocs/api.getfairplay.org/build-frontend.sh

# Create systemd service for PM2
print_status "Creating systemd service for PM2..."
sudo tee /etc/systemd/system/camera-streaming.service > /dev/null <<EOF
[Unit]
Description=Camera Streaming Platform
After=network.target

[Service]
Type=forking
User=getfairplay-api
WorkingDirectory=/home/getfairplay-api/htdocs/api.getfairplay.org
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable camera-streaming.service

# Create deployment script
print_status "Creating deployment script..."
sudo tee /home/getfairplay-api/deploy.sh > /dev/null <<EOF
#!/bin/bash
echo "Deploying Camera Streaming Platform..."

# Stop services
sudo systemctl stop camera-streaming.service

# Update code (assuming git repository)
cd /home/getfairplay-api/htdocs/api.getfairplay.org
git pull origin main

# Install backend dependencies
npm install --production

# Build backend
npm run build

# Run database migrations
npm run migration:run

# Build frontend
./build-frontend.sh

# Start services
sudo systemctl start camera-streaming.service

echo "Deployment completed!"
EOF

sudo chmod +x /home/getfairplay-api/deploy.sh

# Create SSL certificate script
print_status "Creating SSL certificate script..."
sudo tee /home/getfairplay-api/setup-ssl.sh > /dev/null <<EOF
#!/bin/bash
echo "Setting up SSL certificates..."

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN

# Update Nginx configuration for HTTPS
sudo tee /etc/nginx/sites-available/api.getfairplay.org > /dev/null <<'NGINX_EOF'
# Load RTMP module
load_module modules/ngx_rtmp_module.so;

# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            allow publish all;
            allow play all;
            
            # HLS configuration
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # Recording configuration
            record all;
            record_path /var/www/html/recordings;
            record_unique on;
            record_suffix .flv;
            record_append on;
            
            # Notify URLs
            on_publish http://localhost:3000/api/v1/streaming/on-publish;
            on_play http://localhost:3000/api/v1/streaming/on-play;
            on_record_done http://localhost:3000/api/v1/streaming/on-record-done;
            on_done http://localhost:3000/api/v1/streaming/on-done;
            on_publish http://localhost:3000/api/v1/streaming/auth-publish;
        }
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # HLS server
    location /hls {
        root /var/www/html;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
    }
    
    # Recordings
    location /recordings {
        alias /var/www/html/recordings;
        add_header Access-Control-Allow-Origin *;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "SSL setup completed!"
EOF

sudo chmod +x /home/getfairplay-api/setup-ssl.sh

print_success "VPS deployment configuration completed!"
print_status "Next steps:"
echo "1. Upload your code to /home/getfairplay-api/htdocs/api.getfairplay.org/"
echo "2. Run: cd /home/getfairplay-api/htdocs/api.getfairplay.org && npm install"
echo "3. Run: npm run build"
echo "4. Run: npm run migration:run"
echo "5. Run: ./build-frontend.sh"
echo "6. Run: sudo systemctl start camera-streaming.service"
echo "7. Run: ./setup-ssl.sh (for SSL certificates)"
echo ""
print_status "System will be available at:"
echo "- API: https://$DOMAIN/api/v1"
echo "- RTMP: rtmp://$DOMAIN:1935/live"
echo "- HLS: https://$DOMAIN/hls"
echo "- Frontend: https://$FRONTEND_DOMAIN"
