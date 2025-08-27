#!/bin/bash

# Production Deployment Script for QRIS Classifier
# Usage: ./deploy-production.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_NAME="qris-classifier"
APP_DIR="/var/www/qris-classifier"  # Adjust this path as needed
BACKUP_DIR="/var/backups"
NODE_ENV="production"

print_status "Starting production deployment for $APP_NAME..."

# Step 1: Check if we're running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

# Step 2: Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR not found!"
    print_status "Please update APP_DIR variable in this script"
    exit 1
fi

cd "$APP_DIR"
print_status "Changed to application directory: $APP_DIR"

# Step 3: Create backup
print_status "Creating backup..."
BACKUP_NAME="$APP_NAME-backup-$(date +%Y%m%d-%H%M%S)"
cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"
print_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"

# Step 4: Check Git status
print_status "Checking Git repository status..."
if [ ! -d ".git" ]; then
    print_error "Not a Git repository! Please ensure the application is deployed from Git."
    exit 1
fi

# Step 5: Fetch and pull latest changes
print_status "Fetching latest changes from repository..."
git fetch origin
git pull origin main
print_success "Code updated successfully"

# Step 6: Check if business name comparison feature is present
print_status "Verifying business name comparison feature..."
if git log --oneline -10 | grep -q "business name comparison\|comparison feature"; then
    print_success "Business name comparison feature found in recent commits"
else
    print_warning "Business name comparison feature not found in recent commits"
fi

# Step 7: Install dependencies
print_status "Installing production dependencies..."
if command -v npm &> /dev/null; then
    npm ci --production
    print_success "Dependencies installed with npm"
elif command -v yarn &> /dev/null; then
    yarn install --production
    print_success "Dependencies installed with yarn"
else
    print_error "Neither npm nor yarn found!"
    exit 1
fi

# Step 8: Build application
print_status "Building production application..."
NODE_ENV=production npm run build
if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Build failed! Rolling back..."
    rm -rf "$APP_DIR"
    cp -r "$BACKUP_DIR/$BACKUP_NAME" "$APP_DIR"
    exit 1
fi

# Step 9: Restart services
print_status "Restarting application services..."

# Try different service management approaches
if command -v pm2 &> /dev/null; then
    print_status "Restarting with PM2..."
    pm2 restart $APP_NAME || pm2 start ecosystem.config.js
    pm2 status
    print_success "PM2 restart completed"
elif systemctl is-active --quiet $APP_NAME; then
    print_status "Restarting with systemd..."
    systemctl restart $APP_NAME
    systemctl status $APP_NAME
    print_success "Systemd restart completed"
elif command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    print_status "Restarting with Docker Compose..."
    docker-compose down
    docker-compose up -d --build
    print_success "Docker Compose restart completed"
else
    print_warning "No known service manager found. Please restart the application manually."
    print_status "You can try: npm start (in production mode)"
fi

# Step 10: Health check
print_status "Performing health check..."
sleep 5  # Wait for application to start

# Try to find the application port
APP_PORT=$(netstat -tlnp 2>/dev/null | grep node | head -1 | awk '{print $4}' | cut -d: -f2)
if [ -z "$APP_PORT" ]; then
    APP_PORT=3000  # Default Next.js port
fi

print_status "Checking application on port $APP_PORT..."
if curl -f -s "http://localhost:$APP_PORT/api/health" > /dev/null 2>&1; then
    print_success "Health check passed - application is responding"
elif curl -f -s "http://localhost:$APP_PORT" > /dev/null 2>&1; then
    print_success "Application is responding on port $APP_PORT"
else
    print_warning "Health check failed - please verify application status manually"
fi

# Step 11: Test business name comparison feature
print_status "Testing business name comparison feature..."
cat > /tmp/test_feature.py << 'EOF'
import requests
import json
import sys

try:
    # Simple test without image (if endpoint supports it)
    data = {
        'businessName': 'Test Store'
    }
    
    response = requests.post('http://localhost:3000/api/classify', 
                           json=data, timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        if 'comparison' in result:
            print("✅ Business name comparison feature is working!")
            sys.exit(0)
        else:
            print("⚠️  API responding but comparison feature not found")
            sys.exit(1)
    else:
        print(f"⚠️  API returned status code: {response.status_code}")
        sys.exit(1)
        
except Exception as e:
    print(f"⚠️  Feature test failed: {e}")
    sys.exit(1)
EOF

if command -v python3 &> /dev/null; then
    if python3 /tmp/test_feature.py; then
        print_success "Business name comparison feature test passed"
    else
        print_warning "Business name comparison feature test failed - manual verification needed"
    fi
    rm -f /tmp/test_feature.py
else
    print_warning "Python3 not found - skipping feature test"
fi

# Step 12: Final status
print_success "Deployment completed successfully!"
print_status "Backup location: $BACKUP_DIR/$BACKUP_NAME"
print_status "Application directory: $APP_DIR"
print_status "Application should be running on port $APP_PORT"

print_status "\nPost-deployment checklist:"
echo "  [ ] Verify all API endpoints are working"
echo "  [ ] Test business name comparison with real data"
echo "  [ ] Check application logs for errors"
echo "  [ ] Monitor system resources"
echo "  [ ] Update monitoring/alerting if needed"

print_status "\nTo rollback if needed:"
echo "  sudo rm -rf $APP_DIR"
echo "  sudo cp -r $BACKUP_DIR/$BACKUP_NAME $APP_DIR"
echo "  sudo systemctl restart $APP_NAME  # or pm2 restart $APP_NAME"

print_success "Deployment script completed!"