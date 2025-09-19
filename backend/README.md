# Multi-Camera RTMP Streaming Platform

A comprehensive solution for managing RTMP camera streams with real-time monitoring, recording capabilities, and API integration.

## Features

- **Multi-Camera Management**: Add, edit, and manage multiple cameras with unique RTMP links
- **Real-time Streaming**: RTMP ingestion with HLS output for browser playback
- **Recording System**: Automatic recording with multi-tier storage management
- **Live Dashboard**: Real-time monitoring with WebSocket updates
- **API Integration**: RESTful APIs with token-based authentication
- **Role-based Access**: Admin, Operator, Viewer, and API-only user roles
- **Security**: JWT authentication, API rate limiting, and audit logging

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Start infrastructure services:**
```bash
docker-compose up -d postgres redis nginx-rtmp
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run database migrations:**
```bash
npm run migration:run
```

5. **Start the development server:**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api`

### Docker Compose Services

- **PostgreSQL**: Database on port 5432
- **Redis**: Cache and session store on port 6379  
- **Nginx RTMP**: Streaming server on port 1935 (RTMP) and 8080 (HLS)

### RTMP Streaming

Cameras can stream to: `rtmp://localhost:1935/live/{stream_key}`
HLS playback available at: `http://localhost:8080/hls/{stream_key}.m3u8`

## API Documentation

Once running, visit `http://localhost:3000/api` for interactive API documentation.

## Project Structure

```
src/
├── config/           # Configuration files
├── modules/          # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── cameras/      # Camera management
│   ├── streaming/    # Stream handling
│   ├── recording/    # Recording management
│   └── notifications/# Real-time notifications
├── common/           # Shared utilities and enums
└── database/         # Database migrations and entities
```

## Development

- `npm run start:dev` - Start development server with hot reload
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Production Deployment

See `docker-compose.prod.yml` for production configuration with:
- Multi-node RTMP servers
- Load balancing
- SSL/TLS termination
- Monitoring and logging