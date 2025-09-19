# StreamPro Deployment Guide

This guide covers various deployment options for StreamPro in production environments.

## 🚀 Quick Deployment Options

### 1. Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional)
- SSL certificate (for HTTPS)

#### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: streampro
      POSTGRES_USER: streampro
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - streampro-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://streampro:your-secure-password@postgres:5432/streampro
      JWT_SECRET: your-jwt-secret-key
      CORS_ORIGIN: https://your-domain.com
    depends_on:
      - postgres
    networks:
      - streampro-network
    volumes:
      - ./recordings:/app/recordings

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      REACT_APP_API_URL: https://your-domain.com/api/v1
      REACT_APP_WS_URL: https://your-domain.com
    networks:
      - streampro-network

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - streampro-network

volumes:
  postgres_data:

networks:
  streampro-network:
    driver: bridge
```

#### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
```

#### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Handle client-side routing
            try_files $uri $uri/ /index.html;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### Deploy with Docker Compose

```bash
# Clone the repository
git clone https://github.com/geniusavinash/StreamPro.git
cd StreamPro

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update environment variables
nano backend/.env
nano frontend/.env

# Start the services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 2. Manual Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- PostgreSQL 13+
- Nginx
- PM2 (Process Manager)

#### Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2
sudo npm install -g pm2
```

#### Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE streampro;
CREATE USER streampro WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE streampro TO streampro;
\q
```

#### Application Deployment

```bash
# Clone repository
git clone https://github.com/geniusavinash/StreamPro.git
cd StreamPro

# Backend setup
cd backend
npm install
cp .env.example .env
nano .env  # Update configuration

# Build backend
npm run build

# Frontend setup
cd ../frontend
npm install --legacy-peer-deps
cp .env.example .env
nano .env  # Update configuration

# Build frontend
npm run build

# Copy frontend build to nginx
sudo cp -r build/* /var/www/html/
```

#### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'streampro-backend',
    script: './backend/dist/main.js',
    cwd: '/path/to/StreamPro',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_file: './logs/backend-combined.log',
    time: true
  }]
};
```

Start with PM2:

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 3. Cloud Platform Deployment

#### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create applications
heroku create streampro-backend
heroku create streampro-frontend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev -a streampro-backend

# Set environment variables
heroku config:set NODE_ENV=production -a streampro-backend
heroku config:set JWT_SECRET=your-jwt-secret -a streampro-backend

# Deploy backend
git subtree push --prefix backend heroku-backend main

# Deploy frontend
git subtree push --prefix frontend heroku-frontend main
```

#### AWS Deployment

##### Using AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init streampro

# Create environment
eb create production

# Deploy
eb deploy
```

##### Using AWS ECS (Docker)

1. Push Docker images to ECR
2. Create ECS cluster
3. Define task definitions
4. Create services
5. Setup load balancer

#### DigitalOcean App Platform

Create `app.yaml`:

```yaml
name: streampro
services:
- name: backend
  source_dir: backend
  github:
    repo: geniusavinash/StreamPro
    branch: main
  run_command: npm run start:prod
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}

- name: frontend
  source_dir: frontend
  github:
    repo: geniusavinash/StreamPro
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: db
  engine: PG
  version: "13"
```

## 🔧 Production Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secure-jwt-secret-key
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=https://your-domain.com/api/v1
REACT_APP_WS_URL=https://your-domain.com
REACT_APP_USE_MOCK_DATA=false
GENERATE_SOURCEMAP=false
```

### Security Considerations

1. **HTTPS Only**: Always use SSL certificates
2. **Environment Variables**: Never commit secrets to git
3. **Database Security**: Use strong passwords and restrict access
4. **Rate Limiting**: Implement API rate limiting
5. **CORS**: Configure proper CORS origins
6. **Headers**: Set security headers (CSP, HSTS, etc.)

### Performance Optimization

1. **Caching**: Implement Redis for caching
2. **CDN**: Use CDN for static assets
3. **Compression**: Enable gzip compression
4. **Database**: Optimize queries and add indexes
5. **Monitoring**: Setup application monitoring

### Monitoring and Logging

#### Application Monitoring
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **Sentry**: Error tracking and performance monitoring

#### Log Management
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Fluentd**: Log collection and forwarding
- **CloudWatch**: AWS native logging

### Backup Strategy

1. **Database Backups**: Automated daily backups
2. **File Storage**: Backup recording files
3. **Configuration**: Backup environment configurations
4. **Disaster Recovery**: Document recovery procedures

## 🔍 Health Checks

### Backend Health Check
```bash
curl -f http://localhost:3000/api/v1/health || exit 1
```

### Frontend Health Check
```bash
curl -f http://localhost:80/ || exit 1
```

### Database Health Check
```bash
pg_isready -h localhost -p 5432 -U streampro
```

## 📊 Scaling

### Horizontal Scaling
- Load balancer (Nginx, HAProxy)
- Multiple backend instances
- Database read replicas
- CDN for static content

### Vertical Scaling
- Increase server resources
- Optimize database performance
- Implement caching layers

---

For more deployment options and troubleshooting, visit the [StreamPro GitHub repository](https://github.com/geniusavinash/StreamPro).