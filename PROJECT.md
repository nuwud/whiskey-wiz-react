# WhiskeyWiz Project Documentation

## Project Stack
- Framework: Vite + React (NOT Next.js)
- Language: TypeScript
- UI: Tailwind CSS + shadcn/ui
- Backend: Firebase
- Build System: Vite

## Important Notes for Future Development
1. This is a Vite project
   - Do NOT migrate to Next.js
   - Keep using Vite build configurations
   - Entry point is src/main.tsx

2. File Structure
   ```
   src/
   ├── components/
   │   ├── ui/          # shadcn components
   │   ├── common/      # shared components
   │   ├── game/        # game-specific components
   │   └── admin/       # admin dashboard components
   ├── hooks/           # custom React hooks
   ├── contexts/        # React contexts
   ├── services/        # Firebase services
   └── lib/            # utility functions
   ```

3. Build & Deploy
   - Build command: `vite build`
   - Output directory: `dist/`
   - Deploy to Firebase hosting

4. Dependencies
   - Keep shadcn/ui components in src/components/ui
   - Maintain PostCSS config in postcss.config.cjs
   - Firebase configuration in src/lib/firebase.ts

## Common Mistakes to Avoid
1. Do not convert to Next.js - this is a Vite project
2. Keep using .cjs extension for CommonJS config files
3. Do not move UI components from src/components/ui
4. Maintain Firebase hosting configuration

## Component Guidelines
1. Use shadcn/ui components from src/components/ui
2. Follow Tailwind class naming conventions
3. Maintain error boundaries and loading states

## Build Process
1. Run type check: `tsc --noEmit`
2. Build: `vite build`
3. Deploy: `firebase deploy`