# FinQuest - Financial Literacy Game

A full-stack web application that gamifies financial literacy education through interactive scenarios and AI-powered financial agents.

## 🏗️ Project Structure

```
technica_hackathon/
├── backend/                    # Node.js/TypeScript/Express backend
│   ├── src/
│   │   ├── config/            # Environment configuration
│   │   │   └── env.ts
│   │   ├── models/            # TypeScript interfaces
│   │   │   └── GameState.ts
│   │   ├── services/          # Business logic layer
│   │   │   ├── nessieService.ts    # Capital One Nessie API integration
│   │   │   ├── aiService.ts        # AI/LLM integration
│   │   │   └── gameLogic.ts        # Game state management
│   │   ├── controllers/       # Route handlers
│   │   │   ├── gameController.ts
│   │   │   └── agentController.ts
│   │   ├── routes/            # API routes
│   │   │   ├── gameRoutes.ts
│   │   │   ├── agentRoutes.ts
│   │   │   └── healthRoutes.ts
│   │   └── index.ts           # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/                   # React/TypeScript/Vite frontend
    ├── src/
    │   ├── api/               # Backend API clients
    │   │   ├── gameApi.ts
    │   │   └── agentApi.ts
    │   ├── types/             # TypeScript type definitions
    │   │   └── game.ts
    │   ├── components/        # Reusable UI components
    │   │   ├── HUDPanel.tsx
    │   │   ├── DialoguePanel.tsx
    │   │   ├── ChoicePanel.tsx
    │   │   ├── MoodSelector.tsx
    │   │   ├── SettingsPanel.tsx
    │   │   └── MoneyPlaybookView.tsx
    │   ├── pages/             # Main application pages
    │   │   ├── GameScreen.tsx
    │   │   └── InvestingDistrict.tsx
    │   ├── styles/            # Global styles
    │   │   └── global.css
    │   ├── App.tsx            # Main app component
    │   └── main.tsx           # Application entry point
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── index.html
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` file and add your API keys:
```
PORT=4000
NODE_ENV=development
NESSIE_API_KEY=your_nessie_api_key_here
AI_API_KEY=your_ai_api_key_here
FRONTEND_URL=http://localhost:5173
```

5. Start the development server:
```bash
npm run dev
```

The backend will be running at `http://localhost:4000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be running at `http://localhost:5173`

## 📡 API Endpoints

### Game Endpoints

- **GET** `/api/game/state` - Get current game state
- **POST** `/api/game/choice` - Submit a player choice
- **GET** `/api/game/playbook` - Get money playbook summary

### Agent Endpoints

- **POST** `/api/agent/:agentName` - Get message from specific AI agent
  - Available agents: `mentor`, `spenderSam`, `saverSiya`, `crisis`, `futureYou`, `translator`
- **POST** `/api/agent/mentor/advice` - Get personalized financial advice

### Health Check

- **GET** `/api/health` - Server health check

## 🎮 Features

### Current Features

- **Interactive Game Screen**: Main gameplay interface with event scenarios
- **Financial Dashboard (HUD)**: Real-time display of checking, savings, investment balances, and health score
- **AI Agent Dialogue**: Messages from various financial personality agents
- **Choice System**: Multiple-choice decision making with consequences
- **Mood Tracking**: Player emotional state affects gameplay
- **Accessibility Settings**: High contrast mode and adjustable font sizes
- **Investing District**: Placeholder page for future investing module

### AI Agents

1. **Mentor** - Provides balanced financial guidance
2. **Spender Sam** - Encourages spending and enjoyment
3. **Saver Siya** - Promotes saving and frugality
4. **Crisis Alert** - Warns about urgent financial situations
5. **Future You** - Provides long-term perspective
6. **Translator** - Explains financial jargon in simple terms

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **CORS**: Enabled for frontend communication
- **Package Manager**: npm

### Frontend
- **Library**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Router**: React Router DOM (ready to integrate)
- **Styling**: Inline styles (can be replaced with Tailwind CSS or styled-components)

## 📝 Development Workflow

### Running Both Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 🔧 TODO: Future Implementation

### Backend TODOs

1. **Nessie API Integration** (`nessieService.ts`)
   - Implement actual Capital One Nessie API calls
   - Handle customer creation
   - Manage accounts and transactions
   - Track real balances

2. **AI/LLM Integration** (`aiService.ts`)
   - Connect to OpenAI, Anthropic, or other LLM provider
   - Implement agent-specific prompts
   - Add mood-aware response generation
   - Generate personalized financial advice

3. **Game Logic** (`gameLogic.ts`)
   - Implement sophisticated event generation
   - Add difficulty curve
   - Create more diverse scenarios
   - Implement state persistence (database)
   - Add multiplayer support

4. **Authentication**
   - Add user authentication system
   - Implement JWT tokens
   - Create user profiles

### Frontend TODOs

1. **Investing District**
   - Build investment education module
   - Add stock market simulation
   - Create portfolio management interface
   - Implement investing challenges

2. **Enhanced UI/UX**
   - Add animations and transitions
   - Implement sound effects
   - Add loading skeletons
   - Improve mobile responsiveness

3. **Additional Features**
   - Add achievement/badge system
   - Implement leaderboards
   - Create tutorial/onboarding flow
   - Add data visualization for financial progress

## 🎯 Game Mechanics

### Health Score
- Ranges from 0-100
- Affected by financial decisions
- Reflects overall financial wellness

### Balance Types
- **Checking**: Day-to-day spending money
- **Savings**: Emergency fund and short-term savings
- **Investment**: Long-term wealth building

### Mood System
- **Anxious** 😰: Affects risk tolerance
- **Okay** 😐: Neutral state
- **Confident** 😊: More willing to take calculated risks

## 📚 Learning Resources

The game teaches:
- Budgeting basics
- Emergency fund importance
- Investment fundamentals
- Risk vs. reward
- Long-term financial planning
- Understanding financial terminology

## 🤝 Parallel Development

This project is structured to allow two developers to work simultaneously:

**Developer 1 (Backend)**: Can focus on implementing API integrations, game logic, and database operations without touching frontend code.

**Developer 2 (Frontend)**: Can work on UI/UX improvements, new components, and pages using the mock API responses already in place.

## 📄 License

MIT License - Feel free to use this project for educational purposes.

## 📱 Mobile QA

### Acceptance Criteria

#### iPhone 15 Pro (iOS)

**Layout & Safe Areas**
- ✅ `viewport-fit=cover` respected; no content obscured under Dynamic Island or home indicator
- ✅ Status bar area (top) and home indicator area (bottom) have appropriate safe-area padding
- ✅ All interactive elements respect `env(safe-area-inset-*)` variables

**Touch Targets**
- ✅ All buttons and interactive elements ≥ 44pt minimum height
- ✅ Tap targets have 8-12px internal padding
- ✅ No accidental taps due to elements being too small or too close together

**PWA Installation**
- ✅ When installed to Home Screen:
  - App launches in standalone mode (no Safari UI)
  - `apple-mobile-web-app-status-bar-style` is `black-translucent`
  - Theme color (#0B132B) applied to status bar
  - App icon displays correctly (192x192, 512x512)
- ✅ "Add to Home Screen" prompt shows instructions via Share button

**Offline & Updates**
- ✅ Offline app shell loads when network is unavailable
- ✅ Update banner appears on new deploy with "Reload" button
- ✅ Service worker caches static assets and API responses (GET only)
- ✅ Navigation fallback to `/index.html` works offline

**Accessibility**
- ✅ Focus indicators are WCAG AA compliant (3px outline with accent color)
- ✅ Text contrast meets WCAG AA standards (4.5:1 minimum)
- ✅ Font sizes scale with iOS Dynamic Type settings

#### Samsung Galaxy S23 Ultra (Android)

**Layout & Touch**
- ✅ All buttons and interactive elements ≥ 48dp minimum height
- ✅ Large screen width (~412-480 CSS px) handled with responsive layout
- ✅ Tap targets use `clamp()` for fluid scaling based on viewport

**Edge Gesture Safety**
- ✅ No interactive elements within 8px of left/right screen edges
- ✅ `--edge-safe` CSS variable (min 8px) applied to containers
- ✅ No accidental back swipe when tapping leftmost buttons
- ✅ `.container-safe` class provides 12px minimum edge padding

**Performance**
- ✅ Smooth 60fps scrolling in main panels and lists
- ✅ No jank during transitions or animations
- ✅ `touch-action: manipulation` prevents double-tap zoom delay
- ✅ `-webkit-tap-highlight-color: transparent` removes tap flash

**Accessibility**
- ✅ High-contrast mode remains legible at 480 CSS px width
- ✅ Large text mode (20px) flows correctly without overflow
- ✅ Focus indicators scale appropriately for touch input
- ✅ `prefers-reduced-motion` disables all animations

**PWA Installation**
- ✅ `beforeinstallprompt` event shows install banner with [Install] [Later] buttons
- ✅ Installed app uses standalone display mode
- ✅ Theme color (#0B132B) applied to system UI
- ✅ Offline functionality works (NetworkFirst strategy for API)

### Testing Scripts

Run Lighthouse PWA audit:
```bash
cd frontend
npm run lighthouse:pwa
```

This will:
1. Build the production bundle
2. Run Lighthouse PWA checks (installability, offline support, performance)
3. Open results in browser

**Expected Lighthouse PWA Score**: ≥ 90/100

### Manual Testing Checklist

**iOS (Safari + Installed PWA)**
- [ ] Install app via Share → Add to Home Screen
- [ ] Launch from Home Screen (standalone mode)
- [ ] Verify status bar color and style
- [ ] Test offline mode (airplane mode)
- [ ] Deploy new version and verify update banner appears
- [ ] Check safe-area padding around notch and home indicator
- [ ] Verify all buttons are tappable (≥44pt)

**Android (Chrome + Installed PWA)**
- [ ] Install app via Chrome's "Install" prompt
- [ ] Launch from Home Screen (standalone mode)
- [ ] Test edge gesture safety (no accidental back swipes)
- [ ] Verify offline mode works
- [ ] Check 60fps scrolling performance
- [ ] Test high-contrast mode and large text
- [ ] Verify all buttons are tappable (≥48dp)

### Device Testing Matrix

| Device | OS Version | Browser | Status |
|--------|-----------|---------|--------|
| iPhone 15 Pro | iOS 17+ | Safari | ✅ Tested |
| iPhone 15 Pro | iOS 17+ | PWA Installed | ✅ Tested |
| Samsung Galaxy S23 Ultra | Android 13+ | Chrome | ✅ Tested |
| Samsung Galaxy S23 Ultra | Android 13+ | PWA Installed | ✅ Tested |
| iPad Pro 11" | iPadOS 17+ | Safari | ⏳ Planned |
| Google Pixel 8 Pro | Android 14+ | Chrome | ⏳ Planned |

### Known Issues

- **iOS Safari**: Service worker update prompt may not appear immediately (requires page refresh)
- **Android Chrome**: Install prompt dismissal persists for 7 days (localStorage)
- **Low-end devices**: Initial bundle load may take 1-2 seconds on 3G connections

## 🙋 Support

For questions or issues, please create an issue in the repository or contact the development team.

---

**Happy Coding! 💰🎮**
