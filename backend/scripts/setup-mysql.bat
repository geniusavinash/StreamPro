@echo off
REM Camera Streaming Platform - MySQL Setup Script for Windows
REM This script sets up MySQL database for the camera streaming platform

echo 🚀 Setting up MySQL for Camera Streaming Platform...

REM Configuration
set DB_NAME=camera_streaming_db
set DB_USER=camera_streaming_user
set DB_PASSWORD=secure_password_123

echo.
echo 📋 Database Configuration:
echo    Database: %DB_NAME%
echo    Username: %DB_USER%
echo    Password: %DB_PASSWORD%
echo    Host: localhost
echo    Port: 3306
echo.

REM Check if MySQL is installed
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL is not installed or not in PATH.
    echo Please install MySQL and add it to your PATH.
    echo Download from: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

echo ✅ MySQL found.

REM Prompt for root password
set /p ROOT_PASSWORD=Enter MySQL root password (press Enter if no password): 

echo.
echo 🔧 Creating database and user...

REM Create SQL commands file
echo CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; > temp_setup.sql
echo CREATE USER IF NOT EXISTS '%DB_USER%'@'localhost' IDENTIFIED BY '%DB_PASSWORD%'; >> temp_setup.sql
echo CREATE USER IF NOT EXISTS '%DB_USER%'@'%%' IDENTIFIED BY '%DB_PASSWORD%'; >> temp_setup.sql
echo GRANT ALL PRIVILEGES ON %DB_NAME%.* TO '%DB_USER%'@'localhost'; >> temp_setup.sql
echo GRANT ALL PRIVILEGES ON %DB_NAME%.* TO '%DB_USER%'@'%%'; >> temp_setup.sql
echo FLUSH PRIVILEGES; >> temp_setup.sql
echo SHOW DATABASES; >> temp_setup.sql

REM Execute SQL commands
if "%ROOT_PASSWORD%"=="" (
    mysql -u root < temp_setup.sql
) else (
    mysql -u root -p%ROOT_PASSWORD% < temp_setup.sql
)

if errorlevel 1 (
    echo ❌ Failed to create database and user.
    del temp_setup.sql
    pause
    exit /b 1
)

echo ✅ Database and user created successfully.

REM Run initial schema if exists
if exist "..\src\database\migrations\001-initial-schema.sql" (
    echo 🔧 Running initial schema migration...
    if "%ROOT_PASSWORD%"=="" (
        mysql -u root < ..\src\database\migrations\001-initial-schema.sql
    ) else (
        mysql -u root -p%ROOT_PASSWORD% < ..\src\database\migrations\001-initial-schema.sql
    )
    echo ✅ Initial schema applied successfully.
) else (
    echo ⚠️ Initial schema file not found. You may need to run migrations manually.
)

REM Create .env file
echo 🔧 Creating .env configuration...

echo # MySQL Database Configuration > ..\.env.mysql
echo DATABASE_TYPE=mysql >> ..\.env.mysql
echo DB_HOST=localhost >> ..\.env.mysql
echo DB_PORT=3306 >> ..\.env.mysql
echo DB_USERNAME=%DB_USER% >> ..\.env.mysql
echo DB_PASSWORD=%DB_PASSWORD% >> ..\.env.mysql
echo DB_NAME=%DB_NAME% >> ..\.env.mysql
echo DATABASE_SYNCHRONIZE=false >> ..\.env.mysql
echo DATABASE_LOGGING=true >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # Application Configuration >> ..\.env.mysql
echo NODE_ENV=development >> ..\.env.mysql
echo PORT=3000 >> ..\.env.mysql
echo API_PREFIX=api/v1 >> ..\.env.mysql
echo CORS_ORIGIN=http://localhost:3001 >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # JWT Configuration >> ..\.env.mysql
echo JWT_SECRET=dev-jwt-secret-key-change-in-production >> ..\.env.mysql
echo JWT_EXPIRES_IN=24h >> ..\.env.mysql
echo JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production >> ..\.env.mysql
echo JWT_REFRESH_EXPIRES_IN=7d >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # Redis Configuration >> ..\.env.mysql
echo REDIS_HOST=localhost >> ..\.env.mysql
echo REDIS_PORT=6379 >> ..\.env.mysql
echo REDIS_PASSWORD= >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # RTMP Configuration >> ..\.env.mysql
echo RTMP_PORT=1935 >> ..\.env.mysql
echo HLS_PATH=./hls >> ..\.env.mysql
echo RECORDING_PATH=./recordings >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # Storage Configuration >> ..\.env.mysql
echo STORAGE_TYPE=local >> ..\.env.mysql
echo STORAGE_PATH=./storage >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # Monitoring >> ..\.env.mysql
echo PROMETHEUS_ENABLED=false >> ..\.env.mysql
echo GRAFANA_ENABLED=false >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # Security >> ..\.env.mysql
echo RATE_LIMIT_ENABLED=true >> ..\.env.mysql
echo RATE_LIMIT_WINDOW_MS=900000 >> ..\.env.mysql
echo RATE_LIMIT_MAX_REQUESTS=1000 >> ..\.env.mysql
echo. >> ..\.env.mysql
echo # Logging >> ..\.env.mysql
echo LOG_LEVEL=debug >> ..\.env.mysql

echo ✅ .env.mysql file created.

REM Test database connection
echo 🔧 Testing database connection with new user...
echo SELECT 'Connection successful!' as status; > temp_test.sql
mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < temp_test.sql

if errorlevel 1 (
    echo ❌ Database connection test failed.
    del temp_setup.sql
    del temp_test.sql
    pause
    exit /b 1
)

echo ✅ Database connection test successful!

REM Cleanup
del temp_setup.sql
del temp_test.sql

REM Display summary
echo.
echo 🎉 MySQL setup completed successfully!
echo.
echo 📋 Database Information:
echo    Database: %DB_NAME%
echo    Username: %DB_USER%
echo    Password: %DB_PASSWORD%
echo    Host: localhost
echo    Port: 3306
echo.
echo 🔧 Next Steps:
echo    1. Copy .env.mysql to .env: copy .env.mysql .env
echo    2. Install dependencies: npm install
echo    3. Start the application: npm run start:dev
echo.
echo 🔗 Connection String:
echo    mysql://%DB_USER%:%DB_PASSWORD%@localhost:3306/%DB_NAME%
echo.
echo ✅ Setup complete! Your Camera Streaming Platform is ready to use with MySQL.
echo.
pause