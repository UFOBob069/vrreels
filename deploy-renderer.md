# Deploy Renderer Service to Cloud Run

## Step 1: Set Up Google Cloud CLI

1. **Install Google Cloud CLI:**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use: `gcloud components install`

2. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

## Step 2: Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudtasks.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

## Step 3: Build and Deploy

```bash
# Navigate to renderer directory
cd apps/renderer

# Build the Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/vr-reels-renderer

# Deploy to Cloud Run
gcloud run deploy vr-reels-renderer \
  --image gcr.io/YOUR_PROJECT_ID/vr-reels-renderer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 3600 \
  --set-env-vars="GCLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com,VERTEX_LOCATION=us-central1,VERTEX_GEMINI_MODEL=gemini-2.0-flash,VERTEX_VEO_MODEL=veo-3,TTS_PROVIDER=mock,ENABLE_VEO=false,PORT=8080"
```

## Step 4: Create Cloud Tasks Queue

```bash
gcloud tasks queues create render-queue \
  --location=us-central1 \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=10
```

## Step 5: Update Web App Environment

Update your `apps/web/.env` file with the Cloud Run URL:

```env
CLOUD_RUN_RENDER_URL=https://vr-reels-renderer-xxxx-uc.a.run.app/render
```

## Step 6: Test the Complete Pipeline

1. Restart your web app: `npm run dev`
2. Create a new job
3. Check Cloud Run logs for processing
4. Download the completed video

## Troubleshooting

- **Build fails**: Check Dockerfile and dependencies
- **Deploy fails**: Verify project permissions
- **Runtime errors**: Check Cloud Run logs
- **API errors**: Verify Vertex AI access
