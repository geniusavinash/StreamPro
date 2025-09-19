# RTMP Camera Streaming Platform - Quick Start Guide

## 🚀 **Quick Setup (5 Minutes)**

### **Prerequisites**
- Node.js 18+ installed
- MySQL 8.0+ installed
- FFmpeg installed
- Git installed

### **Step 1: Clone and Install**
```bash
# Clone the repository
git clone <repository-url>
cd RTMP_CAMERA_PANEL

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### **Step 2: Database Setup**
```bash
# Create database
mysql -u root -p
CREATE DATABASE camera_streaming;
CREATE USER 'camera_user'@'localhost' IDENTIFIED BY 'camera_password_2024';
GRANT ALL PRIVILEGES ON camera_streaming.* TO 'camera_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **Step 3: Environment Configuration**
```bash
# Copy production environment file
cd backend
cp ../production.env .env

# Edit the .env file with your settings
nano .env
```

### **Step 4: Start the System**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### **Step 5: Access the System**
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000/api/v1
- **API Documentation:** http://localhost:3000/api

## 🎯 **First Time Setup**

### **1. Login to the System**
- Open http://localhost:3001
- Use default credentials:
  - **Username:** admin
  - **Password:** password

### **2. Add Your First Camera**
1. Go to **Cameras** page
2. Click **"Add Camera"** button
3. Fill in camera details:
   - **Name:** My First Camera
   - **Company:** Your Company
   - **Model:** Camera Model
   - **Serial Number:** CAM001
   - **Location:** Main Entrance
   - **Place:** Mounted on wall

### **3. Generate RTMP URL**
1. Click **"RTMP"** button on your camera card
2. Copy the generated URLs:
   - **RTMP URL:** For streaming software
   - **Stream Key:** Authentication key
   - **HLS URL:** For web playback
   - **DASH URL:** For adaptive streaming

## 📹 **Streaming Setup**

### **Using OBS Studio**
1. Open OBS Studio
2. Go to **Settings > Stream**
3. Set **Service** to "Custom"
4. Set **Server** to your RTMP URL
5. Set **Stream Key** to your Stream Key
6. Click **Start Streaming**

### **Using FFmpeg**
```bash
# Stream from webcam
ffmpeg -f v4l2 -i /dev/video0 -c:v libx264 -preset veryfast -f flv rtmp://localhost:1935/live/YOUR_STREAM_KEY

# Stream from file
ffmpeg -re -i input.mp4 -c copy -f flv rtmp://localhost:1935/live/YOUR_STREAM_KEY
```

### **Web Playback**
```html
<!-- Using Video.js for HLS playback -->
<video id="player" controls>
  <source src="YOUR_HLS_URL" type="application/x-mpegURL">
</video>

<script src="https://vjs.zencdn.net/8.6.1/video.min.js"></script>
<script>
  var player = videojs('player');
</script>
```

## 🔧 **System Testing**

### **Run Automated Tests**
```bash
# Install test dependencies
npm install axios

# Run system tests
node test-rtmp-system.js
```

### **Manual Testing Checklist**
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Login works with admin credentials
- [ ] Camera can be added successfully
- [ ] RTMP URL generation works
- [ ] Stream status updates correctly
- [ ] HLS/DASH URLs are accessible

## 🚀 **Production Deployment**

### **Quick Deploy to Server**
```bash
# Make deployment script executable
chmod +x deploy-rtmp-server.sh

# Run deployment (requires root/sudo)
sudo ./deploy-rtmp-server.sh
```

### **Manual Production Setup**
1. **Install Nginx with RTMP module**
2. **Configure SSL certificates**
3. **Set up database backups**
4. **Configure monitoring**
5. **Set up log rotation**

## 📊 **Monitoring and Maintenance**

### **Check System Status**
```bash
# Check PM2 processes
pm2 status

# Check Nginx status
systemctl status nginx

# Check MySQL status
systemctl status mysql

# View logs
pm2 logs camera-streaming-backend
tail -f /var/log/nginx/error.log
```

### **Backup Database**
```bash
# Create backup
mysqldump -u camera_user -p camera_streaming > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u camera_user -p camera_streaming < backup_file.sql
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Backend Won't Start**
- Check if port 3000 is available
- Verify database connection
- Check environment variables
- View error logs: `pm2 logs camera-streaming-backend`

#### **Frontend Won't Load**
- Check if port 3001 is available
- Verify backend is running
- Check browser console for errors
- Clear browser cache

#### **RTMP Streaming Not Working**
- Check if Nginx RTMP module is installed
- Verify port 1935 is open
- Check RTMP authentication logs
- Test with FFmpeg command line

#### **Database Connection Issues**
- Verify MySQL is running
- Check database credentials
- Ensure database exists
- Check firewall settings

### **Log Locations**
- **Backend Logs:** `/var/log/camera-streaming.log`
- **Nginx Logs:** `/var/log/nginx/error.log`
- **PM2 Logs:** `pm2 logs camera-streaming-backend`
- **System Logs:** `/var/log/syslog`

## 📚 **API Documentation**

### **Authentication**
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### **Get Cameras**
```bash
# Get all cameras
curl -X GET http://localhost:3000/api/v1/cameras \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Generate RTMP URL**
```bash
# Generate RTMP URL for camera
curl -X POST http://localhost:3000/api/v1/cameras/CAMERA_ID/rtmp/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎉 **Success!**

Your RTMP Camera Streaming Platform is now ready! You can:

- ✅ Add and manage cameras
- ✅ Generate RTMP streaming URLs
- ✅ Stream live video content
- ✅ Record video streams
- ✅ Monitor stream status
- ✅ View analytics and reports

## 📞 **Support**

If you encounter any issues:

1. Check the troubleshooting section above
2. Run the system test script
3. Check the logs for error messages
4. Verify all prerequisites are installed
5. Ensure all services are running

---

**Happy Streaming! 🎥✨**
