# Career Co-pilot - Mock Interview Simulator

A production-quality prototype web application that simulates technical interviews using AI. Users can practice interviews for specific job roles with an AI interviewer powered by Google's Gemini AI.

## Features

- **Mock Interview Simulator**: AI-powered interviewer that asks relevant questions based on job role
- **Voice Interaction**: Speak your answers and hear AI responses
- **Real-time Transcription**: Speech-to-text conversion using Google Cloud
- **AI Evaluation**: Gemini AI provides feedback and follow-up questions
- **Session Management**: Track and review interview conversations

## Tech Stack

### Frontend (`/client`)
- React 18 with Vite and TypeScript
- Tailwind CSS for styling
- shadcn/ui components for polished UI
- Axios for API communication

### Backend (`/server`)
- Node.js with Express and TypeScript
- Google Cloud SDKs:
  - Speech-to-Text API
  - Text-to-Speech API
  - Gemini AI API
  - Firestore (for data persistence)

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Google Cloud Platform Account** with the following APIs enabled:
   - Speech-to-Text API
   - Text-to-Speech API
   - Gemini AI API
   - Firestore API
3. **Google Cloud Service Account** with appropriate permissions

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Google Cloud Configuration

1. Create a new Google Cloud project or select an existing one
2. Enable the required APIs:
   - Speech-to-Text API
   - Text-to-Speech API
   - Gemini AI API
   - Firestore API
3. Create a service account and download the JSON key file
4. Place the service account key file in the `server` directory

### 3. Environment Variables

Create a `.env` file in the `server` directory:

```env
GOOGLE_APPLICATION_CREDENTIALS=./your-service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-gemini-api-key
PORT=3001
```

### 4. Run the Application

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend client
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usage

1. **Select Job Role**: Enter your target job role (e.g., "Junior DevOps Engineer")
2. **Start Interview**: Click "Start Interview" and grant microphone access
3. **Answer Questions**: Click "Record Answer", speak your response, then click "Stop Recording"
4. **Receive Feedback**: Listen to AI feedback and the next question
5. **Continue**: Repeat the process until you're satisfied with the interview

## Project Structure

```
career_co-pilot/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── index.ts       # Express server setup
│   │   └── interview.controller.ts # Interview logic
│   ├── package.json       # Backend dependencies
│   └── tsconfig.json      # TypeScript configuration
├── package.json            # Root package.json for scripts
└── README.md              # This file
```

## API Endpoints

### POST /api/interview
Processes user audio input and returns AI response.

**Request Body:**
```json
{
  "audio": "base64-encoded-audio-string",
  "conversationHistory": [
    {
      "role": "user|model",
      "parts": [{"text": "string"}]
    }
  ],
  "jobRole": "string"
}
```

**Response:**
```json
{
  "newHistory": [...],
  "responseAudio": "base64-encoded-audio-string"
}
```

## Development

### Available Scripts

```bash
# Root level
npm run dev:client    # Start frontend in development mode
npm run dev:server    # Start backend in development mode
npm run build         # Build both client and server
npm run start         # Start production server

# Client
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Server
npm run dev           # Start with nodemon
npm run build         # Build TypeScript
npm run start         # Start production server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is created for hackathon purposes. Please ensure compliance with Google Cloud Platform terms of service and any applicable licensing requirements.
