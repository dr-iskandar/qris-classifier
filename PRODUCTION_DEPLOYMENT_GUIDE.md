# Production Deployment Guide

## Prerequisites
- SSH access to production server: `ssh root@156.67.217.39 -p 24`
- Git repository with the latest business name comparison feature
- Node.js and npm installed on production server

## Deployment Steps

### 1. Connect to Production Server
```bash
ssh root@156.67.217.39 -p 24
```

### 2. Navigate to Application Directory
```bash
# Find the current application directory
find / -name "qris-classifier" -type d 2>/dev/null
# OR check common deployment locations
ls -la /var/www/
ls -la /opt/
ls -la /home/
```

### 3. Backup Current Deployment
```bash
# Create backup with timestamp
cp -r /path/to/qris-classifier /path/to/qris-classifier-backup-$(date +%Y%m%d-%H%M%S)
```

### 4. Update Code from Repository
```bash
cd /path/to/qris-classifier

# Pull latest changes
git fetch origin
git pull origin main

# Verify the business name comparison feature is present
git log --oneline -5
```

### 5. Install/Update Dependencies
```bash
# Install production dependencies
npm ci --production

# OR if using yarn
yarn install --production
```

### 6. Build Production Application
```bash
# Build the Next.js application
npm run build

# Verify build completed successfully
ls -la .next/
```

### 7. Environment Configuration
```bash
# Check environment variables
cat .env.production
# OR
cat .env.local

# Ensure all required environment variables are set:
# - Database connection strings
# - API keys
# - JWT secrets
# - Any other production-specific configs
```

### 8. Restart Services
```bash
# If using PM2
pm2 restart qris-classifier
pm2 status

# If using systemd
sudo systemctl restart qris-classifier
sudo systemctl status qris-classifier

# If using Docker
docker-compose down
docker-compose up -d --build

# If running directly with npm
# Kill existing process first
pkill -f "node.*next"
# Start in production mode
npm start
```

### 9. Verify Deployment
```bash
# Check if application is running
netstat -tlnp | grep :3000
# OR check the specific port your app runs on

# Test API endpoint
curl -X GET http://localhost:3000/api/health
# OR your specific health check endpoint
```

### 10. Test Business Name Comparison Feature
```bash
# Create a test script on the server
cat > test_production_feature.py << 'EOF'
import requests
import base64
import json

# Test the business name comparison feature
with open('/path/to/test/image.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

data = {
    'image': image_data,
    'businessName': 'Toko Sepatu Sport'
}

headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
}

response = requests.post('http://localhost:3000/api/classify', 
                        json=data, headers=headers)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Check if 'comparison' field is present
if 'comparison' in response.json():
    print("✅ Business name comparison feature is working!")
else:
    print("❌ Business name comparison feature not found in response")
EOF

# Run the test
python3 test_production_feature.py
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next/
   rm -rf node_modules/
   npm install
   npm run build
   ```

2. **Port Already in Use**
   ```bash
   # Find process using the port
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

3. **Environment Variables Missing**
   ```bash
   # Check current environment
   printenv | grep -i qris
   # Add missing variables to .env file
   ```

4. **Database Connection Issues**
   ```bash
   # Test database connectivity
   # Add your specific database test commands here
   ```

### Logs and Monitoring

```bash
# Check application logs
tail -f /var/log/qris-classifier.log

# If using PM2
pm2 logs qris-classifier

# If using systemd
journalctl -u qris-classifier -f

# Check system resources
top
df -h
free -m
```

## Rollback Procedure

If deployment fails:

```bash
# Stop current application
pm2 stop qris-classifier
# OR
sudo systemctl stop qris-classifier

# Restore from backup
rm -rf /path/to/qris-classifier
cp -r /path/to/qris-classifier-backup-TIMESTAMP /path/to/qris-classifier

# Restart with previous version
pm2 start qris-classifier
# OR
sudo systemctl start qris-classifier
```

## Post-Deployment Checklist

- [ ] Application starts without errors
- [ ] All API endpoints respond correctly
- [ ] Business name comparison feature works
- [ ] Database connections are stable
- [ ] Logs show no critical errors
- [ ] Performance metrics are normal
- [ ] SSL certificates are valid (if applicable)
- [ ] Monitoring alerts are configured

## Notes

- Always test in a staging environment first
- Keep backups of working deployments
- Monitor application performance after deployment
- Update this guide as deployment process evolves