# QRIS Classifier API - User Guide

Panduan lengkap untuk menggunakan QRIS Classifier API sebagai user/client.

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Cara Mendapatkan Akses](#cara-mendapatkan-akses)
3. [Authentication](#authentication)
4. [Menggunakan API](#menggunakan-api)
5. [Rate Limiting](#rate-limiting)
6. [Error Handling](#error-handling)
7. [Contoh Implementasi](#contoh-implementasi)
8. [FAQ](#faq)

## Pendahuluan

QRIS Classifier API adalah service untuk mengklasifikasikan jenis bisnis berdasarkan gambar QRIS. API ini menggunakan AI untuk menganalisis gambar dan memberikan prediksi kategori bisnis.

### Base URL
```
Production: https://merchant-classifier-api.hoople.co.id
```

## Cara Mendapatkan Akses

### 1. Hubungi Administrator

Untuk mendapatkan akses ke QRIS Classifier API:

1. **Hubungi admin** untuk meminta pembuatan akun
2. **Berikan informasi**:
   - Email address yang akan digunakan
   - Estimasi penggunaan per bulan
   - Tujuan penggunaan API

3. **Admin akan memberikan**:
   - Email akun yang telah dibuat
   - Password default
   - API Key (opsional)
   - Rate limit yang diberikan

### 2. Aktivasi Akun

Setelah menerima kredensial dari admin:

1. Login menggunakan email dan password yang diberikan
2. Ganti password jika diperlukan
3. Simpan JWT token atau API key untuk penggunaan

## Authentication

### Metode 1: JWT Token (Recommended)

#### Login untuk Mendapatkan Token

```bash
curl -X POST "https://merchant-classifier-api.hoople.co.id/api/auth?action=login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_abc123",
      "email": "your-email@example.com",
      "role": "user",
      "rateLimit": 100
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Menggunakan JWT Token

```bash
curl -X POST "https://merchant-classifier-api.hoople.co.id/api/classify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Catatan:** JWT Token berlaku selama 24 jam, setelah itu perlu login ulang.

### Metode 2: API Key

Jika admin memberikan API Key, Anda dapat menggunakannya langsung:

```bash
curl -X POST "https://merchant-classifier-api.hoople.co.id/api/classify" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Keuntungan API Key:**
- Tidak perlu login berulang
- Tidak ada expiry time
- Lebih cocok untuk integrasi sistem

## Menggunakan API

### 1. Klasifikasi Gambar Tunggal

```bash
curl -X POST "https://merchant-classifier-api.hoople.co.id/api/classify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    },
    "metadata": {
      "requestId": "req_1234567890",
      "clientVersion": "1.0.0"
    }
  }'
```

### 2. Klasifikasi Multiple Gambar

```bash
curl -X POST "https://merchant-classifier-api.hoople.co.id/api/classify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "image1": "data:image/jpeg;base64,/9j/4AAQ...",
      "image2": "data:image/jpeg;base64,/9j/4AAQ...",
      "image3": "data:image/jpeg;base64,/9j/4AAQ..."
    },
    "metadata": {
      "requestId": "req_1234567891",
      "clientVersion": "1.0.0"
    }
  }'
```

### Response Format

```json
{
  "success": true,
  "data": {
    "results": {
      "image1": {
        "businessType": "restaurant",
        "confidence": 0.95,
        "alternatives": [
          { "type": "cafe", "confidence": 0.85 },
          { "type": "food_truck", "confidence": 0.75 }
        ]
      }
    },
    "metadata": {
      "requestId": "req_1234567890",
      "processedAt": "2024-01-15T10:30:00.000Z",
      "processingTime": "1.2s"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Cek Informasi User

```bash
curl -X GET "https://merchant-classifier-api.hoople.co.id/api/auth" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Verify Token

```bash
curl -X GET "https://merchant-classifier-api.hoople.co.id/api/auth/verify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Rate Limiting

### Batas Penggunaan

- **Default User**: 100 requests per jam
- **Custom Limit**: Sesuai yang diberikan admin
- **Rate limit** dihitung per user, bukan per IP

### Response Headers

Setiap response akan menyertakan informasi rate limit:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

### Rate Limit Exceeded

Jika melebihi batas:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "retryAfter": 3600
  }
}
```

## Error Handling

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email atau password salah |
| `TOKEN_EXPIRED` | 401 | JWT token sudah expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | Tidak memiliki akses |
| `RATE_LIMIT_EXCEEDED` | 429 | Melebihi batas penggunaan |
| `INVALID_REQUEST_BODY` | 400 | Format request tidak valid |
| `INTERNAL_SERVER_ERROR` | 500 | Error server internal |

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

## Contoh Implementasi

### JavaScript/Node.js

```javascript
class QRISClassifierClient {
  constructor(baseUrl, apiKey = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.token = null;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      return data.data.user;
    }
    throw new Error(data.error.message);
  }

  async classifyImage(imageBase64, requestId = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else {
      throw new Error('No authentication method available');
    }

    const response = await fetch(`${this.baseUrl}/api/classify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        images: {
          image1: imageBase64
        },
        metadata: {
          requestId: requestId || `req_${Date.now()}`,
          clientVersion: '1.0.0'
        }
      })
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error.message);
  }
}

// Usage
const client = new QRISClassifierClient('https://merchant-classifier-api.hoople.co.id');

// Login method
try {
  await client.login('user@example.com', 'password123');
  const result = await client.classifyImage('data:image/jpeg;base64,...');
  console.log('Classification result:', result);
} catch (error) {
  console.error('Error:', error.message);
}

// API Key method
const clientWithApiKey = new QRISClassifierClient('https://merchant-classifier-api.hoople.co.id', 'your-api-key');
try {
  const result = await clientWithApiKey.classifyImage('data:image/jpeg;base64,...');
  console.log('Classification result:', result);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Python

```python
import requests
import base64
import json
from typing import Optional, Dict, Any

class QRISClassifierClient:
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.token = None

    def login(self, email: str, password: str) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/auth?action=login",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        
        data = response.json()
        if data["success"]:
            self.token = data["data"]["token"]
            return data["data"]["user"]
        else:
            raise Exception(data["error"]["message"])

    def classify_image(self, image_base64: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        headers = {"Content-Type": "application/json"}
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key
        else:
            raise Exception("No authentication method available")

        payload = {
            "images": {
                "image1": image_base64
            },
            "metadata": {
                "requestId": request_id or f"req_{int(time.time())}",
                "clientVersion": "1.0.0"
            }
        }

        response = requests.post(
            f"{self.base_url}/api/classify",
            json=payload,
            headers=headers
        )
        
        data = response.json()
        if data["success"]:
            return data["data"]
        else:
            raise Exception(data["error"]["message"])

    def image_to_base64(self, image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return f"data:image/jpeg;base64,{encoded_string}"

# Usage
client = QRISClassifierClient("https://merchant-classifier-api.hoople.co.id")

try:
    # Login method
    user = client.login("user@example.com", "password123")
    print(f"Logged in as: {user['email']}")
    
    # Convert image to base64
    image_base64 = client.image_to_base64("path/to/qris_image.jpg")
    
    # Classify image
    result = client.classify_image(image_base64)
    print(f"Classification result: {result}")
    
except Exception as e:
    print(f"Error: {e}")
```

## FAQ

### Q: Bagaimana cara mengkonversi gambar ke base64?

**JavaScript:**
```javascript
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
```

**Python:**
```python
import base64

def image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded_string}"
```

### Q: Berapa lama JWT token berlaku?

JWT token berlaku selama 24 jam. Setelah expired, Anda perlu login ulang untuk mendapatkan token baru.

### Q: Apakah bisa menggunakan API key dan JWT token bersamaan?

Tidak perlu. Pilih salah satu metode authentication:
- **JWT Token**: Untuk aplikasi yang memerlukan session management
- **API Key**: Untuk integrasi sistem yang memerlukan akses permanen

### Q: Bagaimana cara mengetahui sisa quota rate limit?

Cek response headers setiap request:
- `X-RateLimit-Remaining`: Sisa request yang bisa dilakukan
- `X-RateLimit-Reset`: Timestamp kapan limit akan reset

### Q: Format gambar apa saja yang didukung?

API mendukung format:
- JPEG/JPG
- PNG
- WebP
- Maksimal ukuran: 10MB per gambar

### Q: Bagaimana cara menangani error rate limit?

Implementasikan retry logic dengan exponential backoff:

```javascript
async function classifyWithRetry(client, imageBase64, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.classifyImage(imageBase64);
    } catch (error) {
      if (error.message.includes('RATE_LIMIT_EXCEEDED') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### Q: Bagaimana cara request peningkatan rate limit?

Hubungi administrator dengan informasi:
- Penggunaan saat ini
- Kebutuhan rate limit yang diinginkan
- Justifikasi bisnis
- Estimasi volume transaksi

---

## Support

Jika mengalami masalah atau memiliki pertanyaan:

1. **Cek dokumentasi** ini terlebih dahulu
2. **Periksa error message** dan status code
3. **Hubungi administrator** jika masalah berlanjut

**Informasi yang perlu disertakan saat melaporkan masalah:**
- Request ID (jika ada)
- Timestamp error
- Full error message
- Steps to reproduce
- Environment (development/production)

---

*Dokumentasi ini akan diupdate secara berkala. Pastikan selalu menggunakan versi terbaru.*