# QRIS Classifier API - Postman Collections

Dokumen ini menjelaskan penggunaan dua collection Postman yang telah dibuat untuk QRIS Classifier API.

## Collections yang Tersedia

### 1. QRIS Classifier User API (`QRIS_Classifier_User_API.postman_collection.json`)
Collection ini berisi endpoints yang dapat digunakan oleh user biasa untuk:
- Login dan autentikasi
- Mendapatkan informasi user
- Mengelola API key pribadi
- Melakukan klasifikasi gambar QRIS
- Verifikasi token dan API key

### 2. QRIS Classifier Admin API (`QRIS_Classifier_Admin_API.postman_collection.json`)
Collection ini berisi endpoints khusus untuk administrator yang meliputi:
- Login admin
- Manajemen user (create, update, delete)
- Manajemen API key untuk semua user
- Testing klasifikasi dengan privilege admin
- Administrasi sistem

## Cara Import Collections

1. Buka Postman
2. Klik "Import" di bagian atas kiri
3. Pilih "File" dan upload file collection JSON
4. Atau drag & drop file JSON ke area import

## Environment Variables

Kedua collection menggunakan environment variables yang sama:

```json
{
  "base_url": "http://localhost:9002",
  "jwt_token": "",
  "api_key": ""
}
```

### Setup Environment
1. Buat environment baru di Postman
2. Tambahkan variable `base_url` dengan value `http://localhost:9002` (atau URL server Anda)
3. Variable `jwt_token` dan `api_key` akan otomatis terisi setelah login/generate API key

## Penggunaan User Collection

### 1. Authentication
- **Login**: Gunakan endpoint "Login" dengan email dan password user
- Token JWT akan otomatis tersimpan di environment variable

### 2. API Key Management
- **Get API Key Info**: Melihat informasi API key user saat ini
- **Regenerate API Key**: Membuat ulang API key (API key lama akan tidak valid)

### 3. Image Classification
- **Single Image**: Klasifikasi satu gambar QRIS
- **Multiple Images**: Klasifikasi beberapa gambar sekaligus
- **With JWT Token**: Klasifikasi menggunakan JWT token (alternatif API key)

### 4. Verification
- **Verify Token**: Memverifikasi validitas JWT token
- **Verify API Key**: Memverifikasi validitas API key

## Penggunaan Admin Collection

### 1. Admin Authentication
- **Admin Login**: Login dengan kredensial admin
- Default: `admin@qris-classifier.com` / `admin123`

### 2. User Management
- **Create New User**: Membuat user baru dengan role dan rate limit
- **Update User**: Mengupdate informasi user (email, role, rate limit, status)
- **Delete User**: Menghapus user dari sistem

### 3. API Key Management
- **List All API Keys**: Melihat semua API key di sistem
- **Create API Key for User**: Membuat API key untuk user tertentu
- **Regenerate API Key**: Regenerate API key user tertentu
- **Delete API Key**: Menghapus API key user

### 4. System Administration
- **Admin Testing**: Testing klasifikasi dengan privilege admin
- **System Verification**: Verifikasi sistem menggunakan admin credentials

## Contoh Request Body

### Login User
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

### Login Admin
```json
{
  "email": "admin@qris-classifier.com",
  "password": "admin123"
}
```

### Create New User (Admin)
```json
{
  "email": "newuser@example.com",
  "role": "user",
  "rateLimit": 100
}
```

### Image Classification
```json
{
  "images": {
    "image1": "data:image/jpeg;base64,/9j/4AAQ...",
    "metadata": {
      "requestId": "req_1234567890",
      "clientVersion": "1.0.0"
    }
  }
}
```

## Headers yang Diperlukan

### JWT Authentication
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

### API Key Authentication
```
X-API-Key: {{api_key}}
Content-Type: application/json
```

## Response Format

Semua endpoint menggunakan format response yang konsisten:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message"
}
```

Untuk error:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Tips Penggunaan

1. **Selalu login terlebih dahulu** sebelum menggunakan endpoint yang memerlukan autentikasi
2. **Gunakan environment** untuk menyimpan base_url, jwt_token, dan api_key
3. **User collection** untuk testing dari perspektif user biasa
4. **Admin collection** untuk testing fitur administratif
5. **Periksa response** untuk memastikan token/API key tersimpan dengan benar
6. **Update base_url** sesuai dengan environment (development/staging/production)

## Troubleshooting

### Token Expired
- Login ulang untuk mendapatkan token baru
- Token JWT memiliki masa berlaku terbatas

### Invalid API Key
- Regenerate API key melalui endpoint yang tersedia
- Pastikan API key tersimpan dengan benar di environment

### Permission Denied
- Pastikan menggunakan akun dengan role yang sesuai
- Admin endpoints hanya bisa diakses oleh user dengan role 'admin'

### Connection Error
- Periksa apakah server berjalan di URL yang benar
- Update base_url di environment variables

## Security Notes

- **Jangan commit** file environment yang berisi token/API key aktual
- **Gunakan HTTPS** di production environment
- **Rotate API keys** secara berkala
- **Monitor** penggunaan API key untuk deteksi penyalahgunaan
- **Limit rate** sesuai kebutuhan untuk mencegah abuse