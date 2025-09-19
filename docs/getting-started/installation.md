# Installation Guide

Complete installation instructions for the Camera Streaming Platform across different environments.

## Table of Contents

- [System Requirements](#system-requirements)
- [Development Installation](#development-installation)
- [Production Installation](#production-installation)
- [Docker Installation](#docker-installation)
- [Kubernetes Installation](#kubernetes-installation)
- [Manual Installation](#manual-installation)
- [Post-Installation Setup](#post-installation-setup)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores (2.0 GHz)
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 20.04+, CentOS 8+, or Docker-compatible

### Recommended Requirements
- **CPU**: 8+ cores (3.0 GHz)
- **RAM**: 16+ GB
- **Storage**: 500+ GB SSD
- **Network**: 10 Gbps
- **OS**: Ubuntu 22.04 LTS

### For High-Scale Deployments (1000+ cameras)
- **CPU**: 16+ cores (3.5 GHz)
- **RAM**: 64+ GB
- **Storage**: 2+ TB NVMe SSD
- **Network**: 25+ Gbps
- **Load Balancer**: Required
- **Database**: Dedicated PostgreSQL cluster

## Development Installation

Perfect for local development and testing.

### Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for frontend development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get update
sudo apt-get install -y git
```

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/camera-streaming/platform.git
cd platform

# 2. Copy environment configuration
cp backend/.env.example backend/.env

# 3. Start development environment
cd backend
docker-compose up -d

# 4. Wait for services to initialize
echo "Waiting for services to start..."
sleep 60

# 5. Run database migrations
docker-compose exec backend npm run migration:run

# 6. Seed initial data
docker-compose exec backend npm run seed

# 7. Start frontend (in a new terminal)
cd ../frontend
npm install
npm start
```

### Verify Installation

```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f

# Test API
curl http://localhost:3000/api/health

# Access web interface
open http://localhost:3000
```

## Production Installation

For production deployments with high availability and security.

### Prerequisites

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Production Configuration

```bash
# 1. Clone repository
git clone https://github.com/camera-streaming/platform.git
cd platform

# 2. Create production environment file
cat > backend/.env << EOF
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=camera_streaming
DATABASE_USER=camera_user
DATABASE_PASSWORD=$(openssl rand -base64 32)

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)

# Encryption
ENCRYPTION_KEY=$(openssl rand -base64 32)

# RTMP
RTMP_PORT=1935
HLS_PATH=/var/hls

# Storage
STORAGE_TYPE=local
STORAGE_PATH=/var/recordings

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Security
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://your-domain.com
EOF

# 3. Create production docker-compose file
cat > backend/docker-compose.prod.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: \${DATABASE_NAME}
      POSTGRES_USER: \${DATABASE_USER}
      POSTGRES_PASSWORD: \${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M

  backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - recordings:/var/recordings
      - hls:/var/hls
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

  nginx-rtmp:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    ports:
      - "1935:1935"
      - "8080:8080"
    volumes:
      - hls:/var/hls
      - recordings:/var/recordings
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  recordings:
  hls:
  prometheus_data:
  grafana_data:
EOF

# 4. Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Run database setup
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run
docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod
```

### SSL/TLS Configuration

```bash
# Install Certbot for Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Create nginx configuration for HTTPS
cat > /etc/nginx/sites-available/camera-streaming << EOF
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/camera-streaming /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Installation

Using pre-built Docker images for quick deployment.

### Using Docker Hub Images

```bash
# 1. Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  camera-streaming:
    image: camerastreaming/platform:latest
    ports:
      - "3000:3000"
      - "1935:1935"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/camera_streaming
      - REDIS_URL=redis://redis:6379
    volumes:
      - recordings:/var/recordings
      - hls:/var/hls
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: camera_streaming
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  recordings:
  hls:
EOF

# 2. Start services
docker-compose up -d

# 3. Initialize database
docker-compose exec camera-streaming npm run migration:run
```

### Building Custom Images

```bash
# 1. Clone repository
git clone https://github.com/camera-streaming/platform.git
cd platform

# 2. Build images
docker build -t camera-streaming/backend:latest backend/
docker build -t camera-streaming/frontend:latest frontend/
docker build -t camera-streaming/nginx-rtmp:latest backend/nginx/

# 3. Push to registry (optional)
docker push camera-streaming/backend:latest
docker push camera-streaming/frontend:latest
docker push camera-streaming/nginx-rtmp:latest
```

## Kubernetes Installation

For container orchestration and high availability.

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm
```

### Deployment

```bash
# 1. Clone repository
git clone https://github.com/camera-streaming/platform.git
cd platform/backend/k8s

# 2. Create namespace
kubectl create namespace camera-streaming

# 3. Deploy using provided manifests
kubectl apply -f . -n camera-streaming

# 4. Wait for deployment
kubectl wait --for=condition=available --timeout=300s deployment --all -n camera-streaming

# 5. Get service URLs
kubectl get services -n camera-streaming
```

### Using Helm Chart

```bash
# 1. Add Helm repository
helm repo add camera-streaming https://charts.camera-streaming.example.com
helm repo update

# 2. Install with custom values
cat > values.yaml << EOF
replicaCount: 3

image:
  repository: camerastreaming/platform
  tag: latest

service:
  type: LoadBalancer

ingress:
  enabled: true
  hostname: camera-streaming.example.com

postgresql:
  enabled: true
  auth:
    database: camera_streaming

redis:
  enabled: true

monitoring:
  enabled: true
EOF

# 3. Install chart
helm install camera-streaming camera-streaming/platform -f values.yaml -n camera-streaming
```

## Manual Installation

For custom environments or when Docker is not available.

### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx with RTMP module
sudo apt-get install -y nginx libnginx-mod-rtmp

# Install FFmpeg
sudo apt-get install -y ffmpeg
```

### Backend Installation

```bash
# 1. Clone and setup backend
git clone https://github.com/camera-streaming/platform.git
cd platform/backend

# 2. Install dependencies
npm install

# 3. Build application
npm run build

# 4. Setup database
sudo -u postgres createuser camera_user
sudo -u postgres createdb camera_streaming -O camera_user
sudo -u postgres psql -c "ALTER USER camera_user PASSWORD 'your_password';"

# 5. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 6. Run migrations
npm run migration:run

# 7. Start application
npm run start:prod
```

### Frontend Installation

```bash
# 1. Setup frontend
cd ../frontend

# 2. Install dependencies
npm install

# 3. Build for production
npm run build

# 4. Serve with nginx
sudo cp -r build/* /var/www/html/
```

### Nginx Configuration

```bash
# Configure nginx for RTMP
cat > /etc/nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            
            hls on;
            hls_path /var/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            record all;
            record_path /var/recordings;
            record_unique on;
            record_suffix .flv;
        }
    }
}

http {
    server {
        listen 80;
        
        location / {
            root /var/www/html;
            try_files \$uri \$uri/ /index.html;
        }
        
        location /api {
            proxy_pass http://localhost:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var;
            add_header Cache-Control no-cache;
        }
    }
}
EOF

# Create directories
sudo mkdir -p /var/hls /var/recordings
sudo chown -R www-data:www-data /var/hls /var/recordings

# Start nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Post-Installation Setup

### 1. Create Admin User

```bash
# Using API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "secure_password",
    "role": "admin"
  }'
```

### 2. Configure System Settings

```bash
# Set system configuration
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "maxCameras": 1000,
    "recordingRetentionDays": 30,
    "streamQuality": "1080p",
    "enableNotifications": true
  }'
```

### 3. Setup Monitoring

```bash
# Configure Prometheus targets
cat > /etc/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'camera-streaming'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
EOF

# Restart Prometheus
sudo systemctl restart prometheus
```

### 4. Configure Backup

```bash
# Create backup script
cat > /usr/local/bin/backup-camera-streaming.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/camera-streaming"

# Create backup directory
mkdir -p \$BACKUP_DIR

# Backup database
pg_dump camera_streaming > \$BACKUP_DIR/database_\$DATE.sql

# Backup recordings (last 7 days)
find /var/recordings -mtime -7 -type f -exec cp {} \$BACKUP_DIR/ \;

# Compress backup
tar -czf \$BACKUP_DIR/backup_\$DATE.tar.gz \$BACKUP_DIR/*_\$DATE.*

# Clean old backups (keep 30 days)
find \$BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-camera-streaming.sh

# Add to crontab (daily backup at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-camera-streaming.sh" | crontab -
```

## Troubleshooting

### Common Installation Issues

**Docker permission denied:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Port already in use:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Kill the process
sudo kill -9 PID
```

**Database connection failed:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset password
sudo -u postgres psql -c "ALTER USER camera_user PASSWORD 'new_password';"
```

**Nginx RTMP module not found:**
```bash
# Install nginx with RTMP module
sudo apt-get remove nginx
sudo apt-get install nginx-full libnginx-mod-rtmp
```

**Out of disk space:**
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Clean old recordings
find /var/recordings -mtime +30 -delete
```

### Performance Issues

**High CPU usage:**
- Reduce video quality/bitrate
- Increase server resources
- Enable hardware acceleration

**High memory usage:**
- Increase swap space
- Optimize database queries
- Reduce concurrent streams

**Network issues:**
- Check bandwidth utilization
- Configure QoS
- Use CDN for distribution

### Getting Help

- [Troubleshooting Guide](../troubleshooting/common-issues.md)
- [Community Forum](https://github.com/camera-streaming/platform/discussions)
- [Enterprise Support](mailto:support@camera-streaming.example.com)

---

**Next Steps:**
- [Configure your first camera](../getting-started/quick-start.md#4-add-your-first-camera)
- [Set up monitoring](../admin/monitoring.md)
- [Explore the API](../api/rest-api.md)