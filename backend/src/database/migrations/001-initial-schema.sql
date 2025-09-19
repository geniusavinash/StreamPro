-- Camera Streaming Platform - Initial MySQL Schema
-- Created: 2025-09-06
-- Database: MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS camera_streaming_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE camera_streaming_db;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'viewer', 'api_only') DEFAULT 'viewer',
    isActive BOOLEAN DEFAULT TRUE,
    lastLoginAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cameras table
CREATE TABLE cameras (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serialNumber VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(500) NOT NULL,
    place VARCHAR(500) NOT NULL,
    rtmpUrl VARCHAR(1000) NOT NULL,
    rtmpKey VARCHAR(255) NOT NULL,
    assignedNode VARCHAR(255) NULL,
    isActive BOOLEAN DEFAULT TRUE,
    isRecording BOOLEAN DEFAULT FALSE,
    streamStatus ENUM('online', 'offline', 'connecting', 'error') DEFAULT 'offline',
    lastSeenAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_cameras_serial (serialNumber),
    INDEX idx_cameras_status (streamStatus),
    INDEX idx_cameras_active (isActive),
    INDEX idx_cameras_recording (isRecording),
    INDEX idx_cameras_node (assignedNode),
    INDEX idx_cameras_company (company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recordings table
CREATE TABLE recordings (
    id VARCHAR(36) PRIMARY KEY,
    cameraId VARCHAR(36) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    filePath VARCHAR(1000) NOT NULL,
    fileSize BIGINT UNSIGNED NOT NULL,
    duration INT NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    storageTier ENUM('hot', 'warm', 'cold', 'archived') DEFAULT 'hot',
    isEncrypted BOOLEAN DEFAULT FALSE,
    isArchived BOOLEAN DEFAULT FALSE,
    cloudUrl VARCHAR(1000) NULL,
    signedUrlExpiresAt DATETIME NULL,
    segmentNumber INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cameraId) REFERENCES cameras(id) ON DELETE CASCADE,
    INDEX idx_recordings_camera (cameraId),
    INDEX idx_recordings_time (startTime, endTime),
    INDEX idx_recordings_tier (storageTier),
    INDEX idx_recordings_archived (isArchived),
    INDEX idx_recordings_segment (cameraId, segmentNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Tokens table
CREATE TABLE api_tokens (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    keyHash VARCHAR(255) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    permissions JSON NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    expiresAt DATETIME NULL,
    lastUsedAt DATETIME NULL,
    ipWhitelist JSON DEFAULT ('[]'),
    rateLimit INT DEFAULT 1000,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tokens_user (userId),
    INDEX idx_tokens_hash (keyHash),
    INDEX idx_tokens_active (isActive),
    INDEX idx_tokens_expires (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NULL,
    resourceId VARCHAR(36) NULL,
    oldValues JSON NULL,
    newValues JSON NULL,
    ipAddress VARCHAR(45) NULL,
    userAgent TEXT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (userId),
    INDEX idx_audit_action (action),
    INDEX idx_audit_resource (resource, resourceId),
    INDEX idx_audit_time (createdAt),
    INDEX idx_audit_ip (ipAddress)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
INSERT INTO users (id, username, email, passwordHash, role, isActive) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@camera-streaming.com', '$2b$10$S1J0E1Z2YcctcA0v9Wv7M.5yF6L9V3H7bQ4sU6K9l0NQe5aY2Pz4K', 'admin', TRUE);

-- Insert sample cameras for testing
INSERT INTO cameras (id, name, company, model, serialNumber, location, place, rtmpUrl, rtmpKey, isActive) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Main Entrance Camera', 'Hikvision', 'DS-2CD2143G0-I', 'HK001234567', 'Building A', 'Main Entrance', 'rtmp://api.getfairplay.org:1935/live', 'main_entrance_001', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'Parking Lot Camera', 'Dahua', 'IPC-HFW4431R-Z', 'DH001234567', 'Building A', 'Parking Lot', 'rtmp://api.getfairplay.org:1935/live', 'parking_lot_001', TRUE),
('550e8400-e29b-41d4-a716-446655440003', 'Reception Camera', 'Axis', 'M3046-V', 'AX001234567', 'Building A', 'Reception Area', 'rtmp://api.getfairplay.org:1935/live', 'reception_001', TRUE);

-- Create indexes for performance
CREATE INDEX idx_recordings_camera_time ON recordings(cameraId, startTime DESC);
CREATE INDEX idx_audit_user_time ON audit_logs(userId, createdAt DESC);
CREATE INDEX idx_cameras_status_active ON cameras(streamStatus, isActive);

-- Show table status
SHOW TABLES;
SELECT 'Database schema created successfully!' as status;