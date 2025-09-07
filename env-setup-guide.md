# Environment Variables Setup Guide

## Web App Environment Variables (`apps/web/.env.local`)

Create this file in your web app directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Cloud Tasks Configuration
RENDERER_INVOKER_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
CLOUD_TASKS_LOCATION=us-central1
CLOUD_TASKS_QUEUE=render-queue
CLOUD_RUN_RENDER_URL=https://renderer-xxxx-uc.a.run.app/render

# Firebase Admin (for API routes)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GCLOUD_PROJECT=your-project-id
```

## Renderer Service Environment Variables (`apps/renderer/.env`)

Create this file in your renderer directory:

```env
# Google Cloud Configuration
GCLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_PROJECT=your-project-id

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Vertex AI Configuration
VERTEX_LOCATION=us-central1
VERTEX_GEMINI_MODEL=gemini-2.0-flash
VERTEX_VEO_MODEL=veo-3

# TTS Configuration
TTS_PROVIDER=mock
# TTS_PROVIDER=elevenlabs
# TTS_PROVIDER=polly
# ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
# AWS_ACCESS_KEY_ID=your_aws_access_key_here
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here

# Feature Flags
ENABLE_VEO=true

# Music Configuration
MUSIC_BUCKET_PATH=gs://your-project-id.appspot.com/music/default.wav

# Server Configuration
PORT=8080
```

## How to Get These Values

### 1. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Click "Add app" > Web app
6. Copy the config values

### 2. Service Account (Firebase Admin)
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 3. Cloud Run URL
1. Deploy your renderer service to Cloud Run
2. Copy the service URL
3. Add `/render` to the end

### 4. Service Account for Cloud Tasks
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to IAM & Admin > Service Accounts
3. Create a new service account with "Cloud Run Invoker" role
4. Copy the email address

### 5. Vertex AI Access
1. Enable Vertex AI API in Google Cloud Console
2. Ensure your service account has "Vertex AI User" role
3. For Veo access, you may need to request access from Google

## Local Development

For local development, you can use the mock implementations that are already set up. The app will work without these environment variables, but with limited functionality.

## Production Deployment

Make sure to set all environment variables in your deployment platform:
- **Vercel/Netlify**: Set in dashboard
- **Cloud Run**: Set in service configuration
- **Firebase Hosting**: Use Firebase Functions for server-side code

## Security Notes

- Never commit `.env` files to version control
- Use different values for development and production
- Rotate API keys regularly
- Use least-privilege IAM roles
