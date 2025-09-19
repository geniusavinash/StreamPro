#!/bin/bash

# Camera Streaming Platform - MySQL Setup Script
# This script sets up MySQL database for the camera streaming platform

set -e

echo "🚀 Setting up MySQL for Camera Streaming Platform..."

# Configuration
DB_NAME="camera_streaming_db"
DB_USER="camera_streaming_user"
DB_PASSWORD="secure_password_123"
ROOT_PASSWORD=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    print_error "MySQL is not installed. Please install MySQL first."
    echo "Ubuntu/Debian: sudo apt-get install mysql-server"
    echo "CentOS/RHEL: sudo yum install mysql-server"
    echo "macOS: brew install mysql"
    exit 1
fi

print_status "MySQL found. Checking if MySQL service is running..."

# Check if MySQL service is running
if ! systemctl is-active --quiet mysql 2>/dev/null && ! systemctl is-active --quiet mysqld 2>/dev/null; then
    print_warning "MySQL service is not running. Attempting to start..."
    
    # Try to start MySQL service
    if systemctl start mysql 2>/dev/null || systemctl start mysqld 2>/dev/null; then
        print_status "MySQL service started successfully."
    else
        print_error "Failed to start MySQL service. Please start it manually."
        exit 1
    fi
fi

# Prompt for root password if not provided
if [ -z "$ROOT_PASSWORD" ]; then
    echo -n "Enter MySQL root password (press Enter if no password): "
    read -s ROOT_PASSWORD
    echo
fi

# Test MySQL connection
print_status "Testing MySQL connection..."
if [ -z "$ROOT_PASSWORD" ]; then
    MYSQL_CMD="mysql -u root"
else
    MYSQL_CMD="mysql -u root -p$ROOT_PASSWORD"
fi

if ! $MYSQL_CMD -e "SELECT 1;" &> /dev/null; then
    print_error "Cannot connect to MySQL. Please check your root password."
    exit 1
fi

print_status "MySQL connection successful."

# Create database and user
print_status "Creating database and user..."

$MYSQL_CMD << EOF
-- Create database
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show databases
SHOW DATABASES;
EOF

print_status "Database and user created successfully."

# Run initial schema
print_status "Running initial schema migration..."

if [ -f "../src/database/migrations/001-initial-schema.sql" ]; then
    $MYSQL_CMD < ../src/database/migrations/001-initial-schema.sql
    print_status "Initial schema applied successfully."
else
    print_warning "Initial schema file not found. You may need to run migrations manually."
fi

# Create .env file with database configuration
print_status "Creating .env configuration..."

cat > ../.env.mysql << EOF
# MySQL Database Configuration
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=true

# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3001

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RTMP Configuration
RTMP_PORT=1935
HLS_PATH=./hls
RECORDING_PATH=./recordings

# Storage Configuration
STORAGE_TYPE=local
STORAGE_PATH=./storage

# Monitoring
PROMETHEUS_ENABLED=false
GRAFANA_ENABLED=false

# Security
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug
EOF

print_status ".env.mysql file created."

# Test database connection with new user
print_status "Testing database connection with new user..."

if mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" &> /dev/null; then
    print_status "Database connection test successful!"
else
    print_error "Database connection test failed."
    exit 1
fi

# Display summary
echo
echo "🎉 MySQL setup completed successfully!"
echo
echo "📋 Database Information:"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo "   Host: localhost"
echo "   Port: 3306"
echo
echo "🔧 Next Steps:"
echo "   1. Copy .env.mysql to .env: cp .env.mysql .env"
echo "   2. Install dependencies: npm install"
echo "   3. Start the application: npm run start:dev"
echo
echo "🔗 Connection String:"
echo "   mysql://$DB_USER:$DB_PASSWORD@localhost:3306/$DB_NAME"
echo
print_status "Setup complete! Your Camera Streaming Platform is ready to use with MySQL."