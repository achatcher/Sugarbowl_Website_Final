# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SugarBowl Website is a single-page application (SPA) for a dive bar/restaurant featuring:
- Static HTML/CSS/JavaScript architecture (no build tools required)
- Progressive Web App (PWA) capabilities
- Google Calendar API integration for events
- AWS GraphQL API integration for menu and burger specials
- Responsive design with grunge/dive bar aesthetic

## Development Commands

This is a static website with no build process. Development is done by:
- Opening `index.html` directly in a browser, OR
- Using a local development server: `python -m http.server 8000` or `npx live-server`

**Note**: The `npm run dev` script exists but references Next.js which is not actually used. This project is purely static HTML/CSS/JS.

## Architecture

### File Structure
- `/index.html` - Main SPA with all sections in single file
- `/js/` - JavaScript modules (vanilla JS, no framework)
  - `main.js` - Core navigation and page management 
  - `calendar.js` - Google Calendar integration with fallback local events
  - `api-service.js` - AWS GraphQL client for menu/burger data
  - `burger-special.js` - Weekly burger special management
  - `menu.js` - Menu display and filtering
  - `happy-hour.js` - Happy hour specials
  - `carousels.js` - Image carousel functionality
- `/css/` - Stylesheets with grunge/dive bar theme
- `/img/` - Static assets including event photos and food images

### Key Features
1. **Single Page Navigation**: Uses hash routing (`#home`, `#events`, etc.) with main.js handling page switches
2. **Calendar System**: Google Calendar API with comprehensive local event fallback
3. **Menu Management**: AWS GraphQL API integration with caching
4. **PWA Support**: Service worker, manifest.json for mobile app-like experience

### API Integrations

#### Google Calendar API
- Located in `js/calendar.js`
- Requires API key and Calendar ID configuration
- Falls back to local events if API unavailable
- Configuration in `CONFIG` object at top of calendar.js

#### AWS GraphQL API
- Located in `js/api-service.js`
- Endpoint: `https://364vw33yefgirm4lhvwegdop4a.appsync-api.us-east-2.amazonaws.com/graphql`
- API key already configured
- Handles menu items and burger specials

## Configuration

### Google Calendar Setup
To enable live calendar integration, update `js/calendar.js`:
```javascript
const CONFIG = {
    googleCalendarId: 'YOUR_CALENDAR_ID_HERE',
    apiKey: 'YOUR_API_KEY_HERE',
    syncEnabled: true
};
```

### Content Management
- **Events**: Edit local events in `calendar.js` or use Google Calendar
- **Menu Items**: Managed via AWS GraphQL API
- **Burger Specials**: Managed via AWS GraphQL API
- **Hours & Info**: Hardcoded in `index.html`
- **Recurring Events**: Configured in `RECURRING_EVENTS` object in calendar.js

## Development Guidelines

### Code Style
- Vanilla JavaScript (ES6+) with module pattern
- CSS custom properties for theming
- BEM-like CSS naming conventions
- Comprehensive accessibility features (ARIA labels, keyboard navigation)

### Key Architectural Patterns
1. **Module Pattern**: Each JS file uses IIFE to avoid global namespace pollution
2. **Event-Driven**: Heavy use of DOM events for component communication
3. **Progressive Enhancement**: Works without JavaScript, enhanced with JS
4. **Mobile-First**: Responsive design with touch/swipe support

### Testing
- No automated tests configured
- Test manually by opening index.html in browsers
- Test PWA functionality using browser dev tools
- Test API integrations by checking browser network tab

## Important Notes

- **No Build Process**: Direct file editing, no transpilation needed
- **API Keys**: Google Calendar API key needs to be configured for live events
- **Local Development**: Use local server to avoid CORS issues with APIs
- **Browser Compatibility**: Modern browsers only (ES6+ features used)
- **PWA Features**: Service worker handles offline caching of static assets