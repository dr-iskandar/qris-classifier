#!/usr/bin/env node

/**
 * QRIS Classifier - Image to Base64 Converter
 * 
 * This helper script converts image files to base64 data URIs
 * for use with the QRIS Classifier API endpoints.
 * 
 * Usage:
 *   node image-to-base64-helper.js path/to/image.jpg
 *   node image-to-base64-helper.js path/to/image1.jpg path/to/image2.jpg path/to/image3.jpg
 */

const fs = require('fs');
const path = require('path');

// MIME type mapping
const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

/**
 * Convert image file to base64 data URI
 * @param {string} imagePath - Path to the image file
 * @returns {string} Base64 data URI
 */
function imageToBase64(imagePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    // Get file extension and MIME type
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = mimeTypes[ext];
    
    if (!mimeType) {
      throw new Error(`Unsupported image format: ${ext}. Supported formats: ${Object.keys(mimeTypes).join(', ')}`);
    }

    // Read file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    
    // Create data URI
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error.message);
    return null;
  }
}

/**
 * Generate cURL command for classification
 * @param {Object} images - Object containing base64 images
 * @param {string} authMethod - 'api-key' or 'jwt'
 * @returns {string} cURL command
 */
function generateCurlCommand(images, authMethod = 'api-key') {
  const payload = {
    images,
    metadata: {
      requestId: `req_${Date.now()}`,
      clientVersion: '1.0.0'
    }
  };

  const authHeader = authMethod === 'jwt' 
    ? '-H "Authorization: Bearer YOUR_JWT_TOKEN"'
    : '-H "X-API-Key: YOUR_API_KEY"';

  return `curl -X POST "http://localhost:9002/api/classify" \\
  ${authHeader} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('QRIS Classifier - Image to Base64 Converter\n');
    console.log('Usage:');
    console.log('  node image-to-base64-helper.js path/to/image.jpg');
    console.log('  node image-to-base64-helper.js image1.jpg image2.jpg image3.jpg\n');
    console.log('Supported formats: JPEG, PNG, GIF, WebP');
    console.log('Maximum 5 images per request, 5MB per image\n');
    process.exit(1);
  }

  if (args.length > 5) {
    console.error('Error: Maximum 5 images allowed per request');
    process.exit(1);
  }

  console.log('Converting images to base64...\n');
  
  const images = {};
  let successCount = 0;
  
  for (let i = 0; i < args.length; i++) {
    const imagePath = args[i];
    const imageKey = `image${i + 1}`;
    
    console.log(`Processing ${imagePath}...`);
    
    const base64Data = imageToBase64(imagePath);
    if (base64Data) {
      images[imageKey] = base64Data;
      successCount++;
      
      // Show file size info
      const stats = fs.statSync(imagePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`  ✓ Converted successfully (${fileSizeMB} MB)`);
      
      if (stats.size > 5 * 1024 * 1024) {
        console.log(`  ⚠️  Warning: File size exceeds 5MB limit`);
      }
    } else {
      console.log(`  ✗ Failed to convert`);
    }
  }
  
  if (successCount === 0) {
    console.log('\nNo images were successfully converted.');
    process.exit(1);
  }
  
  console.log(`\n✓ Successfully converted ${successCount}/${args.length} images\n`);
  
  // Generate JSON payload
  console.log('=== JSON Payload for API Request ===');
  const payload = {
    images,
    metadata: {
      requestId: `req_${Date.now()}`,
      clientVersion: '1.0.0'
    }
  };
  console.log(JSON.stringify(payload, null, 2));
  
  // Generate cURL commands
  console.log('\n=== cURL Command (API Key Authentication) ===');
  console.log(generateCurlCommand(images, 'api-key'));
  
  console.log('\n=== cURL Command (JWT Authentication) ===');
  console.log(generateCurlCommand(images, 'jwt'));
  
  console.log('\n=== Usage Instructions ===');
  console.log('1. Replace YOUR_API_KEY or YOUR_JWT_TOKEN with your actual credentials');
  console.log('2. Copy and paste the cURL command into your terminal');
  console.log('3. Or use the JSON payload in Postman/other API clients');
  console.log('\nFor more information, see: CURL_API_DOCUMENTATION.md');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  imageToBase64,
  generateCurlCommand
};