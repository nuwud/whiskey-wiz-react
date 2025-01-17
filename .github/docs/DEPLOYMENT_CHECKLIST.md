# Deployment Checklist

## Critical Security Steps

### 1. Environment Variables
Move all sensitive data to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Config
Update firebase.ts:
```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};
```

## Pre-Deployment Steps

### 1. Environment Setup
- [ ] Create .env.local
- [ ] Update Firebase config
- [ ] Verify all secrets are secured

### 2. Code Review
- [ ] No hardcoded credentials
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] Type safety verified

### 3. Testing
- [ ] Run all tests
- [ ] Check build output
- [ ] Test in production mode

## Deployment Process

### 1. Build Application
```bash
# Clean install dependencies
npm ci

# Build application
npm run build

# Test production build
npm run start
```

### 2. Firebase Deploy
```bash
# Initialize if needed
firebase init

# Deploy to Firebase
firebase deploy
```

### 3. Verify Deployment
- [ ] Check all routes
- [ ] Verify authentication
- [ ] Test game mechanics
- [ ] Monitor error logs

## Post-Deployment

### 1. Monitoring
- [ ] Set up error tracking
- [ ] Configure analytics
- [ ] Check performance metrics

### 2. Backup
- [ ] Database backup
- [ ] Configuration backup
- [ ] Document deployment version

### 3. Security
- [ ] Run security audit
- [ ] Check Firebase rules
- [ ] Verify authentication flows

## Emergency Procedures

### 1. Rollback Plan
```bash
# Revert to previous version
firebase hosting:clone your-site-name:previous your-site-name:current
```

### 2. Data Recovery
- Document database backup procedures
- Store configuration backups
- Keep deployment logs

### 3. Communication
- Update status page
- Notify team members
- Document incidents

## Optimization

### 1. Performance
- [ ] Enable caching
- [ ] Optimize images
- [ ] Configure CDN

### 2. Monitoring
- [ ] Set up alerts
- [ ] Configure logging
- [ ] Track metrics

## Notes for MCPs
1. Never commit .env files
2. Always check for credentials in code
3. Verify all security measures
4. Document deployment steps