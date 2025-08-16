# QRIS Classifier API Service

A secure, production-ready REST API service for classifying business types from QRIS (Quick Response Code Indonesian Standard) images using AI. Built with Next.js, TypeScript, and Google's Gemini AI.

## 🚀 Features

- **AI-Powered Classification**: Uses Google's Gemini 2.0 Flash model for accurate business type classification
- **Secure Authentication**: JWT tokens and API key authentication
- **Rate Limiting**: Configurable rate limits per user and global limits
- **Input Validation**: Comprehensive validation for images and requests
- **Security Headers**: CORS, CSP, XSS protection, and more
- **Admin Dashboard**: Complete admin interface for user and system management
- **Comprehensive Logging**: Request logging, error tracking, and security event monitoring
- **Production Ready**: Built with security and scalability in mind

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Security Features](#security-features)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qris-classifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
   GOOGLE_GENAI_API_KEY=your-google-ai-api-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Get your admin API key**
   Check the console output for the admin API key that's generated on startup.

6. **Test the API**
   ```bash
   curl -X GET "http://localhost:9002/api/classify" \
     -H "X-API-Key: your-admin-api-key"
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | - | ✅ |
| `GOOGLE_GENAI_API_KEY` | Google AI API key | - | ✅ |
| `PORT` | Server port | `9002` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `CORS_ORIGINS` | Allowed CORS origins | `*` | ❌ |
| `MAX_REQUEST_SIZE` | Maximum request size | `10mb` | ❌ |
| `GLOBAL_RATE_LIMIT` | Global rate limit per hour | `10` | ❌ |
| `DEFAULT_USER_RATE_LIMIT` | Default user rate limit | `100` | ❌ |
| `ADMIN_RATE_LIMIT` | Admin rate limit | `1000` | ❌ |
| `LOG_LEVEL` | Logging level | `info` | ❌ |
| `MAX_LOG_ENTRIES` | Maximum log entries to keep | `1000` | ❌ |
| `MAX_IMAGE_SIZE` | Maximum image size | `5242880` | ❌ |
| `SUPPORTED_IMAGE_TYPES` | Supported image MIME types | `image/jpeg,image/png,image/gif,image/webp` | ❌ |

### Getting Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select an existing one
3. Generate an API key
4. Add the API key to your `.env` file

## 🔐 Authentication

The API supports two authentication methods:

### 1. API Key Authentication (Recommended)

```bash
curl -H "X-API-Key: qris_your_api_key_here" \
  http://localhost:9002/api/classify
```

### 2. JWT Token Authentication

```bash
# Login to get token
curl -X POST "http://localhost:9002/api/auth?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Use token
curl -H "Authorization: Bearer your_jwt_token" \
  http://localhost:9002/api/classify
```

## 🛡️ Security Features

- **Authentication**: JWT tokens and API keys
- **Authorization**: Role-based access control (admin/user)
- **Rate Limiting**: Per-user and global rate limits
- **Input Validation**: Zod schema validation for all inputs
- **Security Headers**: 
  - CORS with configurable origins
  - Content Security Policy (CSP)
  - X-XSS-Protection
  - X-Content-Type-Options
  - X-Frame-Options
  - Strict-Transport-Security
- **Request Size Limits**: Configurable maximum request size
- **Image Validation**: Format, size, and content validation
- **Logging**: Comprehensive request and security event logging

## 📚 API Documentation

Detailed API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Quick API Reference

#### Classification Endpoint

```bash
POST /api/classify
```

**Request:**
```json
{
  "images": {
    "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "image2": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "metadata": {
    "requestId": "req_123456789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "businessType": "Restaurant",
    "requestId": "req_123456789",
    "processedAt": "2024-01-01T12:00:05Z"
  },
  "rateLimit": {
    "remaining": 99,
    "resetTime": 1640995200,
    "limit": 100
  }
}
```

#### Admin Dashboard

```bash
GET /api/admin?action=dashboard
```

Access comprehensive admin features including:
- User management
- System statistics
- Log monitoring
- Health checks
- Rate limit management

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/          # Admin dashboard endpoints
│   │   ├── api-keys/       # API key management
│   │   ├── auth/           # Authentication endpoints
│   │   └── classify/       # Main classification endpoint
│   └── page.tsx            # Frontend UI (optional)
├── ai/
│   ├── flows/
│   │   └── classify-business-type.ts  # AI classification logic
│   ├── genkit.ts           # Genkit configuration
│   └── dev.ts              # Development setup
└── lib/
    ├── auth.ts             # Authentication utilities
    ├── logger.ts           # Logging and error handling
    ├── rate-limiter.ts     # Rate limiting logic
    └── security.ts         # Security middleware
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run genkit:dev   # Start Genkit development server
npm run genkit:watch # Watch Genkit flows

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Adding New Features

1. **New API Endpoints**: Add routes in `src/app/api/`
2. **Authentication**: Extend `src/lib/auth.ts`
3. **Security**: Update `src/lib/security.ts`
4. **Logging**: Use the logger from `src/lib/logger.ts`
5. **AI Flows**: Add new flows in `src/ai/flows/`

### Testing

```bash
# Test classification endpoint
curl -X POST "http://localhost:9002/api/classify" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    },
    "metadata": {
      "requestId": "test_123"
    }
  }'

# Test health check
curl -X GET "http://localhost:9002/api/classify" \
  -H "X-API-Key: your-api-key"

# Test admin dashboard
curl -X GET "http://localhost:9002/api/admin?action=dashboard" \
  -H "X-API-Key: your-admin-api-key"
```

## 🚀 Production Deployment

### Environment Setup

1. **Set production environment**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secure-production-jwt-secret
   CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Start the production server**
   ```bash
   npm run start
   ```

### Production Considerations

#### Security
- Use HTTPS in production
- Set strong, unique JWT secrets
- Configure proper CORS origins
- Use environment-specific API keys
- Set up proper firewall rules

#### Scalability
- Consider using Redis for rate limiting
- Implement proper database for user storage
- Set up load balancing for multiple instances
- Use CDN for static assets

#### Monitoring
- Set up application monitoring (e.g., New Relic, DataDog)
- Configure log aggregation (e.g., ELK stack)
- Set up health checks and alerts
- Monitor API usage and rate limits

#### Performance
- Enable gzip compression
- Optimize image processing
- Implement caching strategies
- Monitor memory usage and optimize

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 9002

CMD ["npm", "run", "start"]
```

Build and run:

```bash
docker build -t qris-classifier .
docker run -p 9002:9002 --env-file .env qris-classifier
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add proper error handling
- Include comprehensive logging
- Update documentation for new features
- Test all endpoints thoroughly
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

1. **"Command not found" errors**: Run `npm install` to install dependencies
2. **Authentication failures**: Check your JWT_SECRET and API keys
3. **Rate limit exceeded**: Check your rate limit settings and usage
4. **Image upload failures**: Verify image format and size limits
5. **CORS errors**: Configure CORS_ORIGINS for your domain

### Getting Help

1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the logs via the admin dashboard
3. Verify your environment configuration
4. Check the console output for error messages

### Troubleshooting

```bash
# Check service health
curl -X GET "http://localhost:9002/api/admin?action=health" \
  -H "X-API-Key: your-admin-api-key"

# View recent logs
curl -X GET "http://localhost:9002/api/admin?action=logs&level=error&limit=10" \
  -H "X-API-Key: your-admin-api-key"

# Check system stats
curl -X GET "http://localhost:9002/api/admin?action=stats" \
  -H "X-API-Key: your-admin-api-key"
```

---

**Built with ❤️ using Next.js, TypeScript, and Google AI**
