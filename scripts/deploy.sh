#!/bin/bash

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

# Function to print colored output
log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    error "Missing .env.local file"
    exit 1
}

# Clean install dependencies
log "Installing dependencies..."
if ! npm ci; then
    error "Failed to install dependencies"
    exit 1
}

# Run tests
log "Running tests..."
if ! npm test; then
    warning "Tests failed. Continue? (y/n)"
    read -r continue
    if [ "$continue" != "y" ]; then
        exit 1
    fi
}

# Build the application
log "Building application..."
if ! npm run build; then
    error "Build failed"
    exit 1
}

# Deploy to Firebase
log "Deploying to Firebase..."
if ! firebase deploy; then
    error "Firebase deployment failed"
    exit 1
 fi

log "Deployment complete!"