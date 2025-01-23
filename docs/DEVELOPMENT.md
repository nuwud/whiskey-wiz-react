# Development Guide

## Project Structure

```
whiskey-wiz-react/
├── src/
│   ├── app/                     # Next.js 14 App Router pages
│   │   ├── login/              # Login route
│   │   │   └── page.tsx        # Login page component
│   │   └── page.tsx            # Home page
│   ├── components/             # Reusable components
│   │   ├── auth/              # Authentication components
│   │   │   ├── Login.tsx      # Login component
│   │   │   └── ...
│   │   ├── common/            # Shared components
│   │   └── ...
│   └── lib/                   # Shared utilities
├── docs/                      # Documentation
│   ├── CHANGELOG.md           # Version history
│   └── DEVELOPMENT.md         # This file
└── package.json              # Project dependencies
```

## Authentication Flow

The authentication system uses Firebase Authentication with a custom UI:

1. User navigates to /login
2. Login component handles email/password auth
3. On success, user is redirected to the game
4. Protected routes use PrivateRoute component

## Component Guidelines

### Client Components

For components that need client-side interactivity:

```typescript
"use client";

import React from 'react';

export function ComponentName() {
  // Component logic
}
```

### Server Components

Default to Server Components when possible:

```typescript
import React from 'react';

export function ComponentName() {
  // Server-rendered content
}
```

## TypeScript & ESLint

The project uses TypeScript with strict ESLint rules:

- @typescript-eslint/parser for parsing
- @typescript-eslint/eslint-plugin for rules
- next/core-web-vitals preset

Configuration is in `.eslintrc.json`

## Development Workflow

1. Start development server:
   ```bash
   npm run dev
   ```

2. Check TypeScript:
   ```bash
   npm run type-check
   ```

3. Lint code:
   ```bash
   npm run lint
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Best Practices

1. Use named exports for components
2. Add "use client" directive for interactive components
3. Follow Next.js 14 App Router conventions
4. Keep components small and focused
5. Use TypeScript types for props