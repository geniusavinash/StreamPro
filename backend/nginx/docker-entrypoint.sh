#!/bin/sh
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Nginx RTMP server..."

# Create directories if they don't exist
mkdir -p /var/hls /var/dash /var/recordings /var/thumbnails /var/www/html

# Set proper permissions
chown -R nginx:nginx /var/hls /var/dash /var/recordings /var/thumbnails /var/www/html

# Test nginx configuration
log "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    log "Nginx configuration is valid"
else
    log "ERROR: Nginx configuration is invalid"
    exit 1
fi

# Start nginx
log "Starting Nginx with RTMP module..."
exec "$@"