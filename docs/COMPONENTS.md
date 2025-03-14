# Components Overview

This document provides an overview of the component structure in the Whiskey Wiz React application.

## Component Organization

The components are organized into logical groups based on functionality:

### Root Components

- `error-boundary.component.tsx` - Error boundary for handling component errors
- `loading-state.component.tsx` - Loading state indicators
- `game-progress-tracker.component.tsx` - Tracks player progress through the game
- `seasonal-trends.component.tsx` - Displays seasonal whiskey trends
- `whiskey-recommendations.component.tsx` - Provides whiskey recommendations based on user preferences
- `shopify-integration.component.tsx` - Integration with Shopify for e-commerce
- `accessibility-settings.component.tsx` - Settings for application accessibility

### Subdirectories

#### Admin Components (`/admin`)

Components for administrative functionality, likely including:
- Managing whiskey data
- User management
- Quarter management

#### Authentication Components (`/auth`)

Components for user authentication, including:
- Login/Signup
- Password recovery
- Authentication forms

#### Common Components (`/common`)

Reusable components shared across the application.

#### Game Components (`/game`)

The core game functionality components:

- `game-container.component.tsx` - Main container for the game flow
- `game-board.component.tsx` - Game board display
- `quarter-selection.component.tsx` - Selection of quarterly whiskey boxes
- `sample-guessing.component.tsx` - Interface for guessing whiskey characteristics
- `sample-result.component.tsx` - Display of individual sample results
- `game-results.component.tsx` - Overall game results display
- `score-board.component.tsx` - Scoreboard for tracking points
- `score-display.component.tsx` - Visual display of scores
- `share-results.component.tsx` - Functionality to share results
- `game-over.component.tsx` - Game completion display
- `challenge.component.tsx` - Challenge mode components

#### Guest Components (`/guest`)

Components for guest/unauthenticated user experiences.

#### Layout Components (`/layout`)

Components for page layout structure:
- Header/Footer
- Navigation
- Page layouts

#### Onboarding Components (`/onboarding`)

Components for user onboarding flows.

#### Player Components (`/player`)

Components related to player profiles and management.

#### Quarters Components (`/quarters`)

Components related to quarterly whiskey boxes and their management.

#### Results Components (`/results`)

Components for displaying and managing game results.

#### Shopify Components (`/shopify`)

Components specifically for Shopify e-commerce integration.

#### UI Components (`/ui`)

Reusable UI elements like buttons, forms, modals, etc.

## Component Patterns

The components follow a naming convention of `[feature]-[function].component.tsx` and are generally organized into feature-based directories. The component architecture appears to follow a composition pattern where more complex components are composed of smaller, reusable components.

Many components are likely connected to state management (Redux/Context) for data flow between components.