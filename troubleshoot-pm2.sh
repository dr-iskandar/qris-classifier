#!/bin/bash

# Troubleshooting script untuk PM2 error setelah perubahan port ke 3004

echo "=== PM2 Troubleshooting Script ==="
echo "Checking current PM2 status..."
pm2 status

echo "\n=== Checking if port 3004 is in use ==="
netstat -tlnp | grep :3004 || echo "Port 3004 is free"

echo "\n=== Checking PM2 logs ==="
pm2 logs qris-classifier --lines 20

echo "\n=== Stopping all PM2 processes ==="
pm2 stop all
pm2 delete all

echo "\n=== Checking if any Node.js processes are still running ==="
ps aux | grep node | grep -v grep || echo "No Node.js processes found"

echo "\n=== Starting fresh PM2 instance ==="
pm2 start ecosystem.config.js

echo "\n=== Final PM2 status ==="
pm2 status

echo "\n=== Testing application on port 3004 ==="
sleep 5
curl -s http://localhost:3004/api/health || echo "Health check failed"

echo "\n=== PM2 logs after restart ==="
pm2 logs qris-classifier --lines 10

echo "\n=== Troubleshooting complete ==="
echo "If still having issues, check:"
echo "1. .env file has all required variables"
echo "2. Database is running and accessible"
echo "3. All dependencies are installed (npm install)"
echo "4. Application builds successfully (npm run build)"
echo "5. GOOGLE_GENAI_API_KEY is set for semantic comparison"