# QRIS Classifier API - Integration Guide

Panduan teknis untuk integrasi QRIS Classifier API ke dalam aplikasi Anda.

## Quick Start

### 1. Dapatkan Kredensial

Hubungi administrator untuk mendapatkan:
- Email dan password akun
- API Key (opsional)
- Rate limit allocation

### 2. Base URL

```
Production: https://merchant-classifier-api.hoople.co.id
```

### 3. Authentication

#### Option A: JWT Token
```bash
# Login
curl -X POST "https://merchant-classifier-api.hoople.co.id/api/auth?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" ...
```

#### Option B: API Key
```bash
curl -H "X-API-Key: YOUR_API_KEY" ...
```

### 4. Classify Image

```bash
curl -X POST "https://merchant-classifier-api.hoople.co.id/api/classify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQ..."
    },
    "metadata": {
      "requestId": "req_123",
      "clientVersion": "1.0.0"
    }
  }'
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth?action=login` | Login untuk mendapatkan JWT token |
| GET | `/api/auth` | Get user info |
| GET | `/api/auth/verify` | Verify token validity |

### Classification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/classify` | Classify QRIS images |

## Request/Response Examples

### Login Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login Response

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
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Classification Request

#### Basic Request
```json
{
  "images": {
    "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "image2": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  },
  "metadata": {
    "requestId": "req_1234567890",
    "clientVersion": "1.0.0"
  }
}
```

#### Request with Business Name Comparison
```json
{
  "images": {
    "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  },
  "businessName": "Warung Makan Sederhana",
  "metadata": {
    "requestId": "req_1234567891",
    "clientVersion": "1.0.0"
  }
}
```

### Classification Response

#### Basic Response
```json
{
  "success": true,
  "data": {
    "businessType": "restaurant",
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

#### Response with Business Name Comparison
```json
{
  "success": true,
  "data": {
    "businessType": "restaurant",
    "requestId": "req_1234567891",
    "processedAt": "2024-01-15T10:30:00.000Z",
    "comparison": {
      "userBusinessName": "Warung Makan Sederhana",
      "isMatch": true,
      "matchScore": 0.85,
      "matchReason": "Business name contains 'warung' which matches restaurant category"
    }
  },
  "rateLimit": {
    "remaining": 98,
    "resetTime": 1640995200,
    "limit": 100
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
interface QRISClassifierConfig {
  baseUrl: string;
  apiKey?: string;
}

interface ClassificationResult {
  businessType: string;
  requestId?: string;
  processedAt: string;
  comparison?: {
    userBusinessName?: string;
    isMatch: boolean;
    matchScore: number;
    matchReason: string;
  };
}

interface ClassificationRequest {
  images: Record<string, string>;
  businessName?: string;
  metadata?: {
    requestId?: string;
    clientVersion?: string;
    timestamp?: string;
  };
}

class QRISClassifier {
  private baseUrl: string;
  private apiKey?: string;
  private token?: string;

  constructor(config: QRISClassifierConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async login(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/auth?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error.message);
    }

    this.token = data.data.token;
  }

  async classify(request: ClassificationRequest): Promise<ClassificationResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else {
      throw new Error('No authentication method available');
    }

    const requestBody = {
      images: request.images,
      ...(request.businessName && { businessName: request.businessName }),
      metadata: {
        requestId: request.metadata?.requestId || `req_${Date.now()}`,
        clientVersion: request.metadata?.clientVersion || '1.0.0',
        ...request.metadata
      }
    };

    const response = await fetch(`${this.baseUrl}/api/classify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  }

  // Helper method to convert File to base64
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }
}

// Usage
const classifier = new QRISClassifier({
  baseUrl: 'https://merchant-classifier-api.hoople.co.id'
});

// Login method
await classifier.login('user@example.com', 'password123');

// Or use API key
const classifierWithApiKey = new QRISClassifier({
  baseUrl: 'https://merchant-classifier-api.hoople.co.id',
  apiKey: 'your-api-key'
});

// Classify images
const results = await classifier.classify({
  image1: 'data:image/jpeg;base64,...',
  image2: 'data:image/jpeg;base64,...'
});

console.log(results.image1.businessType); // 'restaurant'
console.log(results.image1.confidence);   // 0.95
```

### Python

```python
import requests
import base64
from typing import Dict, Optional, Any

class QRISClassifier:
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.token = None

    def login(self, email: str, password: str) -> None:
        response = requests.post(
            f"{self.base_url}/api/auth?action=login",
            json={"email": email, "password": password}
        )
        
        data = response.json()
        if not data["success"]:
            raise Exception(data["error"]["message"])
        
        self.token = data["data"]["token"]

    def classify(self, images: Dict[str, str]) -> Dict[str, Any]:
        headers = {"Content-Type": "application/json"}
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key
        else:
            raise Exception("No authentication method available")

        payload = {
            "images": images,
            "metadata": {
                "requestId": f"req_{int(time.time())}",
                "clientVersion": "1.0.0"
            }
        }

        response = requests.post(
            f"{self.base_url}/api/classify",
            json=payload,
            headers=headers
        )
        
        data = response.json()
        if not data["success"]:
            raise Exception(data["error"]["message"])
        
        return data["data"]["results"]

    @staticmethod
    def image_to_base64(image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            encoded = base64.b64encode(image_file.read()).decode('utf-8')
            return f"data:image/jpeg;base64,{encoded}"

# Usage
classifier = QRISClassifier("https://merchant-classifier-api.hoople.co.id")

# Login method
classifier.login("user@example.com", "password123")

# Or use API key
classifier_with_key = QRISClassifier(
    "https://merchant-classifier-api.hoople.co.id", 
    api_key="your-api-key"
)

# Classify images
images = {
    "image1": QRISClassifier.image_to_base64("path/to/qris1.jpg"),
    "image2": QRISClassifier.image_to_base64("path/to/qris2.jpg")
}

results = classifier.classify(images)
print(f"Image 1: {results['image1']['businessType']} ({results['image1']['confidence']})")
print(f"Image 2: {results['image2']['businessType']} ({results['image2']['confidence']})")
```

### PHP

```php
<?php

class QRISClassifier {
    private $baseUrl;
    private $apiKey;
    private $token;

    public function __construct($baseUrl, $apiKey = null) {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
    }

    public function login($email, $password) {
        $response = $this->makeRequest('POST', '/api/auth?action=login', [
            'email' => $email,
            'password' => $password
        ]);

        if (!$response['success']) {
            throw new Exception($response['error']['message']);
        }

        $this->token = $response['data']['token'];
    }

    public function classify($images) {
        $headers = [];
        
        if ($this->token) {
            $headers['Authorization'] = 'Bearer ' . $this->token;
        } elseif ($this->apiKey) {
            $headers['X-API-Key'] = $this->apiKey;
        } else {
            throw new Exception('No authentication method available');
        }

        $payload = [
            'images' => $images,
            'metadata' => [
                'requestId' => 'req_' . time(),
                'clientVersion' => '1.0.0'
            ]
        ];

        $response = $this->makeRequest('POST', '/api/classify', $payload, $headers);
        
        if (!$response['success']) {
            throw new Exception($response['error']['message']);
        }

        return $response['data']['results'];
    }

    public static function imageToBase64($imagePath) {
        $imageData = file_get_contents($imagePath);
        $base64 = base64_encode($imageData);
        return 'data:image/jpeg;base64,' . $base64;
    }

    private function makeRequest($method, $endpoint, $data = null, $headers = []) {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        $defaultHeaders = ['Content-Type: application/json'];
        foreach ($headers as $key => $value) {
            $defaultHeaders[] = $key . ': ' . $value;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $defaultHeaders);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}

// Usage
$classifier = new QRISClassifier('https://merchant-classifier-api.hoople.co.id');

// Login method
$classifier->login('user@example.com', 'password123');

// Or use API key
$classifierWithKey = new QRISClassifier('https://merchant-classifier-api.hoople.co.id', 'your-api-key');

// Classify images
$images = [
    'image1' => QRISClassifier::imageToBase64('path/to/qris1.jpg'),
    'image2' => QRISClassifier::imageToBase64('path/to/qris2.jpg')
];

$results = $classifier->classify($images);
echo "Image 1: " . $results['image1']['businessType'] . " (" . $results['image1']['confidence'] . ")\n";
echo "Image 2: " . $results['image2']['businessType'] . " (" . $results['image2']['confidence'] . ")\n";

?>
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Common Error Codes

- `INVALID_CREDENTIALS`: Email atau password salah
- `TOKEN_EXPIRED`: JWT token sudah expired
- `RATE_LIMIT_EXCEEDED`: Melebihi batas penggunaan
- `INVALID_REQUEST_BODY`: Format request tidak valid
- `INSUFFICIENT_PERMISSIONS`: Tidak memiliki akses

## Rate Limiting

- Default: 100 requests per hour per user
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Implement exponential backoff untuk retry logic

## Best Practices

### 1. Authentication
- Gunakan JWT token untuk aplikasi web/mobile
- Gunakan API key untuk server-to-server integration
- Simpan credentials dengan aman (environment variables)
- Implement token refresh logic

### 2. Error Handling
- Selalu cek `success` field dalam response
- Implement retry logic untuk rate limit errors
- Log error details untuk debugging

### 3. Performance
- Batch multiple images dalam satu request
- Compress images sebelum convert ke base64
- Cache results jika memungkinkan
- Monitor rate limit usage

### 4. Security
- Jangan hardcode credentials dalam kode
- Gunakan HTTPS untuk semua requests
- Validate dan sanitize input
- Implement proper logging

## Testing

### Postman Collections

Gunakan Postman collections yang tersedia:
- `QRIS_Classifier_User_API.postman_collection.json`
- `QRIS_Classifier_Admin_API.postman_collection.json`

### Environment Variables

```json
{
  "base_url": "https://merchant-classifier-api.hoople.co.id",
  "jwt_token": "",
  "api_key": "your-api-key",
  "user_email": "user@example.com",
  "user_password": "password123"
}
```

## Support

Untuk bantuan teknis:
1. Cek dokumentasi dan FAQ
2. Test dengan Postman collections
3. Hubungi administrator dengan detail error

---

*Dokumentasi ini diupdate secara berkala. Pastikan menggunakan versi terbaru.*