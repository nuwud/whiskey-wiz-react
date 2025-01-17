# Next.js to Vite Migration

## Changes Made
1. Build System
   - Migrated from Next.js to Vite
   - Updated build scripts in package.json
   - Added Vite-specific configurations

2. Environment Variables
   - Changed from NEXT_PUBLIC_ to VITE_ prefix
   - Updated Firebase configuration to use Vite env vars

3. File Structure Changes
   - Removed Next.js specific files (next.config.js, etc.)
   - Restructured pages to components
   - Updated import paths

## Remaining Tasks
1. TypeScript Fixes
   - Fix file casing consistency
   - Update service interfaces
   - Fix test configurations

2. UI Components
   - Add missing shadcn components
   - Update component props

3. Firebase Integration
   - Update service imports/exports
   - Fix database types

## Environment Setup
Required environment variables:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_DATABASE_URL=
```

## Development Notes
- Run `npm run dev` for development
- Run `npm run build` for production build
- Run `npm run deploy` for Firebase deployment (requires Firebase CLI login)
