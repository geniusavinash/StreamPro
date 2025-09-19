# Production Deployment Guide

Complete guide for deploying the Camera Streaming Platform in production environments with high availability, security, and scalability.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Infrastructure Requirements](#infrastructure-requirements)
- [Security Configuration](#security-configuration)
- [High Availability Setup](#high-availability-setup)
- [Load Balancing](#load-balancing)
- [Database Configuration](#database-configuration)
- [Storage Configuration](#storage-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Performance Optimization](#performance-optimization)
- [Maintenance](#maintenance)

## Architecture Overview

### Production Architecture Diagram

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (HAProxy)    │
                    └─────────┬───────┘
                              │
                    ┌─────────┴───────┐
                    │                 │
            ┌───────▼────────┐ ┌──────▼────────┐
            │  App Server 1  │ │  App Server 2 │
            │   (Backend)    │ │   (Backend)   │
            └───────┬────────┘ └──────┬────────┘
                    │                 │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │   Database      │
                    │  (PostgreSQL)   │
                    │   Primary +     │
                    │   Replica       │
                    └─────────────────┘
                              │
                    ┌─────────▼───────┐
                    │     Redis       │
                    │   (Cluster)     │
                    └─────────────────┘
                              │
                    ┌─────────▼───────┐
                    │  RTMP Servers   │
                    │   (Nginx)       │
                    └─────────────────┘
                              │
                    ┌─────────▼───────┐
                    │    Storage      │
                    │  (NFS/S3/GCS)   │
                    └─────────────────┘
```

### Component Responsibilities

- **Load Balancer**: Distributes traffic, SSL termination, health checks
- **App Servers**: API processing, WebSocket connections, business logic
- **Database**: Data persistence with read replicas for scaling
- **Redis**: Caching, session storage, real-time data
- **RTMP Servers**: Stream ingestion and processing
- **Storage**: Recording files, HLS segments, static assets

## Infrastructure Requirements

### Minimum Production Setup

**Load Balancer:**
- 2 vCPUs, 4GB RAM
- 100GB SSD
- 1Gbps network

**Application Servers (2x):**
- 4 vCPUs, 8GB RAM
- 200GB SSD
- 1Gbps network

**Database Server:**
- 4 vCPUs, 16GB RAM
- 500GB SSD (IOPS optimized)
- 1Gbps network

**RTMP Servers (2x):**
- 8 vCPUs, 16GB RAM
- 1TB SSD
- 10Gbps network

### High-Scale Setup (1000+ cameras)

**Load Balancer (2x for HA):**
- 4 vCPUs, 8GB RAM
- 200GB SSD
- 10Gbps network

**Application Servers (4x):**
- 8 vCPUs, 32GB RAM
- 500GB SSD
- 10Gbps network

**Database Cluster:**
- Primary: 16 vCPUs, 64GB RAM, 2TB SSD
- Replica: 8 vCPUs, 32GB RAM, 2TB SSD
- 10Gbps network

**Redis Cluster (3x):**
- 4 vCPUs, 16GB RAM
- 200GB SSD
- 1Gbps network

**RTMP Servers (6x):**
- 16 vCPUs, 64GB RAM
- 2TB NVMe SSD
- 25Gbps network

## Security Configuration

### SSL/TLS Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d api.yourdomain.com -d stream.yourdomain.com

# Configure auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow RTMP
sudo ufw allow 1935/tcp

# Allow database (only from app servers)
sudo ufw allow from 10.0.1.0/24 to any port 5432

# Enable firewall
sudo ufw enable
```

### Environment Variables Security

```bash
# Create secure environment file
cat > /opt/camera-streaming/.env << EOF
NODE_ENV=production

# Database (use strong passwords)
DATABASE_HOST=db.internal.yourdomain.com
DATABASE_PORT=5432
DATABASE_NAME=camera_streaming_prod
DATABASE_USER=camera_prod_user
DATABASE_PASSWORD=$(openssl rand -base64 32)

# Redis
REDIS_HOST=redis.internal.yourdomain.com
REDIS_PORT=6379
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT Secrets (rotate regularly)
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=$(openssl rand -base64 32)
ENCRYPTION_ALGORITHM=aes-256-gcm

# API Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
CORS_ORIGIN=https://yourdomain.com

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
LOG_LEVEL=info

# Storage
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=camera-recordings-prod

# SMTP for notifications
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASSWORD=your_smtp_password
EOF

# Secure the file
sudo chown root:camera-streaming /opt/camera-streaming/.env
sudo chmod 640 /opt/camera-streaming/.env
```

### Network Security

```bash
# Configure fail2ban for SSH protection
sudo apt-get install fail2ban

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## High Availability Setup

### Load Balancer Configuration (HAProxy)

```bash
# Install HAProxy
sudo apt-get install haproxy

# Configure HAProxy
cat > /etc/haproxy/haproxy.cfg << EOF
global
    daemon
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog
    option dontlognull

frontend api_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/yourdomain.com.pem
    redirect scheme https if !{ ssl_fc }
    
    # API requests
    acl is_api path_beg /api
    use_backend api_backend if is_api
    
    # WebSocket requests
    acl is_websocket hdr(Upgrade) -i websocket
    use_backend websocket_backend if is_websocket
    
    # Default to frontend
    default_backend frontend_backend

backend api_backend
    balance roundrobin
    option httpchk GET /api/health
    server api1 10.0.1.10:3000 check
    server api2 10.0.1.11:3000 check
    server api3 10.0.1.12:3000 check backup

backend websocket_backend
    balance source
    option httpchk GET /api/health
    server ws1 10.0.1.10:3000 check
    server ws2 10.0.1.11:3000 check

backend frontend_backend
    balance roundrobin
    server web1 10.0.1.20:80 check
    server web2 10.0.1.21:80 check

frontend rtmp_frontend
    mode tcp
    bind *:1935
    default_backend rtmp_backend

backend rtmp_backend
    mode tcp
    balance roundrobin
    server rtmp1 10.0.1.30:1935 check
    server rtmp2 10.0.1.31:1935 check
    server rtmp3 10.0.1.32:1935 check

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
EOF

sudo systemctl enable haproxy
sudo systemctl start haproxy
```

### Database High Availability

```bash
# Primary database setup
sudo -u postgres psql << EOF
-- Create replication user
CREATE USER replicator REPLICATION LOGIN CONNECTION LIMIT 5 ENCRYPTED PASSWORD 'replication_password';

-- Configure postgresql.conf
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET max_wal_senders = 5;
ALTER SYSTEM SET wal_keep_segments = 32;
ALTER SYSTEM SET hot_standby = on;

SELECT pg_reload_conf();
EOF

# Configure pg_hba.conf for replication
echo "host replication replicator 10.0.1.0/24 md5" >> /etc/postgresql/14/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Setup replica server
sudo -u postgres pg_basebackup -h primary-db-server -D /var/lib/postgresql/14/main -U replicator -P -v -R -W

# Start replica
sudo systemctl start postgresql
```

### Redis Cluster Setup

```bash
# Install Redis on each node
sudo apt-get install redis-server

# Configure Redis cluster (on each node)
cat > /etc/redis/redis.conf << EOF
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
bind 0.0.0.0
protected-mode no
EOF

# Start Redis on all nodes
sudo systemctl start redis-server

# Create cluster (run on one node)
redis-cli --cluster create \
  10.0.1.40:7000 10.0.1.41:7000 10.0.1.42:7000 \
  10.0.1.43:7000 10.0.1.44:7000 10.0.1.45:7000 \
  --cluster-replicas 1
```

## Load Balancing

### Application Server Configuration

```bash
# Create systemd service for each app server
cat > /etc/systemd/system/camera-streaming.service << EOF
[Unit]
Description=Camera Streaming Platform
After=network.target

[Service]
Type=simple
User=camera-streaming
WorkingDirectory=/opt/camera-streaming
Environment=NODE_ENV=production
EnvironmentFile=/opt/camera-streaming/.env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=camera-streaming

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable camera-streaming
sudo systemctl start camera-streaming
```

### RTMP Load Balancing

```bash
# Configure Nginx RTMP with upstream
cat > /etc/nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

rtmp {
    upstream backend {
        server 10.0.1.30:1935;
        server 10.0.1.31:1935;
        server 10.0.1.32:1935;
    }
    
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            
            # Publish to backend servers
            push rtmp://backend/live;
            
            # HLS configuration
            hls on;
            hls_path /var/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # Recording
            record all;
            record_path /var/recordings;
            record_unique on;
            record_suffix .flv;
            
            # Authentication callback
            on_publish http://api.yourdomain.com/api/rtmp/auth;
            on_publish_done http://api.yourdomain.com/api/rtmp/done;
        }
    }
}
EOF
```

## Database Configuration

### PostgreSQL Optimization

```sql
-- Performance tuning
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Connection settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

SELECT pg_reload_conf();
```

### Database Monitoring

```bash
# Install pg_stat_statements
sudo -u postgres psql -d camera_streaming_prod -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Create monitoring user
sudo -u postgres psql << EOF
CREATE USER monitoring WITH PASSWORD 'monitoring_password';
GRANT SELECT ON pg_stat_database TO monitoring;
GRANT SELECT ON pg_stat_statements TO monitoring;
EOF
```

## Storage Configuration

### S3 Configuration

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure S3 bucket
aws s3 mb s3://camera-recordings-prod --region us-east-1

# Set lifecycle policy
cat > lifecycle-policy.json << EOF
{
    "Rules": [
        {
            "ID": "RecordingLifecycle",
            "Status": "Enabled",
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 365,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ]
        }
    ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket camera-recordings-prod \
  --lifecycle-configuration file://lifecycle-policy.json
```

### NFS Configuration (Alternative)

```bash
# Install NFS server
sudo apt-get install nfs-kernel-server

# Create shared directory
sudo mkdir -p /srv/nfs/recordings
sudo chown nobody:nogroup /srv/nfs/recordings
sudo chmod 755 /srv/nfs/recordings

# Configure exports
echo "/srv/nfs/recordings 10.0.1.0/24(rw,sync,no_subtree_check,no_root_squash)" >> /etc/exports

# Start NFS
sudo systemctl enable nfs-kernel-server
sudo systemctl start nfs-kernel-server
sudo exportfs -a

# Mount on client servers
sudo mkdir -p /var/recordings
echo "nfs-server:/srv/nfs/recordings /var/recordings nfs defaults 0 0" >> /etc/fstab
sudo mount -a
```

## Monitoring and Logging

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "camera_streaming_rules.yml"

scrape_configs:
  - job_name: 'camera-streaming-api'
    static_configs:
      - targets: ['10.0.1.10:3000', '10.0.1.11:3000', '10.0.1.12:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['10.0.1.50:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['10.0.1.40:9121', '10.0.1.41:9121', '10.0.1.42:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['10.0.1.30:9113', '10.0.1.31:9113', '10.0.1.32:9113']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['10.0.1.10:9100', '10.0.1.11:9100', '10.0.1.12:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboards

```bash
# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Configure Grafana
cat > /etc/grafana/grafana.ini << EOF
[server]
http_port = 3001
domain = monitoring.yourdomain.com

[security]
admin_user = admin
admin_password = secure_admin_password

[database]
type = postgres
host = 10.0.1.50:5432
name = grafana
user = grafana_user
password = grafana_password

[smtp]
enabled = true
host = smtp.yourdomain.com:587
user = alerts@yourdomain.com
password = smtp_password
from_address = alerts@yourdomain.com
EOF

sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

### Centralized Logging

```bash
# Install ELK Stack
# Elasticsearch
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-7.x.list
sudo apt-get update && sudo apt-get install elasticsearch

# Configure Elasticsearch
cat > /etc/elasticsearch/elasticsearch.yml << EOF
cluster.name: camera-streaming-logs
node.name: log-node-1
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
EOF

# Logstash
sudo apt-get install logstash

# Kibana
sudo apt-get install kibana

# Configure Kibana
cat > /etc/kibana/kibana.yml << EOF
server.port: 5601
server.host: "0.0.0.0"
elasticsearch.hosts: ["http://localhost:9200"]
EOF

# Start services
sudo systemctl enable elasticsearch logstash kibana
sudo systemctl start elasticsearch logstash kibana
```

## Backup and Recovery

### Automated Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-production.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/camera-streaming"
S3_BUCKET="camera-streaming-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Backing up database..."
pg_dump -h 10.0.1.50 -U backup_user camera_streaming_prod | gzip > $BACKUP_DIR/database_$DATE.sql.gz

# Configuration backup
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/camera-streaming/.env /etc/nginx/ /etc/haproxy/

# Recent recordings backup (last 24 hours)
echo "Backing up recent recordings..."
find /var/recordings -mtime -1 -type f | tar -czf $BACKUP_DIR/recordings_$DATE.tar.gz -T -

# Upload to S3
echo "Uploading to S3..."
aws s3 sync $BACKUP_DIR/ s3://$S3_BUCKET/daily/

# Clean local backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Clean S3 backups (keep 30 days)
aws s3 ls s3://$S3_BUCKET/daily/ | while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "30 days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk '{print $4}')
        if [[ $fileName != "" ]]; then
            aws s3 rm s3://$S3_BUCKET/daily/$fileName
        fi
    fi
done

echo "Backup completed successfully"
```

### Recovery Procedures

```bash
# Database recovery
gunzip -c database_20231201_020000.sql.gz | psql -h 10.0.1.50 -U postgres camera_streaming_prod

# Configuration recovery
tar -xzf config_20231201_020000.tar.gz -C /

# Recordings recovery
tar -xzf recordings_20231201_020000.tar.gz -C /var/recordings/

# Restart services
sudo systemctl restart camera-streaming nginx haproxy
```

## Performance Optimization

### Application Optimization

```javascript
// pm2 ecosystem file
module.exports = {
  apps: [{
    name: 'camera-streaming',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048'
  }]
};
```

### Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_cameras_active ON cameras(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_recordings_camera_date ON recordings(camera_id, created_at);
CREATE INDEX CONCURRENTLY idx_audit_logs_date ON audit_logs(created_at);

-- Partition large tables
CREATE TABLE recordings_2024 PARTITION OF recordings
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Analyze tables
ANALYZE cameras;
ANALYZE recordings;
ANALYZE users;
```

### Nginx Optimization

```nginx
# nginx.conf optimizations
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

## Maintenance

### Regular Maintenance Tasks

```bash
# Weekly maintenance script
#!/bin/bash
# /usr/local/bin/weekly-maintenance.sh

# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Clean Docker images
docker system prune -f

# Vacuum database
sudo -u postgres psql camera_streaming_prod -c "VACUUM ANALYZE;"

# Rotate logs
sudo logrotate -f /etc/logrotate.conf

# Check disk space
df -h | awk '$5 > 80 {print "Warning: " $0}'

# Check service status
systemctl is-active camera-streaming haproxy nginx postgresql redis-server

# Update SSL certificates
certbot renew --quiet

echo "Weekly maintenance completed"
```

### Monitoring Health Checks

```bash
# Health check script
#!/bin/bash
# /usr/local/bin/health-check.sh

# Check API health
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "API health check failed"
    exit 1
fi

# Check database connection
if ! pg_isready -h 10.0.1.50 -p 5432 > /dev/null 2>&1; then
    echo "Database connection failed"
    exit 1
fi

# Check Redis connection
if ! redis-cli -h 10.0.1.40 -p 7000 ping > /dev/null 2>&1; then
    echo "Redis connection failed"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "Disk usage critical: ${DISK_USAGE}%"
    exit 1
fi

echo "All health checks passed"
```

### Scaling Procedures

```bash
# Add new application server
# 1. Provision new server
# 2. Install application
# 3. Configure environment
# 4. Add to load balancer
# 5. Test and monitor

# Scale database
# 1. Add read replica
# 2. Update connection strings
# 3. Monitor replication lag
# 4. Consider sharding for extreme scale

# Scale RTMP servers
# 1. Add new RTMP server
# 2. Update load balancer configuration
# 3. Test stream distribution
# 4. Monitor performance
```

---

**Next Steps:**
- [Set up monitoring and alerting](../admin/monitoring.md)
- [Configure backup and recovery](../admin/backup.md)
- [Implement security best practices](../features/security.md)
- [Optimize for your specific use case](../admin/performance.md)