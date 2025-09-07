# VR Reels Builder

A Firebase + Gemini/Veo powered application for creating stunning property reels with AI-generated voiceovers and video content.

## Features

- **Photo Upload**: Upload 6-15 photos with resumable uploads to Firebase Storage
- **AI Script Generation**: Gemini 2.0 Flash generates 95-word voiceover scripts
- **TTS Integration**: Provider-agnostic text-to-speech with mock implementation
- **Video Generation**: Optional Veo 3 AI video clips for hybrid style
- **Multiple Styles**: Classic, Parallax, Hybrid, and Destination styles
- **Real-time Progress**: Live job status updates via Firestore
- **Cloud Rendering**: FFmpeg-based video rendering on Cloud Run

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │  Cloud Tasks    │    │  Cloud Run      │
│                 │    │                 │    │  Renderer       │
│ • Upload Wizard │───▶│ • Job Queue     │───▶│ • Gemini API    │
│ • Job Status    │    │ • OIDC Auth     │    │ • Veo API       │
│ • Download      │    │                 │    │ • FFmpeg        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Firestore     │    │ Firebase Storage│
│                 │    │                 │    │                 │
│ • Auth          │    │ • Job Status    │    │ • Photos        │
│ • Hosting       │    │ • Progress      │    │ • Output MP4s   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Cloud Run (Node.js, Express)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Queue**: Cloud Tasks
- **AI**: Vertex AI (Gemini 2.0 Flash, Veo 3)
- **Video**: FFmpeg
- **Auth**: Firebase Auth

## Project Structure

```
vr-reels-builder/
├── apps/
│   ├── web/                 # Next.js web application
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/         # Utilities and Firebase config
│   │   └── package.json
│   └── renderer/            # Cloud Run renderer service
│       ├── src/
│       │   ├── handlers/    # Express route handlers
│       │   └── lib/         # AI, FFmpeg, storage utilities
│       └── Dockerfile
├── packages/
│   └── shared/              # Shared TypeScript types
├── infra/                   # Infrastructure as Code
└── firestore.rules         # Firestore security rules
```

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase CLI
- Google Cloud SDK
- Docker (for local renderer testing)

### 1. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore
# - Storage
# - Hosting
# - Authentication
```

### 2. Environment Variables

Create `.env.local` in `apps/web/`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloud Tasks configuration
RENDERER_INVOKER_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
CLOUD_TASKS_LOCATION=us-central1
CLOUD_TASKS_QUEUE=render-queue
CLOUD_RUN_RENDER_URL=https://renderer-xxxx-uc.a.run.app/render
```

Create `.env` in `apps/renderer/`:

```env
GCLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_PROJECT=your_project_id
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VERTEX_LOCATION=us-central1
VERTEX_GEMINI_MODEL=gemini-2.0-flash
VERTEX_VEO_MODEL=veo-3
TTS_PROVIDER=mock
ENABLE_VEO=true
MUSIC_BUCKET_PATH=gs://your_bucket/music/default.wav
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspace=apps/web
npm install --workspace=apps/renderer
npm install --workspace=packages/shared
```

### 4. Build Shared Package

```bash
npm run build --workspace=packages/shared
```

### 5. Local Development

#### Web App
```bash
cd apps/web
npm run dev
```

#### Renderer Service
```bash
cd apps/renderer
npm run dev
```

### 6. Deploy to Firebase

#### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

#### Deploy Storage Rules
```bash
firebase deploy --only storage
```

#### Deploy Web App
```bash
firebase deploy --only hosting
```

### 7. Deploy Cloud Run Renderer

```bash
# Build and push Docker image
cd apps/renderer
docker build -t gcr.io/your_project_id/vr-reels-renderer .
docker push gcr.io/your_project_id/vr-reels-renderer

# Deploy to Cloud Run
gcloud run deploy vr-reels-renderer \
  --image gcr.io/your_project_id/vr-reels-renderer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account your_service_account@your_project_id.iam.gserviceaccount.com
```

### 8. Create Cloud Tasks Queue

```bash
gcloud tasks queues create render-queue \
  --location=us-central1 \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=10
```

## Usage

1. **Sign In**: Use Google authentication to sign in
2. **Upload Photos**: Select 6-15 property photos
3. **Add Details**: Enter location and property description
4. **Choose Style**: Select from Classic, Parallax, Hybrid, or Destination
5. **Generate**: Click "Generate Reel" to start the process
6. **Monitor Progress**: Watch real-time progress updates
7. **Download**: Get your completed MP4 when ready

## Styles

- **Classic**: Ken Burns effect, captions, voiceover, background music
- **Parallax**: Same as classic with depth masks (TODO)
- **Hybrid**: Classic + AI-generated Veo video insert
- **Destination**: Classic + map fly-in card (TODO)

## API Endpoints

### Web App
- `POST /api/jobs/create` - Create a new render job

### Renderer Service
- `GET /health` - Health check
- `POST /render` - Process render job

## Development Notes

### TTS Integration
The app includes a provider-agnostic TTS interface with a mock implementation. To integrate real TTS:

1. **ElevenLabs**: Set `TTS_PROVIDER=elevenlabs` and add `ELEVENLABS_API_KEY`
2. **AWS Polly**: Set `TTS_PROVIDER=polly` and configure AWS credentials

### Veo Integration
Set `ENABLE_VEO=true` to enable AI video generation. Requires Vertex AI Veo 3 access.

### Security
- Firestore rules restrict access to user's own jobs
- Cloud Run uses OIDC tokens for secure communication
- Storage rules allow public read access to completed reels

## Troubleshooting

### Common Issues

1. **Upload Failures**: Check Firebase Storage rules and quotas
2. **Render Timeouts**: Increase Cloud Run timeout and memory limits
3. **AI API Errors**: Verify Vertex AI permissions and quotas
4. **FFmpeg Errors**: Check Cloud Run has sufficient CPU/memory

### Logs
- Web app: Check browser console and Firebase console
- Renderer: Check Cloud Run logs in GCP console
- Jobs: Monitor Firestore for job status updates

## Future Enhancements

- [ ] Replace mock TTS with ElevenLabs/Polly
- [ ] Add Whisper alignment for word-level captions
- [ ] Implement 2.5D parallax masks
- [ ] Add Remotion renderer option
- [ ] Create destination style map cards
- [ ] Add batch processing
- [ ] Implement user preferences
- [ ] Add analytics and metrics

## License

MIT License - see LICENSE file for details.
