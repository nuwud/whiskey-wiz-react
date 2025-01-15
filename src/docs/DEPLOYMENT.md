# Deployment Guide

## Prerequisites
1. Node.js v20 or later
2. Firebase CLI
3. GitHub account with repository access
4. Firebase project set up

## Environment Setup
1. Create `.env.local` with all required variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

2. Install dependencies:
```bash
npm install
```

## Local Development
1. Start development server:
```bash
npm run dev
```

2. Run Firebase emulators:
```bash
npm run firebase:emulators
```

## Build Process
1. Test build locally:
```bash
npm run build
```

2. Run type checking:
```bash
npm run type-check
```

3. Run linting:
```bash
npm run lint
```

## Deployment Process

### Manual Deployment
1. Build the application:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
npm run deploy
```

### Automated Deployment (GitHub Actions)
1. Set up GitHub secrets:
   - FIREBASE_API_KEY
   - FIREBASE_AUTH_DOMAIN
   - FIREBASE_PROJECT_ID
   - FIREBASE_STORAGE_BUCKET
   - FIREBASE_MESSAGING_SENDER_ID
   - FIREBASE_APP_ID
   - FIREBASE_SERVICE_ACCOUNT

2. Push to main branch to trigger deployment:
```bash
git push origin main
```

## Post-Deployment Verification

1. Check Firebase Console for:
   - Hosting status
   - Functions deployment
   - Database rules

2. Verify app functionality:
   - Authentication
   - Game mechanics
   - Admin features
   - Social features

3. Monitor performance:
   - Firebase Performance
   - Error reporting
   - Analytics

## Rollback Procedure

1. Using Firebase Console:
   - Go to Hosting
   - Select previous deployment
   - Click "Rollback"

2. Using CLI:
```bash
firebase hosting:clone VERSION_ID CHANNEL_ID
```

## Maintenance

1. Regular tasks:
   - Check error logs
   - Monitor performance
   - Update dependencies
   - Backup database

2. Update process:
   - Test in staging
   - Deploy to production
   - Monitor for issues
   - Be ready to rollback

## Troubleshooting

### Common Issues:
1. Build failures:
   - Check "use client" directives
   - Verify dependencies
   - Check TypeScript errors

2. Deployment failures:
   - Verify environment variables
   - Check Firebase configuration
   - Verify GitHub secrets

3. Runtime issues:
   - Check Firebase Console
   - Monitor error reporting
   - Verify database rules