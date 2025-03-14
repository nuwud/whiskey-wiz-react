# Repository Structure Overview

This document provides an overview of the repository structure for the Whiskey Wiz React application.

## Root Directory

The root directory contains configuration files for various tools and build systems used in the project:

- `.devcontainer/` - Development container configuration for consistent development environments
- `.env.local` - Environment variables for local development
- `.firebaserc` - Firebase project configuration
- `.github/` - GitHub Actions workflows and templates
- `.husky/` - Git hooks for code quality
- `docs/` - Documentation files
- `public/` - Static assets served by the web server
- `scripts/` - Utility scripts for development and deployment
- `src/` - Main application source code

### Key Configuration Files

- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build tool configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration for CSS processing
- `firebase.json` - Firebase hosting and services configuration
- `firestore.rules` - Security rules for Firestore database
- `firestore.indexes.json` - Index definitions for Firestore queries

## Source Code Structure

The `src/` directory contains the main application code organized into several subdirectories:

- `components/` - React components for UI elements and features
- `config/` - Application configuration
- `contexts/` - React context providers
- `elements/` - Reusable UI elements
- `hooks/` - Custom React hooks
- `lib/` - Shared libraries and utilities
- `models/` - Data models and interfaces
- `routes/` - Route components and configuration
- `services/` - Service classes for data access and API calls
- `store/` - State management (likely Redux)
- `styles/` - CSS and styling files
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

### Main Entry Points

- `src/main.tsx` - Main entry point for the application
- `src/App.tsx` - Root application component

This document serves as a high-level overview. More detailed documentation for each directory is available in separate markdown files.