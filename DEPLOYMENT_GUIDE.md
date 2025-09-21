# Career Co-Pilot MVP Deployment Guide

## 🚀 Build & Deploy Commands

### Prerequisites
1. Ensure you have Firebase CLI installed: `npm install -g firebase-tools`
2. Make sure you're authenticated: `firebase login`
3. Set your project: `firebase use <your-project-id>`

### Step 1: Install Dependencies
```bash
# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### Step 2: Set Environment Variables (Optional)
If you have a Gemini API key:
```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY_HERE"
```

### Step 3: Deploy Everything
```bash
# Deploy hosting, functions, and Firestore rules
firebase deploy

# Or deploy specific services
firebase deploy --only hosting,functions,firestore:rules
```

### Step 4: Test Locally (Optional)
```bash
# Start emulators for local testing
firebase emulators:start

# Open http://localhost:5000 to test locally
```

## ✅ Final Verification Checklist

### Core Functionality Tests
- [ ] **App loads successfully** at your Firebase hosting URL
- [ ] **Google Sign-in works** - users can authenticate
- [ ] **Profile submission** returns 3 recommendations with:
  - [ ] `fitScore` (0-100) displayed with progress bar
  - [ ] `overlapSkills` shown as green chips
  - [ ] `gapSkills` shown as red chips
  - [ ] `why` explanation text
  - [ ] 4-week learning plan with exactly 4 weeks
- [ ] **Learning plan modal** opens and displays plan correctly
- [ ] **Download PDF button** opens print dialog with clean formatting
- [ ] **Delete My Data** removes user data from Firestore
- [ ] **Fallback behavior** works when Gemini API is unavailable

### Technical Verification
- [ ] **Firestore rules deployed** - only authenticated users can access their data
- [ ] **Cloud Functions deployed** - all API endpoints respond correctly
- [ ] **Error handling** - graceful fallbacks when services fail
- [ ] **Data persistence** - user data saves and loads correctly
- [ ] **Security** - API endpoints require authentication

### Performance & UX
- [ ] **Fast loading** - app loads within 3 seconds
- [ ] **Responsive design** - works on mobile and desktop
- [ ] **Clear error messages** - users understand what went wrong
- [ ] **Loading states** - users see progress indicators

## 🎯 3-Minute Demo Script

### Opening (30 seconds)
"Hi! I'm presenting Career Co-Pilot, an AI-powered career advisor that creates personalized 4-week learning roadmaps. Let me show you how it works."

### Demo Flow (2 minutes)

1. **Sign In** (15 seconds)
   - "First, users sign in with Google for secure, personalized recommendations"
   - Click sign-in, show authentication

2. **Profile Input** (30 seconds)
   - "Users can either upload a resume or manually enter their skills"
   - Show skill input or resume upload
   - "Our AI extracts skills and matches them to career roles"

3. **Generate Recommendations** (30 seconds)
   - Click "Generate Recommendations"
   - "Here are the top 3 career matches with fit scores and explanations"
   - Point out: fit score, overlap skills (green), gap skills (red), why explanation

4. **Learning Plan** (30 seconds)
   - Click on top recommendation
   - "This is a detailed 4-week learning roadmap with topics, practice exercises, assessments, and projects"
   - Scroll through the 4 weeks

5. **PDF Export** (15 seconds)
   - Click "Download PDF"
   - "Users can export their plan for offline reference"

### Closing (30 seconds)
- **Key Features**: "Personalized recommendations, deterministic fallbacks, data privacy"
- **Technical Highlights**: "Firebase backend, AI-powered matching, responsive design"
- **Impact**: "Helps users make informed career decisions with actionable learning paths"

### Backup Demo Points (if time allows)
- Show "Delete My Data" functionality
- Mention fallback behavior: "Even if AI services are down, users get valid plans"
- Point out mobile responsiveness

## 🔧 Troubleshooting

### Common Issues
1. **"Database already exists" error**
   - Solution: Use existing Firestore database, don't create new ones
   - Check: `firebase use <correct-project-id>`

2. **Authentication errors**
   - Solution: Ensure Firebase Auth is enabled in console
   - Check: Firestore rules are deployed

3. **Functions not deploying**
   - Solution: Check Node.js version (requires 18+)
   - Check: All dependencies installed in functions folder

4. **Gemini API errors**
   - Solution: App uses deterministic fallback plans
   - Check: API key is optional, app works without it

### Emergency Fallbacks
- If hosting fails: Use `firebase serve` for local demo
- If functions fail: Use emulator suite
- If AI fails: App automatically uses deterministic plans

## 📱 Demo Environment Setup

### For Live Demo
1. Use incognito/private browser window
2. Have backup demo account ready
3. Test all flows 5 minutes before presentation
4. Have mobile device ready for responsive demo

### For Video Submission
1. Record in 1080p resolution
2. Show clear UI interactions
3. Include voiceover explaining features
4. Keep video under 3 minutes

## 🎉 Success Criteria

Your MVP is demo-ready when:
- ✅ All verification checklist items pass
- ✅ Demo script flows smoothly
- ✅ App handles errors gracefully
- ✅ Users can complete full journey
- ✅ Data persists and can be deleted
- ✅ PDF export works correctly

**You're ready to submit! 🚀**
