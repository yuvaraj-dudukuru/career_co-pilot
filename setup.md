# 🚀 Career Co-pilot Setup Guide

This guide will walk you through setting up the Career Co-pilot application step by step.

## Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Google Cloud Platform Account** - [Sign up here](https://cloud.google.com/)
- **Git** (optional, for version control)

## Step 1: Project Setup

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Install server dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

## Step 2: Google Cloud Configuration

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "career-co-pilot")
4. Click "Create"

### 2.2 Enable Required APIs

In your Google Cloud project, enable these APIs:

1. **Speech-to-Text API**
   - Go to APIs & Services → Library
   - Search for "Speech-to-Text API"
   - Click "Enable"

2. **Text-to-Speech API**
   - Search for "Text-to-Speech API"
   - Click "Enable"

3. **Gemini AI API**
   - Search for "Gemini API"
   - Click "Enable"

4. **Firestore API**
   - Search for "Cloud Firestore API"
   - Click "Enable"

### 2.3 Create Service Account

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "Service Account"
3. Fill in:
   - **Name**: `career-co-pilot-service`
   - **Description**: `Service account for Career Co-pilot application`
4. Click "Create and Continue"
5. For roles, add:
   - **Cloud Speech-to-Text Admin**
   - **Cloud Text-to-Speech Admin**
   - **Firestore Admin**
6. Click "Continue" → "Done"

### 2.4 Download Service Account Key

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - this will download a JSON file
6. **Move this file to the `server` directory**
7. **Rename it to something like `service-account-key.json`**

### 2.5 Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key (you'll need this for the .env file)

## Step 3: Environment Configuration

### 3.1 Server Environment

1. In the `server` directory, create a `.env` file:
   ```bash
   cd server
   cp env.example .env
   ```

2. Edit the `.env` file with your actual values:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   GEMINI_API_KEY=your-actual-gemini-api-key
   PORT=3001
   NODE_ENV=development
   ```

### 3.2 Client Environment (Optional)

1. In the `client` directory, create a `.env` file:
   ```bash
   cd client
   cp env.example .env
   ```

2. Edit the `.env` file if you need to change the API URL:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

## Step 4: Run the Application

### 4.1 Start the Backend Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 Career Co-pilot server running on port 3001
📝 Interview endpoint: http://localhost:3001/api/interview
🏥 Health check: http://localhost:3001/health
```

### 4.2 Start the Frontend Client

In a new terminal:

```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4.3 Access the Application

Open your browser and go to: **http://localhost:5173**

## Step 5: Test the Application

1. **Enter a job role** (e.g., "Junior DevOps Engineer")
2. **Click "Start Interview"**
3. **Grant microphone permissions** when prompted
4. **Listen to the AI's first question**
5. **Click the microphone button** and speak your answer
6. **Click again to stop recording**
7. **Listen to the AI's feedback and next question**

## Troubleshooting

### Common Issues

1. **"Failed to access microphone"**
   - Check browser permissions
   - Ensure you're using HTTPS or localhost
   - Try refreshing the page

2. **"Failed to start interview"**
   - Check your `.env` file configuration
   - Verify Google Cloud APIs are enabled
   - Check service account permissions

3. **"Failed to process audio"**
   - Check Speech-to-Text API is enabled
   - Verify service account has proper roles
   - Check audio format compatibility

4. **CORS errors**
   - Ensure backend is running on port 3001
   - Check CORS configuration in server code

### Debug Mode

To see detailed logs, check the server terminal output. The application logs each step of the interview process.

## Production Deployment

For production deployment:

1. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

2. **Build the server:**
   ```bash
   cd server
   npm run build
   ```

3. **Set production environment variables:**
   ```env
   NODE_ENV=production
   CORS_ORIGINS=https://yourdomain.com
   ```

4. **Deploy to your preferred hosting service** (Google Cloud Run, Heroku, etc.)

## Support

If you encounter issues:

1. Check the console logs in both terminal and browser
2. Verify all environment variables are set correctly
3. Ensure Google Cloud APIs are enabled and accessible
4. Check service account permissions and key file location

## Security Notes

- **Never commit your `.env` files or service account keys**
- **Use environment variables for all sensitive configuration**
- **Restrict service account permissions to minimum required roles**
- **Enable audit logging in Google Cloud for production use**
