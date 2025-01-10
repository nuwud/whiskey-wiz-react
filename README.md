# BlindBarrels.com - Whiskey Tasting Game (Next.js)

> **Important Update**: This project has been migrated from Create React App to Next.js for improved performance and features.

## Overview
A quarterly whiskey tasting game where users try to identify whiskey characteristics and compete for points.

### Core Features
- Quarterly whiskey tasting challenges
- Point-based scoring system
- Firebase authentication
- Admin management interface
- Feature toggle system

## Technical Stack
- Next.js 13 (App Router)
- TypeScript
- Firebase (Firestore, Authentication)
- Shadcn/UI Components
- Tailwind CSS

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Feature Management
The admin interface allows toggling various features:

### Essential Features (Always On)
- Core game mechanics
- Basic authentication
- Admin controls

### Optional Features
- Advanced Statistics
- Social Sharing
- Achievements System
- Leaderboards
- Practice Mode
- Seasonal Events

## Documentation
- [Development Guide](docs/DEVELOPMENT.md)
- [Feature Toggle System](docs/FEATURE_TOGGLES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Local Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Deployment

### Production Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Firebase Deployment
```bash
# Deploy to Firebase
firebase deploy
```

## Project Structure
```
blindbarrels/
├── app/                  # Next.js app directory
├── components/           # React components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utility functions
├── public/              # Static assets
└── styles/              # Global styles
```

## License
Proprietary - All Rights Reserved

## Contact
Bobbie DeMars - BlindBarrels.com