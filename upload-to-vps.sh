#!/bin/bash

# Upload Multi-Camera Streaming Platform to VPS
# Usage: ./upload-to-vps.sh [server-ip] [username]

set -e

# Configuration
SERVER_IP=${1:-"your-server-ip"}
USERNAME=${2:-"getfairplay-api"}
REMOTE_PATH="/home/$USERNAME/htdocs/api.getfairplay.org"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if server IP is provided
if [ "$SERVER_IP" = "your-server-ip" ]; then
    print_error "Please provide server IP address"
    echo "Usage: ./upload-to-vps.sh [server-ip] [username]"
    echo "Example: ./upload-to-vps.sh 192.168.1.100 getfairplay-api"
    exit 1
fi

print_status "Uploading to VPS: $SERVER_IP"
print_status "Username: $USERNAME"
print_status "Remote path: $REMOTE_PATH"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    print_warning "SSH key not found. You may need to enter password multiple times."
fi

# Create remote directory if it doesn't exist
print_status "Creating remote directory..."
ssh $USERNAME@$SERVER_IP "mkdir -p $REMOTE_PATH"

# Upload backend
print_status "Uploading backend..."
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
    backend/ $USERNAME@$SERVER_IP:$REMOTE_PATH/

# Upload frontend
print_status "Uploading frontend..."
rsync -avz --exclude 'node_modules' --exclude 'build' --exclude '.git' \
    frontend/ $USERNAME@$SERVER_IP:$REMOTE_PATH/frontend/

# Upload configuration files
print_status "Uploading configuration files..."
rsync -avz nginx/ $USERNAME@$SERVER_IP:$REMOTE_PATH/nginx/
rsync -avz deploy-vps.sh $USERNAME@$SERVER_IP:$REMOTE_PATH/
rsync -avz VPS_DEPLOYMENT_GUIDE.md $USERNAME@$SERVER_IP:$REMOTE_PATH/

# Upload deployment scripts
print_status "Uploading deployment scripts..."
rsync -avz start-backend.bat $USERNAME@$SERVER_IP:$REMOTE_PATH/
rsync -avz start-frontend.bat $USERNAME@$SERVER_IP:$REMOTE_PATH/

# Set permissions
print_status "Setting permissions..."
ssh $USERNAME@$SERVER_IP "sudo chown -R $USERNAME:$USERNAME $REMOTE_PATH"
ssh $USERNAME@$SERVER_IP "chmod +x $REMOTE_PATH/deploy-vps.sh"

print_success "Upload completed!"
print_status "Next steps on the server:"
echo "1. SSH into server: ssh $USERNAME@$SERVER_IP"
echo "2. Navigate to project: cd $REMOTE_PATH"
echo "3. Install dependencies: npm install --production"
echo "4. Build backend: npm run build"
echo "5. Run migrations: npm run migration:run"
echo "6. Build frontend: ./build-frontend.sh"
echo "7. Start services: sudo systemctl start camera-streaming.service"
echo "8. Setup SSL: ./setup-ssl.sh"

print_status "Or run the complete deployment script:"
echo "ssh $USERNAME@$SERVER_IP 'cd $REMOTE_PATH && ./deploy-vps.sh'"
