# Whiskey Wiz - React Edition

## Project Overview
Whiskey Wiz is an interactive web application for whiskey tasting enthusiasts, allowing users to play quarterly whiskey guessing games.

### Core Features
- Quarterly whiskey tasting challenges
- Point-based scoring system
- Firebase authentication
- Admin management interface
- Shareable results

## Technical Stack
- React (v18+)
- TypeScript
- Firebase (Firestore, Authentication)
- React Router
- Shadcn/UI Components
- Recharts for visualizations

## Game Mechanics
- 4 whiskey samples per quarter
- Guess attributes:
  - Age
  - Proof
  - Mashbill Type
- Scoring based on accuracy
- Leaderboard functionality

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
- Create `.env` file
- Add Firebase configuration variables
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
...
```

4. Run the application
```bash
npm start
```

## Development Roadmap
- [x] Project initialization
- [ ] Firebase authentication
- [ ] Game component development
- [ ] Scoring system implementation
- [ ] Admin interface
- [ ] Mobile responsiveness
- [ ] Testing and refinement

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Proprietary - All Rights Reserved

## Contact
Project Lead: [Your Name]
Email: [Your Email]