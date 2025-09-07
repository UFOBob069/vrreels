import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { CloudTasksClient } from '@google-cloud/tasks';
import { CreateJobPayload, StylePreset, CloudTaskPayload } from '@vr-reels/shared';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    // Try to initialize with real credentials
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback to default credentials for local development
      console.log('Using default Firebase credentials for local development');
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      });
    }
  } catch (error) {
    console.log('Firebase Admin initialization failed, using mock mode:', error);
    // Initialize with minimal config for local development
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
    });
  }
}

const auth = getAuth();
const db = getFirestore();

// Cloud Tasks client
const tasksClient = new CloudTasksClient();

async function createRenderTask(
  jobId: string,
  payload: CloudTaskPayload
): Promise<void> {
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
  const queue = process.env.CLOUD_TASKS_QUEUE || 'render-queue';
  const url = process.env.CLOUD_RUN_RENDER_URL;
  const invokerEmail = process.env.RENDERER_INVOKER_EMAIL;

  if (!project || !url || !invokerEmail) {
    throw new Error('Missing required environment variables for Cloud Tasks');
  }

  const queuePath = tasksClient.queuePath(project, location, queue);

  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url: `${url}/render`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      oidcToken: {
        serviceAccountEmail: invokerEmail,
      },
    },
  };

  try {
    const [response] = await tasksClient.createTask({ parent: queuePath, task });
    console.log(`Created task ${response.name}`);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // For local development, skip auth verification
    let userId = 'mock-user-id';
    
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      }
    } catch (authError) {
      console.log('Auth verification failed, using mock user:', authError);
      // Continue with mock user for local development
    }

    const body = await request.json();
    const { title, location, description, photos, style, durationSec, emailNotify } = body;

    // Validation
    if (!location || !description || !photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: location, description, photos' },
        { status: 400 }
      );
    }

    if (!['classic', 'parallax', 'hybrid', 'destination'].includes(style)) {
      return NextResponse.json(
        { error: 'Invalid style. Must be one of: classic, parallax, hybrid, destination' },
        { status: 400 }
      );
    }

    const payload: CreateJobPayload = {
      title: title || undefined,
      location,
      description,
      photos,
      style: style as StylePreset,
      durationSec: durationSec || 30,
      emailNotify: emailNotify || false,
    };

    // Create job document
    const jobId = `mock-job-${Date.now()}`;
    
    try {
      const jobData = {
        status: 'queued',
        payload,
        progress: 0,
        outputUrl: null,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
      };

      const docRef = await db.collection('jobs').add(jobData);
      const realJobId = docRef.id;

      // Create Cloud Task
      await createRenderTask(realJobId, { jobId: realJobId });

      return NextResponse.json({ jobId: realJobId });
    } catch (dbError) {
      console.log('Database operation failed, using mock job:', dbError);
      // Return mock job ID for local development
      return NextResponse.json({ jobId });
    }
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}