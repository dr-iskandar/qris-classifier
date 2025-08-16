# QRIS Classifier API Documentation

A secure REST API service for classifying business types from QRIS (Quick Response Code Indonesian Standard) images using AI.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [SDKs and Integration](#sdks-and-integration)

## Authentication

The API supports two authentication methods:

### 1. JWT Token Authentication

```http
Authorization: Bearer <jwt_token>
```

### 2. API Key Authentication

```http
X-API-Key: <api_key>
```

## Rate Limiting

- **Unauthenticated requests**: 10 requests per hour
- **Regular users**: 100 requests per hour (configurable)
- **Admin users**: 1000 requests per hour (configurable)

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Security Features

- JWT token-based authentication
- API key management
- Rate limiting per user
- CORS protection
- Input validation and sanitization
- Security headers (CSP, XSS protection, etc.)
- Request size limits
- Image format validation
- Comprehensive logging and monitoring

## API Endpoints

### Classification

#### POST /api/classify

Classify business type from uploaded images.

**Request:**

```json
{
  "images": {
    "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "image2": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "image3": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  },
  "metadata": {
    "requestId": "req_123456789",
    "clientVersion": "1.0.0",
    "timestamp": "2024-01-01T12:00:00Z"
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

**Requirements:**
- 1-5 images required
- Images must be base64-encoded with data URI format
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum 5MB per image
- Authentication required

#### GET /api/classify

Health check endpoint for the classification service.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "rateLimit": 100
  }
}
```

### Authentication

#### POST /api/auth?action=login

Authenticate user and get JWT token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "role": "user",
      "rateLimit": 100
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### POST /api/auth?action=create-user

Create a new user (admin only).

**Request:**

```json
{
  "email": "newuser@example.com",
  "role": "user",
  "rateLimit": 100
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_xyz789",
      "email": "newuser@example.com",
      "role": "user",
      "rateLimit": 100,
      "apiKey": "qris_abc123def456ghi789"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### GET /api/auth

Get current user information.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "role": "user",
      "rateLimit": 100,
      "isActive": true
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### PUT /api/auth

Update user information.

**Request:**

```json
{
  "userId": "user_abc123",
  "email": "newemail@example.com",
  "rateLimit": 200
}
```

#### DELETE /api/auth?userId=user_abc123

Delete user (admin only).

### API Key Management

#### GET /api/api-keys

Get current user's API key information.

**Response:**

```json
{
  "success": true,
  "data": {
    "apiKey": "qris_abc123def456ghi789",
    "apiKeyPrefix": "qris_abc123...",
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "role": "user",
      "rateLimit": 100,
      "isActive": true
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### GET /api/api-keys?action=list

List all users and their API key info (admin only).

#### POST /api/api-keys

Regenerate API key.

**Request:**

```json
{
  "userId": "user_abc123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "API key regenerated successfully",
    "apiKey": "qris_new123key456here789",
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "role": "user"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Admin Dashboard

#### GET /api/admin?action=dashboard

Get dashboard overview (admin only).

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 25,
      "activeUsers": 23,
      "adminUsers": 2,
      "totalRequests": 1500,
      "errorRate": 0.02,
      "uptime": 86400
    },
    "recentActivity": {
      "recentErrors": [],
      "recentLogs": []
    },
    "systemInfo": {
      "nodeVersion": "v18.17.0",
      "platform": "darwin",
      "memoryUsage": {
        "rss": 45678912,
        "heapTotal": 12345678,
        "heapUsed": 8765432
      },
      "environment": "development"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### GET /api/admin?action=users

Get all users information (admin only).

#### GET /api/admin?action=logs&level=error&limit=50

Get system logs (admin only).

#### GET /api/admin?action=stats

Get detailed statistics (admin only).

#### GET /api/admin?action=health

Get system health status (admin only).

#### POST /api/admin?action=clear-logs

Clear system logs (admin only).

#### POST /api/admin?action=cleanup-rate-limits

Cleanup expired rate limit entries (admin only).

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` (401): Valid authentication required
- `INSUFFICIENT_PERMISSIONS` (403): Admin access required
- `INVALID_REQUEST_BODY` (400): Invalid request format
- `INVALID_IMAGE_FORMAT` (400): Invalid image format
- `IMAGE_TOO_LARGE` (400): Image exceeds size limit
- `RATE_LIMIT_EXCEEDED` (429): Rate limit exceeded
- `REQUEST_TOO_LARGE` (413): Request size exceeds limit
- `INVALID_CONTENT_TYPE` (415): Invalid content type
- `USER_NOT_FOUND` (404): User not found
- `USER_ALREADY_EXISTS` (409): User already exists
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error

## Examples

### Node.js Example

```javascript
const axios = require('axios');
const fs = require('fs');

// Convert image to base64
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const mimeType = 'image/jpeg'; // Adjust based on your image
  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
}

// Classify business type
async function classifyBusiness(apiKey, imagePaths) {
  const images = {};
  imagePaths.forEach((path, index) => {
    images[`image${index + 1}`] = imageToBase64(path);
  });

  try {
    const response = await axios.post('http://localhost:9002/api/classify', {
      images,
      metadata: {
        requestId: `req_${Date.now()}`,
        clientVersion: '1.0.0'
      }
    }, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Business Type:', response.data.data.businessType);
    console.log('Rate Limit Remaining:', response.data.rateLimit.remaining);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage
classifyBusiness('qris_your_api_key_here', [
  './image1.jpg',
  './image2.jpg',
  './image3.jpg'
]);
```

### Python Example

```python
import requests
import base64
import json
from typing import List

def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 data URI."""
    with open(image_path, 'rb') as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded_string}"

def classify_business(api_key: str, image_paths: List[str]) -> dict:
    """Classify business type from images."""
    images = {}
    for i, path in enumerate(image_paths[:5]):  # Max 5 images
        images[f"image{i+1}"] = image_to_base64(path)
    
    payload = {
        "images": images,
        "metadata": {
            "requestId": f"req_{int(time.time())}",
            "clientVersion": "1.0.0"
        }
    }
    
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            "http://localhost:9002/api/classify",
            json=payload,
            headers=headers
        )
        response.raise_for_status()
        
        result = response.json()
        print(f"Business Type: {result['data']['businessType']}")
        print(f"Rate Limit Remaining: {result['rateLimit']['remaining']}")
        
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None

# Usage
if __name__ == "__main__":
    import time
    
    api_key = "qris_your_api_key_here"
    image_paths = ["image1.jpg", "image2.jpg", "image3.jpg"]
    
    result = classify_business(api_key, image_paths)
```

### cURL Example

```bash
# Get API key info
curl -X GET "http://localhost:9002/api/api-keys" \
  -H "X-API-Key: qris_your_api_key_here"

# Classify business type
curl -X POST "http://localhost:9002/api/classify" \
  -H "X-API-Key: qris_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    },
    "metadata": {
      "requestId": "req_123456789"
    }
  }'
```

## SDKs and Integration

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure your environment variables:
   ```bash
   JWT_SECRET=your-super-secret-jwt-key
   GOOGLE_GENAI_API_KEY=your-google-ai-api-key
   ```

3. Start the service:
   ```bash
   npm install
   npm run dev
   ```

### Default Admin Access

The service creates a default admin user on startup:
- Check the console logs for the admin API key
- Use this API key to create additional users
- Admin users can access all endpoints and manage other users

### Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, random JWT secret
3. Configure proper CORS origins
4. Set up proper logging and monitoring
5. Consider using Redis for rate limiting in production
6. Use a proper database instead of in-memory storage
7. Set up HTTPS with proper SSL certificates

### Security Best Practices

1. **API Keys**: Store API keys securely, never expose them in client-side code
2. **Rate Limiting**: Monitor and adjust rate limits based on usage patterns
3. **Input Validation**: Always validate and sanitize input data
4. **Logging**: Monitor logs for suspicious activity
5. **Updates**: Keep dependencies updated and monitor for security vulnerabilities
6. **Network**: Use HTTPS in production and restrict network access
7. **Monitoring**: Set up proper monitoring and alerting for the service

## Support

For issues and questions:
1. Check the logs via the admin dashboard
2. Review the error codes and messages
3. Ensure proper authentication and rate limits
4. Verify image formats and sizes
5. Check network connectivity and CORS settings