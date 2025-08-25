# 🚀 Personalized Career and Skills Advisor

A dynamic, AI-powered career advisory tool that analyzes user profiles, maps them to the current job market, and generates personalized, actionable career roadmaps. Built for the Google Cloud Gen AI Exchange hackathon.

## ✨ Features

- **Resume Analysis**: PDF parsing and skill extraction using AI
- **Market Trend Integration**: Real-time tech industry trend analysis
- **Personalized Roadmaps**: AI-generated learning paths with visual skill graphs
- **Interactive Visualization**: Clickable skill nodes with curated learning resources
- **Smart Recommendations**: Context-aware skill suggestions based on interests and goals

## 🏗️ Architecture

### Frontend (`/client`)
- **React 18** with **Vite** and **TypeScript**
- **Tailwind CSS** for modern, responsive styling
- **shadcn/ui** components for polished UI
- **PDF.js** for client-side resume parsing
- **React Flow** for interactive skill graph visualization
- **React Router** for navigation

### Backend (`/server`)
- **Node.js** with **Express** and **TypeScript**
- **Google Cloud Gemini AI** for intelligent analysis
- **Firestore** for data persistence
- **Hacker News API** for market trend analysis

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Google Cloud Platform account
- Gemini API key

### Installation

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Environment Setup

1. **Server Environment** (`server/.env`):
```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-gemini-api-key
PORT=3001
```

2. **Client Environment** (`client/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### Run the Application

```bash
# Start both services
npm run dev

# Or start individually:
npm run dev:server    # Backend on port 3001
npm run dev:client    # Frontend on port 5173
```

## 📱 User Flow

1. **Onboarding**: Upload resume, define interests, set career goals
2. **Analysis**: AI processes resume and generates skill profile
3. **Dashboard**: View personalized roadmap with interactive skill graph
4. **Interaction**: Click skill nodes for learning resources and details

## 🔧 API Endpoints

### POST `/api/generate-roadmap`
Generates personalized career roadmap based on user input.

**Request Body:**
```json
{
  "resumeText": "string",
  "interests": "string", 
  "goal": "string"
}
```

**Response:**
```json
{
  "nodes": [...],
  "edges": [...],
  "profileSummary": "string"
}
```

## 🎯 Tech Highlights

- **Multi-Prompt AI Chain**: Sophisticated Gemini API integration
- **Real-time Market Data**: Hacker News API integration for trends
- **Interactive Graphs**: React Flow for skill visualization
- **PDF Processing**: Client-side resume parsing
- **Responsive Design**: Mobile-first Tailwind implementation

## 📁 Project Structure

```
career-advisor/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   └── lib/           # Utilities
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # API logic
│   │   └── index.ts       # Server setup
│   └── package.json
└── package.json            # Root scripts
```

## 🎨 UI Components

- **Multi-step Form**: Guided onboarding experience
- **File Upload**: Drag-and-drop PDF resume handling
- **Skill Graph**: Interactive node-based visualization
- **Profile Summary**: AI-generated career insights
- **Resource Modal**: Curated learning materials

## 🔒 Security & Best Practices

- Environment-based configuration
- Input validation and sanitization
- CORS protection
- Google Cloud best practices
- TypeScript for type safety

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy backend to Google Cloud Run
cd server && npm run deploy

# Deploy frontend to any static hosting
cd client && npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
