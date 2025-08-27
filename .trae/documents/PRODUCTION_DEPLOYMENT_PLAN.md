# Production Deployment Plan - AI Semantic Comparison Feature

## 1. Pre-Deployment Checklist

### 1.1 Code Quality & Testing
- [ ] Semua unit tests passing di local environment
- [ ] Integration tests untuk AI semantic comparison berhasil
- [ ] Code review telah dilakukan dan approved
- [ ] No critical bugs atau security vulnerabilities
- [ ] Performance testing untuk AI comparison endpoint

### 1.2 Environment Preparation
- [ ] Production server accessible via SSH
- [ ] Git repository up-to-date dengan latest changes
- [ ] Environment variables configured (API keys, database credentials)
- [ ] Backup strategy confirmed
- [ ] Rollback plan prepared

### 1.3 Dependencies & Configuration
- [ ] Node.js version compatibility checked
- [ ] NPM packages updated dan compatible
- [ ] Database schema migrations ready (jika ada)
- [ ] AI model dependencies available
- [ ] SSL certificates valid

## 2. Step-by-Step Deployment Process via Git

### 2.1 Backup Current Production
```bash
# Connect to production server
ssh user@production-server

# Navigate to application directory
cd /path/to/qris-classifier

# Create backup of current deployment
sudo cp -r . ../qris-classifier-backup-$(date +%Y%m%d-%H%M%S)

# Backup database (if applicable)
pg_dump qris_classifier > ../db-backup-$(date +%Y%m%d-%H%M%S).sql
```

### 2.2 Git Deployment Process
```bash
# Stop current application
sudo systemctl stop qris-classifier
# atau
pm2 stop qris-classifier

# Pull latest changes from Git
git fetch origin
git checkout main
git pull origin main

# Install/update dependencies
npm ci --production

# Build application
npm run build

# Run database migrations (if any)
npm run migrate

# Start application
sudo systemctl start qris-classifier
# atau
pm2 start qris-classifier
```

### 2.3 Environment Configuration
```bash
# Verify environment variables
cat .env.production

# Ensure AI model access
# Check API keys for semantic comparison
echo $OPENAI_API_KEY
echo $HUGGINGFACE_API_KEY
```

## 3. Testing Strategy untuk AI Semantic Comparison

### 3.1 Health Check Tests
```bash
# Basic application health
curl -f http://localhost:9002/api/health

# API endpoint availability
curl -f http://localhost:9002/api/classify
```

### 3.2 AI Semantic Comparison Tests
```bash
# Test dengan sample image dan business name
python3 test-production-api.py --host localhost --port 9002

# Test cases:
# 1. Matching business type (e.g., restaurant image + "Warung Makan")
# 2. Non-matching business type (e.g., shoe store image + "Restaurant")
# 3. Ambiguous cases (e.g., general store + "Toko Kelontong")
```

### 3.3 Performance Testing
```bash
# Load testing untuk AI endpoint
ab -n 100 -c 10 http://localhost:9002/api/classify

# Memory usage monitoring
top -p $(pgrep -f "node.*qris-classifier")
```

## 4. Rollback Plan

### 4.1 Quick Rollback (Git-based)
```bash
# Stop current application
sudo systemctl stop qris-classifier

# Rollback to previous commit
git log --oneline -5  # Check recent commits
git checkout <previous-commit-hash>

# Rebuild and restart
npm ci --production
npm run build
sudo systemctl start qris-classifier
```

### 4.2 Full Rollback (Backup-based)
```bash
# Stop application
sudo systemctl stop qris-classifier

# Restore from backup
cd /path/to
rm -rf qris-classifier
cp -r qris-classifier-backup-YYYYMMDD-HHMMSS qris-classifier
cd qris-classifier

# Restore database (if needed)
psql qris_classifier < ../db-backup-YYYYMMDD-HHMMSS.sql

# Start application
sudo systemctl start qris-classifier
```

### 4.3 Rollback Triggers
- API response time > 5 seconds
- Error rate > 5%
- AI semantic comparison accuracy < 80%
- Memory usage > 90%
- Critical functionality broken

## 5. Monitoring dan Validation Post-Deployment

### 5.1 Immediate Validation (0-15 minutes)
```bash
# Application status
sudo systemctl status qris-classifier

# Log monitoring
tail -f /var/log/qris-classifier/app.log

# API health check
curl -f http://production-domain.com/api/health

# AI endpoint test
curl -X POST http://production-domain.com/api/classify \
  -H "Content-Type: application/json" \
  -d '{"image":"base64-encoded-image","businessName":"Test Business"}'
```

### 5.2 Short-term Monitoring (15 minutes - 2 hours)
- [ ] Response time monitoring
- [ ] Error rate tracking
- [ ] Memory dan CPU usage
- [ ] AI model response accuracy
- [ ] Database connection stability

### 5.3 Long-term Monitoring (2+ hours)
- [ ] User feedback collection
- [ ] Performance metrics trending
- [ ] AI comparison accuracy analytics
- [ ] Business impact assessment

## 6. Success Criteria

### 6.1 Technical Metrics
- API response time < 3 seconds
- Error rate < 1%
- AI semantic comparison accuracy > 85%
- Memory usage stable < 80%
- Zero critical errors in logs

### 6.2 Functional Validation
- [ ] Image classification working correctly
- [ ] Business name comparison returning accurate results
- [ ] AI semantic analysis providing meaningful insights
- [ ] Match scores and reasons are logical
- [ ] Cross-language support functioning

## 7. Emergency Contacts & Procedures

### 7.1 Emergency Contacts
- Development Team Lead: [contact]
- DevOps Engineer: [contact]
- Product Owner: [contact]

### 7.2 Emergency Procedures
1. **Critical Issue Detected**
   - Immediately execute rollback plan
   - Notify emergency contacts
   - Document issue details

2. **Performance Degradation**
   - Monitor for 5 minutes
   - If no improvement, initiate rollback
   - Investigate root cause

3. **AI Model Failure**
   - Check API key validity
   - Verify model endpoint availability
   - Fallback to basic comparison if needed

## 8. Post-Deployment Tasks

### 8.1 Documentation Updates
- [ ] Update API documentation
- [ ] Update deployment runbook
- [ ] Document lessons learned
- [ ] Update monitoring dashboards

### 8.2 Team Communication
- [ ] Notify stakeholders of successful deployment
- [ ] Share performance metrics
- [ ] Schedule post-deployment review meeting
- [ ] Update project status

---

**Deployment Checklist Summary:**
- [ ] Pre-deployment checklist completed
- [ ] Backup created successfully
- [ ] Git deployment executed
- [ ] Testing strategy validated
- [ ] Monitoring systems active
- [ ] Success criteria met
- [ ] Documentation updated
- [ ] Team notified

**Estimated Deployment Time:** 30-45 minutes
**Estimated Rollback Time:** 10-15 minutes
**Risk Level:** Medium (due to AI integration complexity)