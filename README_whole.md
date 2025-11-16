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

## 🙋 Support

For questions or issues, please create an issue in the repository or contact the development team.

---

**Happy Coding! 💰🎮**
