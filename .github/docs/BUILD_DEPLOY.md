# Build and Deployment Guide

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "firebase": "^10.7.0",
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.9.0"
  }
}
```

### UI Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-switch": "^1.0.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.290.0",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

### Form Handling
```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.4"
  }
}
```

## Build Process

1. Install Dependencies:
```bash
npm install
# or
pnpm install
```

2. Environment Setup:
```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
```

3. Development:
```bash
npm run dev
# or
pnpm dev
```

4. Production Build:
```bash
npm run build
# or
pnpm build
```

## Deployment

### Firebase Deployment

1. Firebase Setup:
```json
// firebase.json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

2. Deploy Command:
```bash
firebase deploy
```

### Required Firebase Services
- Authentication
- Firestore Database
- Hosting
- Analytics (optional)

## Environment Checklist

### Development
1. Node.js >=16.x
2. npm or pnpm
3. Firebase CLI
4. Git

### Production
1. Firebase project setup
2. Domain configuration
3. Environment variables
4. SSL certificates

## Testing Before Deploy

1. Unit Tests:
```bash
npm run test
```

2. Build Test:
```bash
npm run build
```

3. Local Production Test:
```bash
npm run start
```

## Monitoring

1. Firebase Services:
- Real-time Database usage
- Authentication status
- Hosting metrics

2. Application Metrics:
- User sessions
- Game completions
- Error rates

## Rollback Plan

1. Keep previous versions tagged
2. Document deployment steps
3. Maintain backup of:
   - Database
   - User data
   - Configuration

## Notes for MCPs
1. Check all dependencies match
2. Verify environment variables
3. Test build before deploy
4. Document any changes