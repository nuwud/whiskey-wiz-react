# Whiskey Wiz - Next.js Edition

## Project Overview
Whiskey Wiz is an interactive web application for whiskey tasting enthusiasts, allowing users to play quarterly whiskey guessing games.

### Core Features
- Quarterly whiskey tasting challenges
- Point-based scoring system
- Firebase authentication
- Admin management interface
- Shareable results

### Optional Features
All optional features can be toggled by the admin:
- Advanced Statistics
- Social Sharing
- Achievements System
- Global Leaderboard
- Practice Mode
- Seasonal Events
- Profile Customization
- Whiskey Information Database

## Technical Stack
- Next.js 13 (App Router)
- TypeScript
- Firebase (Firestore, Authentication)
- Shadcn/UI Components
- Recharts for visualizations
- Tailwind CSS

## Setup and Installation

### Prerequisites
- Node.js (v20+)
- npm or yarn
- Firebase account

### Installation Steps
1. Clone the repository
```bash
git clone https://github.com/nuwud/whiskey-wiz-react.git
cd whiskey-wiz-react
```

2. Install dependencies
```bash
npm install
```

3. Firebase Configuration
- Create `.env.local` file
- Add Firebase configuration variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Development
```bash
npm run dev
```

5. Production Build
```bash
npm run build
npm start
```

## Feature Management

### Admin Controls
Access the admin panel at `/admin` to manage features:
- Enable/disable features
- View feature status
- Configure feature settings

### Available Toggles
- Core game features (always enabled)
- Optional features that can be toggled:
  * Social features
  * Analytics features
  * Extra gameplay modes
  * UI enhancements

### Toggle Effects
- Some features require page refresh
- UI adapts smoothly to feature changes
- Data persistence handled automatically

## Development Guidelines

### Adding New Features
1. Add feature definition to `src/config/features.ts`
2. Wrap component with feature toggle HOC
3. Add to admin interface
4. Test both enabled and disabled states

### Testing
```bash
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Proprietary - All Rights Reserved

## Contact
BlindBarrels.com - Bobbie DeMars