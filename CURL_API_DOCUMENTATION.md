# QRIS Classifier API - cURL Documentation

This document provides cURL examples for all API endpoints that can be easily imported into Postman or used directly in terminal.

## Base URL
```
http://localhost:9002
```

## Authentication

The API uses JWT tokens for authentication. First, obtain a token by logging in:

### 1. Login (Get Authentication Token)

```bash
curl -X POST "http://localhost:9002/api/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@qris-classifier.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin-001",
      "email": "admin@qris-classifier.com",
      "role": "admin",
      "rateLimit": 1000
    }
  }
}
```

## API Endpoints

### Authentication Endpoints

#### Get Current User Info
```bash
curl -X GET "http://localhost:9002/api/auth" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create New User (Admin Only)
```bash
curl -X POST "http://localhost:9002/api/auth?action=create-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "role": "user",
    "rateLimit": 100
  }'
```

#### Update User (Admin Only)
```bash
curl -X PUT "http://localhost:9002/api/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user_123",
    "email": "updated@example.com",
    "role": "admin",
    "rateLimit": 500,
    "isActive": true
  }'
```

#### Delete User (Admin Only)
```bash
curl -X DELETE "http://localhost:9002/api/auth?userId=user_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Key Management

#### List All API Keys (Admin Only)
```bash
curl -X GET "http://localhost:9002/api/api-keys?action=list" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Current User's API Key Info
```bash
curl -X GET "http://localhost:9002/api/api-keys" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create New API Key (Admin Only)
```bash
curl -X POST "http://localhost:9002/api/api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "apiuser@example.com",
    "role": "user",
    "rateLimit": 100
  }'
```

#### Regenerate API Key
```bash
curl -X POST "http://localhost:9002/api/api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user_123"
  }'
```

#### Delete API Key (Admin Only)
```bash
curl -X DELETE "http://localhost:9002/api/api-keys?userId=user_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Token Verification

#### Verify JWT Token
```bash
curl -X GET "http://localhost:9002/api/auth/verify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```bash
curl -X POST "http://localhost:9002/api/auth/verify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin Login (Alternative)

#### Admin Login Endpoint
```bash
curl -X POST "http://localhost:9002/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@qris-classifier.com",
    "password": "admin123"
  }'
```

## Using API Keys for Authentication

Instead of JWT tokens, you can also use API keys directly:

```bash
curl -X GET "http://localhost:9002/api/auth" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Postman Import Instructions

## QRIS Image Classification

### Classify Business Type (Single Image)
```bash
curl -X POST "http://localhost:9002/api/classify" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    },
    "metadata": {
      "requestId": "req_1234567890",
      "clientVersion": "1.0.0"
    }
  }'
```

### Classify Business Type (Multiple Images)
```bash
curl -X POST "http://localhost:9002/api/classify" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "image2": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      "image3": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    },
    "metadata": {
      "requestId": "req_1234567890",
      "clientVersion": "1.0.0"
    }
  }'
```

### Classify with JWT Token
```bash
curl -X POST "http://localhost:9002/api/classify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    },
    "metadata": {
      "requestId": "req_1234567890",
      "clientVersion": "1.0.0"
    }
  }'
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "businessType": "Toko Sepatu",
    "confidence": 0.95,
    "requestId": "req_1234567890",
    "processedAt": "2024-01-15T10:30:00.000Z"
  },
  "rateLimit": {
    "remaining": 99,
    "resetTime": 1640995200,
    "limit": 100
  }
}
```

## Image Format Requirements

- **Supported formats**: JPEG, PNG, GIF, WebP
- **Maximum size**: 5MB per image
- **Maximum images**: 5 images per request
- **Format**: Base64-encoded data URI (e.g., `data:image/jpeg;base64,<encoded_data>`)
- **Minimum images**: At least 1 image required

## Postman Import Instructions

### Method 1: Manual Import
1. Open Postman
2. Click "Import" button
3. Select "Raw text" tab
4. Copy and paste any of the cURL commands above
5. Click "Continue" and then "Import"

### Method 2: Collection Import
1. Create a new collection in Postman
2. Add each endpoint as a new request
3. Set up environment variables:
   - `base_url`: `http://localhost:9002`
   - `jwt_token`: Your JWT token from login
   - `api_key`: Your API key

### Environment Variables for Postman

Create these variables in your Postman environment:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:9002` | `http://localhost:9002` |
| `jwt_token` | | (Set after login) |
| `api_key` | | (Set after getting API key) |

Then use `{{base_url}}`, `{{jwt_token}}`, and `{{api_key}}` in your requests.

## Example Workflow

1. **Login to get JWT token:**
   ```bash
   curl -X POST "http://localhost:9002/api/auth" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@qris-classifier.com", "password": "admin123"}'
   ```

2. **Extract token from response and set as variable:**
   ```bash
   TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

3. **List all API keys:**
   ```bash
   curl -X GET "http://localhost:9002/api/api-keys?action=list" \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Create new API key:**
   ```bash
   curl -X POST "http://localhost:9002/api/api-keys" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"email": "test@example.com", "role": "user", "rateLimit": 100}'
   ```

5. **Classify QRIS images:**
   ```bash
   curl -X POST "http://localhost:9002/api/classify" \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"images": {"image1": "data:image/jpeg;base64,..."}, "metadata": {"requestId": "req_123"}}'
   ```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2025-08-16T16:39:02.508Z"
  }
}
```

## Common Error Codes

- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS`: User doesn't have required permissions
- `USER_NOT_FOUND`: Requested user doesn't exist
- `USER_ALREADY_EXISTS`: Email already in use
- `INVALID_REQUEST_BODY`: Request body validation failed
- `INVALID_CREDENTIALS`: Login credentials are incorrect
- `INTERNAL_SERVER_ERROR`: Server error occurred

## Rate Limiting

API requests are rate-limited based on user's `rateLimit` setting:
- Default users: 100 requests per hour
- Admin users: 1000 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when rate limit resets