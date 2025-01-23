#!/bin/bash

# Whiskey Wiz React Project Initialization Script

# Check Node.js version
node_version=$(node --version)
required_version="v20.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Node.js version must be at least $required_version"
    exit 1
fi

# Create React App
npx create-react-app whiskey-wiz --template typescript
cd whiskey-wiz

# Install additional dependencies
npm install \
    firebase \
    react-router-dom \
    @types/react-router-dom \
    recharts \
    shadcn-ui \
    @emotion/react \
    @emotion/styled

# Create initial project structure
mkdir -p src/components/game \
           src/components/admin \
           src/services \
           src/models \
           src/hooks \
           src/contexts

# Create .env template
echo "# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=" > .env.example

# Git initialization
git init
git add .
git commit -m "Initial project setup"

echo "Whiskey Wiz React project initialized successfully!"
