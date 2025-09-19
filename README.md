# 🎥 StreamPro - Professional Camera Streaming Platform

[![CI/CD Pipeline](https://github.com/geniusavinash/StreamPro/actions/workflows/ci.yml/badge.svg)](https://github.com/geniusavinash/StreamPro/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)

A world-class, enterprise-grade multi-camera RTMP streaming platform built with modern technologies and professional design standards.

![StreamPro Dashboard](https://via.placeholder.com/800x400/2563eb/ffffff?text=StreamPro+Dashboard+Preview)

## ✨ Features

### 🎯 Core Functionality
- **Multi-Camera Management** - Add, configure, and monitor multiple IP cameras
- **Real-time Streaming** - RTMP streaming with WebRTC support
- **Live Recording** - Schedule and manage recording sessions
- **User Management** - Role-based access control (Admin, Operator, Viewer)
- **Real-time Dashboard** - Professional monitoring interface with live metrics

### 🎨 Professional Design
- **Modern UI/UX** - Glass morphism effects, gradient cards, and smooth animations
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme** - Automatic theme detection and manual toggle
- **Professional Typography** - Inter font family with proper hierarchy
- **Accessibility** - WCAG 2.1 compliant with keyboard navigation

### 🔧 Technical Excellence
- **TypeScript** - Full type safety across frontend and backend
- **Real-time Updates** - WebSocket connections for live data
- **Database Flexibility** - SQLite for development, PostgreSQL/MySQL for production
- **API Documentation** - Comprehensive REST API with OpenAPI/Swagger
- **Error Handling** - Graceful error boundaries and user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/geniusavinash/StreamPro.git
   cd StreamPro
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Start development servers**
   ```bash
   # Option 1: Use the convenient batch script (Windows)
   start-dev.bat
   
   # Option 2: Manual start
   # Terminal 1 - Backend
   cd backend
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api

### Demo Credentials
- **Admin**: `admin` / `admin123`
- **Operator**: `operator` / `operator123`
- **Viewer**: `viewer` / `viewer123`

## 🏗️ Architecture

### Backend Stack
- **Framework**: NestJS with TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: TypeORM with decorators
- **Authentication**: JWT with role-based access
- **Validation**: Class-validator with DTOs
- **Documentation**: Swagger/OpenAPI

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Heroicons
- **Build Tool**: Create React App

### Key Directories
```
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   ├── database/         # Entities and migrations
│   │   ├── common/           # Shared utilities
│   │   └── main.ts          # Application entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   └── App.tsx          # Main application
│   └── package.json
└── README.md
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#2563eb to #7c3aed)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Neutral**: Gray scale (#f9fafb to #111827)

### Components
- **MetricCard** - Professional dashboard metrics
- **StatusBadge** - Status indicators with icons
- **LoadingSpinner** - Consistent loading states
- **Glass Effects** - Modern backdrop blur effects

### Typography
- **Headings**: Inter font, bold weights
- **Body**: Inter font, regular/medium weights
- **Code**: JetBrains Mono, monospace

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access** - Admin, Operator, Viewer roles
- **Input Validation** - Server-side validation with DTOs
- **CORS Protection** - Configurable cross-origin policies
- **Rate Limiting** - API endpoint protection
- **Secure Headers** - Helmet.js security headers

## 📊 Monitoring & Analytics

- **Real-time Metrics** - Camera status, recording stats
- **System Health** - CPU, memory, storage monitoring
- **User Activity** - Login tracking and session management
- **Error Tracking** - Comprehensive error logging
- **Performance Metrics** - Response times and throughput

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3001
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_WS_URL=http://localhost:3000
REACT_APP_TITLE=StreamPro Platform
```

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Serve the build folder with your preferred web server
```

### Docker Support
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm test
```

## 📚 API Documentation

The API is fully documented with OpenAPI/Swagger:
- **Development**: http://localhost:3000/api
- **Interactive Docs**: Swagger UI with try-it-out functionality
- **Schema Export**: JSON/YAML format available

### Key Endpoints
- `GET /api/v1/cameras` - List all cameras
- `POST /api/v1/cameras` - Add new camera
- `GET /api/v1/dashboard/stats` - Dashboard metrics
- `POST /api/v1/auth/login` - User authentication

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
- **Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Pull Requests**: Submit code changes
- **Wiki**: Access detailed documentation

### Contributors
Thanks to all the amazing contributors who have helped make StreamPro better!

<a href="https://github.com/geniusavinash/StreamPro/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=geniusavinash/StreamPro" />
</a>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/geniusavinash/StreamPro?style=social)
![GitHub forks](https://img.shields.io/github/forks/geniusavinash/StreamPro?style=social)
![GitHub issues](https://img.shields.io/github/issues/geniusavinash/StreamPro)
![GitHub pull requests](https://img.shields.io/github/issues-pr/geniusavinash/StreamPro)

## 🔗 Links

- **🌐 Live Demo**: [Coming Soon]
- **📚 Documentation**: [docs/](docs/)
- **🐛 Bug Reports**: [Issues](https://github.com/geniusavinash/StreamPro/issues)
- **💡 Feature Requests**: [Issues](https://github.com/geniusavinash/StreamPro/issues)
- **💬 Discussions**: [Discussions](https://github.com/geniusavinash/StreamPro/discussions)

## 🙏 Acknowledgments

- **NestJS** - Progressive Node.js framework
- **React** - User interface library
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful hand-crafted SVG icons
- **TypeORM** - Object-relational mapping

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=geniusavinash/StreamPro&type=Date)](https://star-history.com/#geniusavinash/StreamPro&Date)

---

**StreamPro** - Professional Camera Streaming Platform  
Built with ❤️ for the modern web

**[⭐ Star this repository](https://github.com/geniusavinash/StreamPro)** if you find it helpful!

