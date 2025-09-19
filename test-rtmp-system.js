#!/usr/bin/env node

/**
 * RTMP Camera Streaming Platform - System Test Script
 * This script tests the complete RTMP streaming system
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  backendUrl: 'http://localhost:3000/api/v1',
  frontendUrl: 'http://localhost:3001',
  testUser: {
    username: 'admin',
    password: 'password'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(50)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(50), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Test functions
async function testBackendHealth() {
  try {
    logHeader('Testing Backend Health');
    
    const response = await axios.get(`${config.backendUrl}/health`);
    
    if (response.status === 200) {
      logSuccess('Backend is healthy');
      logInfo(`Status: ${response.data.status}`);
      logInfo(`Version: ${response.data.version}`);
      logInfo(`Uptime: ${response.data.uptime}s`);
      return true;
    } else {
      logError('Backend health check failed');
      return false;
    }
  } catch (error) {
    logError(`Backend health check failed: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  try {
    logHeader('Testing Authentication');
    
    const response = await axios.post(`${config.backendUrl}/auth/login`, {
      username: config.testUser.username,
      password: config.testUser.password
    });
    
    if (response.status === 200 && response.data.accessToken) {
      logSuccess('Authentication successful');
      logInfo(`Token: ${response.data.accessToken.substring(0, 20)}...`);
      return response.data.accessToken;
    } else {
      logError('Authentication failed');
      return null;
    }
  } catch (error) {
    logError(`Authentication failed: ${error.message}`);
    return null;
  }
}

async function testCamerasAPI(token) {
  try {
    logHeader('Testing Cameras API');
    
    const response = await axios.get(`${config.backendUrl}/cameras`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      logSuccess('Cameras API working');
      const cameras = Array.isArray(response.data) ? response.data : response.data.cameras || [];
      logInfo(`Found ${cameras.length} cameras`);
      
      if (cameras.length > 0) {
        const camera = cameras[0];
        logInfo(`First camera: ${camera.name} (${camera.status})`);
        return camera.id;
      }
      return null;
    } else {
      logError('Cameras API failed');
      return null;
    }
  } catch (error) {
    logError(`Cameras API failed: ${error.message}`);
    return null;
  }
}

async function testRTMPGeneration(token, cameraId) {
  try {
    logHeader('Testing RTMP URL Generation');
    
    const response = await axios.post(`${config.backendUrl}/cameras/${cameraId}/rtmp/generate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data.rtmpUrl) {
      logSuccess('RTMP URL generated successfully');
      logInfo(`RTMP URL: ${response.data.rtmpUrl}`);
      logInfo(`Stream Key: ${response.data.streamKey}`);
      logInfo(`HLS URL: ${response.data.hlsUrl}`);
      logInfo(`DASH URL: ${response.data.dashUrl}`);
      return true;
    } else {
      logError('RTMP URL generation failed');
      return false;
    }
  } catch (error) {
    logError(`RTMP URL generation failed: ${error.message}`);
    return false;
  }
}

async function testStreamStatus(token, cameraId) {
  try {
    logHeader('Testing Stream Status');
    
    const response = await axios.get(`${config.backendUrl}/cameras/${cameraId}/stream/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      logSuccess('Stream status retrieved');
      logInfo(`Status: ${response.data.status}`);
      logInfo(`Stream Key: ${response.data.streamKey || 'None'}`);
      logInfo(`Assigned Node: ${response.data.assignedNode || 'None'}`);
      return true;
    } else {
      logError('Stream status check failed');
      return false;
    }
  } catch (error) {
    logError(`Stream status check failed: ${error.message}`);
    return false;
  }
}

async function testFrontendAccess() {
  try {
    logHeader('Testing Frontend Access');
    
    const response = await axios.get(config.frontendUrl);
    
    if (response.status === 200) {
      logSuccess('Frontend is accessible');
      logInfo(`URL: ${config.frontendUrl}`);
      return true;
    } else {
      logError('Frontend access failed');
      return false;
    }
  } catch (error) {
    logError(`Frontend access failed: ${error.message}`);
    return false;
  }
}

function testFFmpegInstallation() {
  return new Promise((resolve) => {
    logHeader('Testing FFmpeg Installation');
    
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        logSuccess('FFmpeg is installed and working');
        resolve(true);
      } else {
        logError('FFmpeg is not working properly');
        resolve(false);
      }
    });
    
    ffmpeg.on('error', (error) => {
      logError(`FFmpeg error: ${error.message}`);
      resolve(false);
    });
  });
}

function testNginxRTMPModule() {
  return new Promise((resolve) => {
    logHeader('Testing Nginx RTMP Module');
    
    const nginx = spawn('nginx', ['-V']);
    let output = '';
    
    nginx.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    nginx.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    nginx.on('close', (code) => {
      if (output.includes('rtmp_module')) {
        logSuccess('Nginx RTMP module is available');
        resolve(true);
      } else {
        logWarning('Nginx RTMP module not found - install nginx-module-rtmp');
        resolve(false);
      }
    });
    
    nginx.on('error', (error) => {
      logError(`Nginx error: ${error.message}`);
      resolve(false);
    });
  });
}

async function runAllTests() {
  logHeader('RTMP Camera Streaming Platform - System Test');
  logInfo('Starting comprehensive system tests...\n');
  
  const results = {
    backendHealth: false,
    authentication: false,
    camerasAPI: false,
    rtmpGeneration: false,
    streamStatus: false,
    frontendAccess: false,
    ffmpeg: false,
    nginxRtmp: false
  };
  
  // Test backend health
  results.backendHealth = await testBackendHealth();
  
  if (!results.backendHealth) {
    logError('Backend is not running. Please start the backend first.');
    return results;
  }
  
  // Test authentication
  const token = await testAuthentication();
  results.authentication = !!token;
  
  if (!token) {
    logError('Authentication failed. Please check credentials.');
    return results;
  }
  
  // Test cameras API
  const cameraId = await testCamerasAPI(token);
  results.camerasAPI = !!cameraId;
  
  if (!cameraId) {
    logWarning('No cameras found. Please add a camera first.');
  }
  
  // Test RTMP generation (if camera exists)
  if (cameraId) {
    results.rtmpGeneration = await testRTMPGeneration(token, cameraId);
    results.streamStatus = await testStreamStatus(token, cameraId);
  }
  
  // Test frontend access
  results.frontendAccess = await testFrontendAccess();
  
  // Test FFmpeg
  results.ffmpeg = await testFFmpegInstallation();
  
  // Test Nginx RTMP module
  results.nginxRtmp = await testNginxRTMPModule();
  
  // Print summary
  logHeader('Test Results Summary');
  
  const testResults = [
    { name: 'Backend Health', result: results.backendHealth },
    { name: 'Authentication', result: results.authentication },
    { name: 'Cameras API', result: results.camerasAPI },
    { name: 'RTMP Generation', result: results.rtmpGeneration },
    { name: 'Stream Status', result: results.streamStatus },
    { name: 'Frontend Access', result: results.frontendAccess },
    { name: 'FFmpeg Installation', result: results.ffmpeg },
    { name: 'Nginx RTMP Module', result: results.nginxRtmp }
  ];
  
  testResults.forEach(test => {
    if (test.result) {
      logSuccess(test.name);
    } else {
      logError(test.name);
    }
  });
  
  const passedTests = testResults.filter(test => test.result).length;
  const totalTests = testResults.length;
  
  logInfo(`\nPassed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    logSuccess('🎉 All tests passed! System is ready for production.');
  } else {
    logWarning('⚠️  Some tests failed. Please fix the issues before deploying to production.');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testBackendHealth,
  testAuthentication,
  testCamerasAPI,
  testRTMPGeneration,
  testStreamStatus,
  testFrontendAccess,
  testFFmpegInstallation,
  testNginxRTMPModule
};
