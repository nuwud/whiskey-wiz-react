#!/bin/bash

# Deployment Preparation Script

# Exit on first error
set -e

# Check Node.js and npm versions
echo "Checking Node.js and npm versions..."
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run linter with auto-fix
echo "Running ESLint auto-fix..."
npm run lint:fix

# Run type checking
echo "Checking TypeScript types..."
npm run type-check

# Build the application
echo "Building the application..."
npm run build

# Run tests
echo "Running tests..."
npm test

# Optional: Firebase project verification
echo "Verifying Firebase project..."
firebase projects:list
firebase use whiskeywiz2

echo "Deployment preparation complete!"
