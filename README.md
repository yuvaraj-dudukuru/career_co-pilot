# 🚀 Career Co-Pilot - AI-Powered Career Guidance

> **Built for the Google Cloud Gen AI Exchange Hackathon**

Career Co-Pilot is an intelligent career advisor that generates personalized learning roadmaps based on your skills, interests, and goals. Using advanced AI (Google Gemini) and deterministic skill matching, it provides fair, transparent career recommendations with structured 4-week learning plans.

## ✨ **Features**

- **🎯 AI-Powered Recommendations**: Get top 3 career matches based on your profile
- **📚 Structured Learning Plans**: 4-week roadmaps with topics, practice, assessment, and projects
- **🔒 Fair & Transparent**: No bias based on personal characteristics
- **📱 Responsive Design**: Works seamlessly on all devices
- **📄 PDF Export**: Download your learning plans for offline use
- **🔐 Secure Authentication**: Firebase Auth with Google Sign-In
- **💾 Data Persistence**: Save profiles and recommendations in Firestore
- **🗑️ Privacy First**: Delete all your data anytime

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloud          │    │   Google        │
│   (HTML/CSS/JS) │◄──►│   Functions      │◄──►│   Gemini AI     │
│                 │    │   (Node.js)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Firebase      │    │   Firestore      │
│   Hosting       │    │   Database       │
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

### **6. Deploy**
```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

## 🧪 **Local Development**

### **Start Local Emulators**
```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only functions,firestore
```

### **Development URLs**
- **Frontend**: http://localhost:5000
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080
- **UI**: http://localhost:4000

### **Hot Reload**
```bash
# Functions development
cd functions
npm run serve

# Frontend development (in another terminal)
cd public
python -m http.server 8000
# or
npx serve .
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# functions/.env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_PROJECT_ID=your_project_id
ALLOWED_ORIGIN=http://localhost:5000
```

### **Firebase Config**
```bash
# Set Firebase config values
firebase functions:config:set gemini.key="your_gemini_api_key"
firebase functions:config:set allowed.origin="http://localhost:5000"
```

### **CORS Configuration**
Update `functions/index.js` with your hosting domain:
```javascript
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://your-project.web.app';
```

## 📱 **Usage Flow**

### **1. User Onboarding**
1. **Sign In**: Google authentication
2. **Profile Creation**: Fill in skills, interests, constraints
3. **Submit**: AI analyzes profile and generates recommendations

### **2. Career Recommendations**
1. **Top 3 Roles**: View matched careers with fit scores
2. **Skill Analysis**: See overlapping skills and gaps
3. **Learning Plans**: Access 4-week structured roadmaps

### **3. Learning Experience**
1. **Week-by-Week**: Detailed topics and practice activities
2. **Assessment**: Progress checkpoints
3. **Projects**: Hands-on application of skills
4. **PDF Export**: Download plans for offline use

## 🎯 **Hackathon Demo Script**

### **Opening (30 seconds)**
> "Hi judges! I'm excited to present Career Co-Pilot, an AI-powered career guidance platform that solves a real problem: generic career advice that doesn't consider individual skills and learning constraints."

### **Problem Statement (30 seconds)**
> "Students struggle with unclear career paths, expensive counseling, and biased recommendations. Our solution uses AI to provide personalized, fair, and actionable career guidance."

### **Live Demo (2 minutes)**

#### **Step 1: Profile Creation**
- Navigate to homepage
- Click "Get Started"
- Sign in with Google
- Fill profile form:
  - Name: "Priya Sharma"
  - Education: "Bachelor's Degree"
  - Skills: "JavaScript, HTML, CSS, Excel"
  - Interests: "Web Development, Data Science"
  - Weekly Time: "6 hours"
  - Budget: "Free resources only"

#### **Step 2: AI Analysis**
- Submit form
- Show loading states with progress indicators
- Highlight the 3-step process:
  - Analyzing skills & interests
  - Finding matching roles
  - Creating learning plans

#### **Step 3: Results Dashboard**
- Display top 3 recommendations with fit scores
- Show skill overlap analysis
- Demonstrate fairness notice
- Click on "Frontend Developer" role

#### **Step 4: Learning Plan**
- Open detailed 4-week roadmap
- Show structured content:
  - Week 1: Foundation topics
  - Week 2: Practical skills
  - Week 3: Advanced concepts
  - Week 4: Project work
- Demonstrate PDF export functionality

### **Technical Highlights (1 minute)**
> "Our tech stack includes Google Gemini AI for intelligent recommendations, Firebase for scalable infrastructure, and deterministic skill matching for explainable results. We've implemented strict JSON validation, retry logic, and comprehensive error handling."

### **Fairness & Innovation (30 seconds)**
> "What makes us unique is our commitment to fairness - we never consider gender, caste, or college ranking. Instead, we focus purely on skills, interests, and learning capacity. Our cosine similarity algorithm provides transparent scoring."

### **Business Model (30 seconds)**
> "We're targeting the Indian education market with a freemium model and campus licensing. Our MVP demonstrates the core value proposition and user experience."

### **Closing (30 seconds)**
> "Career Co-Pilot transforms generic career advice into personalized, actionable roadmaps. We're not just building another AI tool - we're building a fair, transparent career companion that grows with students. Thank you!"

## 🔒 **Security & Privacy**

### **Firestore Rules**
```javascript
// Users can only access their own data
match /users/{uid} {
  allow read, write: if isSignedIn() && request.auth.uid == uid;
}
```

### **Authentication**
- Firebase Auth with Google Sign-In
- JWT token validation on all API endpoints
- Secure token handling

### **Data Privacy**
- No sensitive attributes in AI prompts
- User data deletion functionality
- Analytics without PII

## 📊 **Performance & Monitoring**

### **Analytics Events**
- `app_initialized`
- `profile_saved`
- `recommendations_generated`
- `plan_viewed`
- `pdf_exported`
- `api_performance`

### **Performance Metrics**
- **Time to First Insight**: < 3 seconds
- **Completion Rate**: Target 85%
- **User Satisfaction**: Target 78%
- **API Response Time**: < 2 seconds

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

### **Monitoring**
- Firebase Console for functions and hosting
- Google Cloud Console for API usage
- Custom analytics in Firestore

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

### **Debug Mode**
```bash
# Enable debug logging
firebase functions:config:set debug.enabled=true

# View function logs
firebase functions:log --only app
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
  }
}
```

**Response:**
```json
{
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
  ]
}
```

#### **POST /api/delete_user_data**
Delete all user data from the system.

**Response:**
```json
{
  "success": true,
  "message": "All user data deleted successfully"
}
```

#### **GET /health**
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "ISO string",
  "version": "v1.0"
}
```

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Built for the Google Cloud Gen AI Exchange hackathon. Please ensure compliance with Google Cloud Platform terms of service.
