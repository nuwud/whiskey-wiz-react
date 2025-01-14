# WhiskeyWiz Deployment Guide

## Prerequisites
- Node.js (v18+)
- npm (v9+)
- Firebase CLI
- Firebase Account

## Local Setup
1. Clone the repository
2. Install dependencies
```bash
npm ci
```

## Development
```bash
npm run dev
```

## Testing
```bash
npm test
```

## Firebase Deployment

### Initial Setup
1. Login to Firebase
```bash
firebase login
```

2. Select the correct Firebase project
```bash
firebase use whiskeywiz2
```

### Deployment Steps
1. Build the application
```bash
npm run build
```

2. Deploy to Firebase
```bash
npm run deploy
```

## Troubleshooting
- Ensure all environment variables are correctly set
- Verify Firebase project configuration
- Check network connections

## Verification
- Visit https://whiskeywiz2.firebaseapp.com
- Test core game functionality
- Verify admin dashboard access
