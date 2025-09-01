# QRIS Classifier - Postman Collection

Postman collection lengkap untuk testing API QRIS Classifier yang mencakup semua endpoint authentication, user management, dan image classification.

## Files yang Disediakan

1. **QRIS_Classifier_Complete_API.postman_collection.json** - Collection utama dengan semua endpoint
2. **QRIS_Classifier_Environment.postman_environment.json** - Environment variables untuk testing
3. **POSTMAN_COLLECTION_README.md** - Dokumentasi penggunaan (file ini)

## Cara Import ke Postman

### 1. Import Collection
1. Buka Postman
2. Klik **Import** di bagian atas
3. Pilih file `QRIS_Classifier_Complete_API.postman_collection.json`
4. Klik **Import**

### 2. Import Environment
1. Klik **Import** lagi
2. Pilih file `QRIS_Classifier_Environment.postman_environment.json`
3. Klik **Import**
4. Pilih environment "QRIS Classifier Environment" di dropdown environment

## Struktur Collection

### 🔐 Authentication
- **Admin Login** - Login dengan akun admin untuk mendapatkan JWT token
- **Get Current User Info** - Mendapatkan informasi user yang sedang login (JWT)
- **Get User Info with API Key** - Mendapatkan informasi user menggunakan API key

### 👥 User Management (Admin)
- **Create New User** - Membuat user baru (admin only)
- **Get All Users** - Mendapatkan daftar semua user (admin only)
- **Update User** - Update informasi user (admin only)
- **Delete User** - Menghapus user (admin only)

### 🔑 API Key Management
- **Get API Keys Info** - Mendapatkan informasi API keys
- **Create API Key for User** - Membuat API key untuk user baru
- **Regenerate API Key** - Generate ulang API key untuk user

### 🖼️ Image Classification
- **Classify with JWT Token** - Klasifikasi gambar menggunakan JWT authentication
- **Classify with API Key** - Klasifikasi gambar menggunakan API key authentication
- **Classify Multiple Images** - Klasifikasi beberapa gambar sekaligus

### ❤️ Health & Status
- **Health Check** - Cek status kesehatan API
- **API Status** - Mendapatkan status detail API

## Workflow Penggunaan

### 1. Authentication Flow
```
1. Admin Login → Mendapatkan JWT token
2. Token otomatis tersimpan di environment variable
3. Gunakan token untuk endpoint yang memerlukan authentication
```

### 2. User Creation Flow
```
1. Admin Login
2. Create New User → Mendapatkan user baru dengan API key
3. API key otomatis tersimpan di environment variable
4. Gunakan API key untuk testing classification
```

### 3. Classification Flow
```
1. Pilih salah satu endpoint classification
2. Gunakan JWT token atau API key untuk authentication
3. Kirim gambar dalam format base64
4. Terima hasil klasifikasi
```

## Environment Variables

Collection ini menggunakan environment variables berikut:

| Variable | Description | Auto-filled |
|----------|-------------|-------------|
| `base_url` | Base URL API | ✅ |
| `jwt_token` | JWT token dari login | ✅ (dari Admin Login) |
| `api_key` | API key untuk testing | ✅ (pre-filled) |
| `user_id` | ID user yang login | ✅ (dari Admin Login) |
| `user_email` | Email user yang login | ✅ (dari Admin Login) |
| `user_role` | Role user yang login | ✅ (dari Admin Login) |
| `new_user_id` | ID user baru yang dibuat | ✅ (dari Create User) |
| `new_user_email` | Email user baru | ✅ (dari Create User) |
| `new_user_api_key` | API key user baru | ✅ (dari Create User) |
| `admin_email` | Email admin | ✅ (pre-filled) |
| `admin_password` | Password admin | ✅ (pre-filled) |

## Fitur Otomatis

### Auto-Save Tokens
- JWT token otomatis tersimpan setelah login berhasil
- API key baru otomatis tersimpan setelah create user
- User information otomatis tersimpan untuk referensi

### Auto-Testing
- Response time validation (< 5000ms)
- Content-type validation
- Error logging untuk debugging

### Pre-request Scripts
- Auto-set base URL jika belum ada
- Logging environment variables untuk debugging

## Contoh Penggunaan

### 1. Testing Complete Flow
```
1. Run "Admin Login" → JWT token tersimpan
2. Run "Create New User" → User baru dibuat dengan API key
3. Run "Classify with API Key" → Test classification dengan user baru
4. Run "Get All Users" → Lihat daftar semua user
5. Run "Delete User" → Hapus user yang dibuat
```

### 2. Quick Classification Test
```
1. Gunakan API key yang sudah ada: qris_38abs7sb21iyiifnvjr0bl
2. Run "Classify with API Key"
3. Lihat hasil klasifikasi
```

## Format Data

### Image Format
Gambar harus dalam format base64 dengan prefix:
```
data:image/jpeg;base64,<base64_string>
```

### Request Body Classification
```json
{
  "images": {
    "image1": "data:image/jpeg;base64,/9j/4AAQ..."
  },
  "businessName": "Nama Bisnis",
  "metadata": {
    "requestId": "req_123456",
    "clientVersion": "1.0.0"
  }
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "businessType": "restaurant",
    "confidence": 0.95,
    "processedAt": "2025-01-02T12:00:00.000Z",
    "comparison": {
      "inputBusiness": "Warung Makan",
      "detectedBusiness": "Restaurant",
      "similarity": 0.85
    },
    "rateLimit": {
      "remaining": 99,
      "resetTime": "2025-01-02T13:00:00.000Z"
    }
  }
}
```

## Troubleshooting

### 401 Unauthorized
- Pastikan JWT token atau API key valid
- Coba login ulang untuk refresh token

### 404 Not Found
- Periksa base URL sudah benar
- Pastikan endpoint path sesuai

### 429 Rate Limited
- Tunggu hingga rate limit reset
- Gunakan user dengan rate limit lebih tinggi

### 500 Internal Server Error
- Periksa format request body
- Pastikan gambar dalam format base64 yang valid

## Tips Penggunaan

1. **Selalu mulai dengan Admin Login** untuk mendapatkan JWT token
2. **Gunakan API key untuk testing rutin** karena lebih stabil
3. **Periksa Console Log** di Postman untuk debugging
4. **Simpan response** yang berguna sebagai example
5. **Gunakan environment variables** untuk switching antar server (dev/prod)

## Support

Jika ada masalah dengan collection ini:
1. Periksa environment variables sudah ter-set dengan benar
2. Pastikan server API berjalan di `https://merchant-classifier-api.hoople.co.id`
3. Cek Console Log di Postman untuk error details
4. Verifikasi format request sesuai dokumentasi API

---

**Happy Testing! 🚀**