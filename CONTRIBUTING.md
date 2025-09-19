# Contributing to StreamPro

Thank you for your interest in contributing to StreamPro! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Basic knowledge of TypeScript, React, and NestJS

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/geniusavinash/StreamPro.git
   cd StreamPro
   ```

2. **Install Dependencies**
   ```bash
   # Quick setup with our script
   start-dev.bat
   
   # Or manually
   cd backend && npm install
   cd ../frontend && npm install --legacy-peer-deps
   ```

3. **Start Development**
   ```bash
   # Backend
   cd backend && npm run start:dev
   
   # Frontend (new terminal)
   cd frontend && npm start
   ```

## 🎯 How to Contribute

### 1. **Bug Reports**
- Use GitHub Issues with the "bug" label
- Include steps to reproduce
- Provide system information
- Add screenshots if applicable

### 2. **Feature Requests**
- Use GitHub Issues with the "enhancement" label
- Describe the feature and use case
- Consider implementation complexity

### 3. **Code Contributions**

#### Branch Naming
- `feature/camera-management`
- `bugfix/login-validation`
- `improvement/ui-performance`

#### Commit Messages
```
feat: add camera live streaming functionality
fix: resolve authentication token expiration
docs: update API documentation
style: improve dashboard card layouts
refactor: optimize database queries
test: add unit tests for camera service
```

#### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with proper tests
3. Update documentation if needed
4. Ensure all tests pass
5. Submit PR with clear description

## 🏗️ Project Structure

```
StreamPro/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── database/       # Entities & migrations
│   │   └── common/         # Shared utilities
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Route components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript definitions
└── docs/                  # Documentation
```

## 🎨 Code Style

### TypeScript
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper generic types
- Add JSDoc comments for public APIs

### React
- Use functional components with hooks
- Implement proper error boundaries
- Follow React Query patterns for data fetching
- Use Tailwind CSS for styling

### NestJS
- Use decorators and dependency injection
- Implement proper DTOs for validation
- Use TypeORM for database operations
- Add Swagger documentation

## 🧪 Testing

### Frontend
```bash
cd frontend
npm test                    # Run tests
npm run test:coverage      # Coverage report
```

### Backend
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
```

### Test Guidelines
- Write unit tests for utilities and services
- Add integration tests for API endpoints
- Include component tests for React components
- Maintain >80% code coverage

## 📚 Documentation

### API Documentation
- Use Swagger/OpenAPI decorators
- Include request/response examples
- Document error responses
- Add authentication requirements

### Code Documentation
- Add JSDoc comments for public methods
- Include usage examples
- Document complex algorithms
- Explain business logic

## 🔒 Security

### Reporting Security Issues
- Email security issues privately
- Do not create public GitHub issues
- Allow time for fixes before disclosure

### Security Guidelines
- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines

## 🎯 Performance

### Frontend Performance
- Optimize bundle size
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets

### Backend Performance
- Use database indexes
- Implement caching strategies
- Optimize query performance
- Monitor memory usage

## 📋 Review Process

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

### Review Timeline
- Initial review: 2-3 business days
- Follow-up reviews: 1-2 business days
- Merge after approval from maintainers

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

## 📞 Getting Help

- **GitHub Discussions**: General questions
- **GitHub Issues**: Bug reports and features
- **Discord**: Real-time chat (link in README)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to StreamPro! 🎉