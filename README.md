# 🚀 Career Co-Pilot - Enhanced AI Career Guidance Platform

> **Built for Google Cloud Gen AI Exchange Hackathon** | **Winning-Ready MVP**

Career Co-Pilot is an intelligent, AI-powered career advisor that generates personalized learning roadmaps based on your skills, interests, and goals. Using advanced AI (Google Gemini) and deterministic skill matching, it provides fair, transparent career recommendations with structured 4-week learning plans.

## ✨ **Enhanced Features (Hackathon-Winning)**

### 🎯 **Core AI Features**
- **AI-Powered Recommendations**: Get top 3 career matches based on your profile
- **Structured Learning Plans**: 4-week roadmaps with topics, practice, assessment, and projects
- **Fair & Transparent**: No bias based on personal characteristics
- **Skill Visualization**: Interactive radar charts showing skill gaps and strengths
- **Resume Analysis**: Upload PDF/DOC to automatically extract skills
- **AI Career Coach**: 24/7 chatbot for career guidance and questions

### 📱 **Enhanced UI/UX**
- **Interactive Dashboard**: Progress tracking, skill analysis, and learning paths
- **Mobile-First Design**: Responsive across all devices
- **Real-time Progress**: Track completion percentages and milestones
- **Modern UI**: Beautiful gradients, animations, and micro-interactions
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### 🔧 **Technical Excellence**
- **Modular Architecture**: Clean, maintainable code structure
- **Error Handling**: Global error handling with retry mechanisms
- **Security**: Firestore rules, JWT validation, GDPR compliance
- **Performance**: Optimized API calls, caching, and loading states
- **Scalability**: Cloud Functions with proper resource management

### 💼 **Market-Ready Features**
- **Pricing Plans**: Free, Pro ($19/month), Enterprise ($99/month)
- **Landing Page**: Professional marketing site with testimonials
- **Analytics**: User behavior tracking and performance metrics
- **Data Privacy**: Complete user data deletion functionality

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloud          │    │   Google        │
│   (Enhanced UI) │◄──►│   Functions      │◄──►│   Gemini AI     │
│   - Dashboard   │    │   (Node.js)      │    │   - Analysis    │
│   - Landing     │    │   - Error Handle │    │   - Chat        │
│   - Mobile UI   │    │   - Retry Logic  │    │   - Resume Parse│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Firebase      │    │   Firestore      │
│   Hosting       │    │   Database       │
│   - Static Site │    │   - User Data    │
│   - CDN         │    │   - Analytics    │
└─────────────────┘    └──────────────────┘
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google Cloud account with Gemini API access
- Git

### **1. Clone & Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd career_co-pilot

# Install dependencies
npm run install:all
```

### **2. Firebase Configuration**
```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select your project or create new one
# Enable: Hosting, Functions, Firestore
# Use existing project: Yes
# Public directory: public
# Single-page app: Yes
# Functions language: JavaScript
# ESLint: No
# Install dependencies: Yes
```

### **3. Google Cloud Setup**
```bash
# Enable required APIs in Google Cloud Console:
# - Gemini API
# - Cloud Firestore API
# - Cloud Build API (optional)

# Get Gemini API key from:
# https://makersuite.google.com/app/apikey
```

### **4. Environment Configuration**
```bash
# Copy environment template
cd functions
cp env.example .env

# Edit .env file with your Gemini API key
GEMINI_API_KEY=your_actual_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id
ALLOWED_ORIGIN=http://localhost:5000
```

### **5. Update Firebase Config**
Edit `public/app.js` and replace the Firebase config with your actual values:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### **6. Run Locally**
```bash
# Start Firebase emulators
firebase emulators:start

# Or run simple HTTP server
cd public
python -m http.server 8000
```

### **7. Deploy**
```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

## 📱 **Pages & Features**

### **Landing Page** (`/landing.html`)
- Professional marketing site
- Problem statement and solution
- Feature showcase
- Pricing plans
- Testimonials
- Call-to-action sections

### **Main App** (`/index.html`)
- User onboarding
- Profile creation
- AI-powered recommendations
- Learning plan generation

### **Enhanced Dashboard** (`/dashboard-enhanced.html`)
- Interactive skill analysis
- Progress tracking
- AI career coach chat
- Resume upload
- Learning path management
- Real-time statistics

### **About Page** (`/about.html`)
- Company information
- Team details
- Mission and values

## 🧠 **AI Integration**

### **Gemini AI Features**
- **Career Recommendations**: Analyze skills and interests
- **Learning Path Generation**: Create structured 4-week plans
- **Skill Analysis**: Identify gaps and strengths
- **Chatbot**: Answer career-related questions
- **Resume Parsing**: Extract skills from uploaded documents

### **Deterministic Matching**
- Cosine similarity algorithm for skill matching
- Fair scoring system (no bias)
- Transparent fit score calculation
- Overlap and gap analysis

## 🔐 **Security & Privacy**

### **Authentication**
- Firebase Auth with Google Sign-In
- JWT token validation on all endpoints
- Secure token handling

### **Data Privacy**
- Firestore rules restrict data by user UID
- Complete data deletion functionality
- No sensitive attributes in AI prompts
- GDPR-compliant data handling

### **Error Handling**
- Global error handling with retry mechanisms
- User-friendly error messages
- Comprehensive logging for debugging
- Graceful fallbacks for API failures

## 📊 **Performance & Monitoring**

### **Analytics Events**
- `app_initialized`
- `profile_saved`
- `recommendations_generated`
- `plan_viewed`
- `pdf_exported`
- `resume_uploaded`
- `chat_message_sent`

### **Performance Metrics**
- **Time to First Insight**: < 3 seconds
- **Completion Rate**: Target 85%
- **User Satisfaction**: Target 78%
- **API Response Time**: < 2 seconds

## 🧪 **Testing**

### **Manual Testing**
```bash
# Run the manual test plan
# See manual_test_plan.md for detailed test cases
```

### **Unit Tests**
```bash
cd functions
npm test
```

### **Local Development**
```bash
# Start emulators
firebase emulators:start

# Test endpoints
curl http://localhost:5001/your-project/us-central1/app/api/health
```

## 🎯 **Hackathon Demo Script**

### **Opening (30 seconds)**
> "Hi judges! I'm excited to present Career Co-Pilot, an AI-powered career guidance platform that solves a real problem: generic career advice that doesn't consider individual skills and learning constraints."

### **Problem Statement (30 seconds)**
> "Students struggle with unclear career paths, expensive counseling, and biased recommendations. Our solution uses AI to provide personalized, fair, and actionable career guidance."

### **Live Demo (2 minutes)**

#### **Step 1: Landing Page**
- Show professional landing page
- Highlight problem-solution fit
- Demonstrate pricing strategy

#### **Step 2: Profile Creation**
- Navigate to main app
- Show skill input and validation
- Demonstrate resume upload feature

#### **Step 3: AI Analysis**
- Show loading states with progress indicators
- Highlight the 3-step process:
  - Analyzing skills & interests
  - Finding matching roles
  - Creating learning plans

#### **Step 4: Enhanced Dashboard**
- Display interactive skill radar chart
- Show progress tracking
- Demonstrate AI chatbot
- Highlight resume analysis results

#### **Step 5: Learning Plans**
- Open detailed 4-week roadmap
- Show structured content with progress bars
- Demonstrate PDF export functionality

### **Technical Highlights (1 minute)**
> "Our tech stack includes Google Gemini AI for intelligent recommendations, Firebase for scalable infrastructure, and deterministic skill matching for explainable results. We've implemented strict JSON validation, retry logic, and comprehensive error handling."

### **Innovation & Fairness (30 seconds)**
> "What makes us unique is our commitment to fairness - we never consider gender, caste, or college ranking. Instead, we focus purely on skills, interests, and learning capacity. Our cosine similarity algorithm provides transparent scoring."

### **Market Feasibility (30 seconds)**
> "We're targeting the Indian education market with a freemium model and campus licensing. Our MVP demonstrates the core value proposition with real user data and proven market demand."

### **Closing (30 seconds)**
> "Career Co-Pilot transforms generic career advice into personalized, actionable roadmaps. We're not just building another AI tool - we're building a fair, transparent career companion that grows with students. Thank you!"

## 🚀 **Deployment**

### **Production Deployment**
```bash
# Set production environment
firebase use production

# Deploy all services
firebase deploy

# Verify deployment
firebase hosting:channel:list
```

### **Environment Variables**
```bash
# Production config
firebase functions:config:set gemini.key="prod_gemini_key"
firebase functions:config:set allowed.origin="https://your-domain.com"
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Functions Not Deploying**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd functions
rm -rf node_modules package-lock.json
npm install
```

#### **2. CORS Errors**
```bash
# Update allowed origin in functions
# Check firebase.json rewrites
# Verify CORS configuration in index.js
```

#### **3. Gemini API Errors**
```bash
# Verify API key in .env
# Check API quota in Google Cloud Console
# Test API key manually
```

#### **4. Authentication Issues**
```bash
# Verify Firebase config in app.js
# Check Auth providers in Firebase Console
# Clear browser cache and cookies
```

## 📚 **API Documentation**

### **Endpoints**

#### **POST /api/recommend**
Generate career recommendations based on user profile.

**Request Body:**
```json
{
  "profile": {
    "name": "string",
    "education": "string",
    "skills": ["string"],
    "interests": ["string"],
    "weeklyTime": "number",
    "budget": "free|low|any",
    "language": "en|hi"
  },
  "idToken": "firebase_jwt_token"
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "roleId": "string",
      "title": "string",
      "fitScore": "number",
      "why": "string",
      "overlapSkills": ["string"],
      "gapSkills": ["string"],
      "plan": {
        "weeks": [
          {
            "week": "number",
            "topics": ["string"],
            "practice": ["string"],
            "assessment": "string",
            "project": "string"
          }
        ]
      }
    }
  ],
  "skillAnalysis": {
    "current": [number],
    "target": [number],
    "gaps": ["string"],
    "strengths": ["string"]
  }
}
```

#### **POST /api/analyze-resume**
Analyze uploaded resume and extract skills.

**Request Body:**
```json
{
  "fileData": "base64_encoded_file",
  "mimeType": "application/pdf",
  "idToken": "firebase_jwt_token"
}
```

#### **POST /api/delete_user_data**
Delete all user data from the system.

**Request Body:**
```json
{
  "idToken": "firebase_jwt_token"
}
```

#### **GET /health**
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "ISO string",
  "version": "v2.0",
  "services": {
    "firestore": "healthy",
    "gemini": "healthy"
  }
}
```

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### **Code Style**
- Use ES6+ JavaScript
- Follow existing naming conventions
- Add comments for complex logic
- Write tests for new features

## 📄 **License**

Built for the Google Cloud Gen AI Exchange hackathon. Please ensure compliance with Google Cloud Platform terms of service.

## 🏆 **Hackathon Evaluation Criteria**

### **Technical Excellence** ✅
- Modern tech stack (Firebase, Gemini AI, Cloud Functions)
- Clean, maintainable code architecture
- Comprehensive error handling and retry logic
- Security best practices implemented

### **Innovation** ✅
- AI-powered career guidance with fairness focus
- Resume analysis and skill extraction
- Interactive skill visualization
- Real-time AI chatbot integration

### **User Experience** ✅
- Intuitive, mobile-first design
- Progress tracking and gamification
- Professional landing page
- Comprehensive error handling

### **Market Feasibility** ✅
- Clear pricing strategy (Free/Pro/Enterprise)
- Target market identification
- Revenue model defined
- Scalable architecture

### **Problem-Solution Fit** ✅
- Addresses real student pain points
- Fair, unbiased recommendations
- Structured learning approach
- Accessible and affordable

---

**Ready to win the hackathon! 🚀**
