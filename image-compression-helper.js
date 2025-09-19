/**
 * QRIS Classifier - Image Compression Helper
 * 
 * Fungsi-fungsi untuk mengoptimalkan ukuran gambar sebelum dikirim ke API
 * Membantu menghindari error REQUEST_TOO_LARGE (413)
 */

/**
 * Mengkompresi gambar dan mengubahnya menjadi base64
 * @param {File|Blob} imageFile - File gambar dari input
 * @param {Object} options - Opsi kompresi
 * @param {number} options.maxWidth - Lebar maksimum (default: 1600)
 * @param {number} options.maxHeight - Tinggi maksimum (default: 1600)
 * @param {number} options.quality - Kualitas kompresi 0-1 (default: 0.8)
 * @param {string} options.format - Format output ('jpeg', 'png', 'webp') (default: 'jpeg')
 * @param {number} options.maxSizeMB - Ukuran maksimum dalam MB (default: 4.5)
 * @returns {Promise<string>} - Promise yang menghasilkan string base64 dengan data URI
 */
async function compressImageToBase64(imageFile, options = {}) {
  // Default options
  const settings = {
    maxWidth: options.maxWidth || 1600,
    maxHeight: options.maxHeight || 1600,
    quality: options.quality || 0.8,
    format: options.format || 'jpeg',
    maxSizeMB: options.maxSizeMB || 4.5
  };

  // Validasi format
  const validFormats = ['jpeg', 'png', 'webp'];
  if (!validFormats.includes(settings.format)) {
    throw new Error(`Format tidak valid: ${settings.format}. Gunakan 'jpeg', 'png', atau 'webp'`);
  }

  // Buat URL objek dari file
  const imageUrl = URL.createObjectURL(imageFile);
  
  // Load gambar
  const img = new Image();
  
  // Wrap dalam Promise untuk menunggu gambar dimuat
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });
  
  // Hitung dimensi yang dipertahankan rasio aspek
  let width = img.width;
  let height = img.height;
  
  if (width > settings.maxWidth || height > settings.maxHeight) {
    const ratio = Math.min(settings.maxWidth / width, settings.maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  // Buat canvas untuk menggambar gambar yang dikompresi
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Gambar ke canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  
  // Konversi ke base64
  let base64String = canvas.toDataURL(`image/${settings.format}`, settings.quality);
  
  // Jika masih terlalu besar, kurangi kualitas secara bertahap
  let currentQuality = settings.quality;
  const maxSizeBytes = settings.maxSizeMB * 1024 * 1024;
  
  // Estimasi ukuran base64 (karakter * 0.75)
  let estimatedSize = (base64String.length - base64String.indexOf(',') - 1) * 0.75;
  
  // Kompresi bertahap jika masih terlalu besar
  while (estimatedSize > maxSizeBytes && currentQuality > 0.1) {
    currentQuality -= 0.1;
    base64String = canvas.toDataURL(`image/${settings.format}`, currentQuality);
    estimatedSize = (base64String.length - base64String.indexOf(',') - 1) * 0.75;
  }
  
  // Bersihkan URL objek
  URL.revokeObjectURL(imageUrl);
  
  return base64String;
}

/**
 * Mengkompresi beberapa gambar sekaligus
 * @param {Object} imageFiles - Objek dengan key sebagai nama gambar dan value sebagai File/Blob
 * @param {Object} options - Opsi kompresi (sama seperti compressImageToBase64)
 * @returns {Promise<Object>} - Promise yang menghasilkan objek dengan key yang sama dan value base64
 */
async function compressMultipleImages(imageFiles, options = {}) {
  const result = {};
  const entries = Object.entries(imageFiles);
  
  // Validasi jumlah gambar
  if (entries.length > 5) {
    throw new Error('Maksimum 5 gambar diperbolehkan per request');
  }
  
  // Kompresi semua gambar secara paralel
  await Promise.all(
    entries.map(async ([key, file]) => {
      if (file) {
        result[key] = await compressImageToBase64(file, options);
      }
    })
  );
  
  return result;
}

/**
 * Menghitung estimasi ukuran total request dengan gambar yang dikompresi
 * @param {Object} compressedImages - Objek hasil dari compressMultipleImages
 * @param {Object} metadata - Metadata tambahan yang akan dikirim
 * @returns {Object} - Informasi ukuran { totalSizeMB, individualSizes, isSafe }
 */
function estimateRequestSize(compressedImages, metadata = {}) {
  const individualSizes = {};
  let totalSize = 0;
  
  // Hitung ukuran setiap gambar
  Object.entries(compressedImages).forEach(([key, base64]) => {
    if (base64) {
      // Estimasi ukuran base64 (karakter * 0.75)
      const size = (base64.length - base64.indexOf(',') - 1) * 0.75;
      individualSizes[key] = size / (1024 * 1024); // Convert to MB
      totalSize += size;
    }
  });
  
  // Tambahkan estimasi ukuran metadata (JSON stringify + 10% overhead)
  const metadataSize = JSON.stringify(metadata).length * 1.1;
  totalSize += metadataSize;
  
  // Tambahkan overhead untuk headers dan struktur JSON (estimasi: 2KB)
  totalSize += 2 * 1024;
  
  // Konversi ke MB
  const totalSizeMB = totalSize / (1024 * 1024);
  
  // Cek apakah aman (di bawah 9.5MB untuk memberikan margin)
  const isSafe = totalSizeMB < 9.5;
  
  return {
    totalSizeMB,
    individualSizes,
    metadataSize: metadataSize / (1024 * 1024),
    isSafe,
    recommendation: isSafe ? 
      'Request aman untuk dikirim' : 
      'Request mungkin terlalu besar. Kurangi kualitas gambar atau kirim lebih sedikit gambar'
  };
}

// Export fungsi-fungsi
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    compressImageToBase64,
    compressMultipleImages,
    estimateRequestSize
  };
} else {
  // Untuk penggunaan di browser
  window.ImageCompression = {
    compressImageToBase64,
    compressMultipleImages,
    estimateRequestSize
  };
}