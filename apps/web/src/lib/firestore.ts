// Mock Firestore functions for local development
import { Job, CreateJobPayload, JobStatus } from '@vr-reels/shared';

export async function createJob(
  userId: string,
  payload: CreateJobPayload
): Promise<string> {
  // Mock job creation for local development
  const jobId = `mock-job-${Date.now()}`;
  console.log(`Mock job created: ${jobId}`, payload);
  return jobId;
}

export async function updateJobStatus(
  jobId: string,
  updates: Partial<Pick<Job, 'status' | 'progress' | 'outputUrl' | 'error'>>
): Promise<void> {
  // Mock update for local development
  console.log(`Mock job update: ${jobId}`, updates);
}

export async function getJob(jobId: string): Promise<Job | null> {
  // Mock job retrieval for local development
  return {
    id: jobId,
    status: 'done',
    progress: 100,
    outputUrl: 'https://mock-storage.com/sample-reel.mp4',
    error: null,
    payload: {
      title: 'Mock Property',
      location: 'Mock Location',
      description: 'Mock description',
      photos: ['https://mock-storage.com/photo1.jpg'],
      style: 'classic',
      durationSec: 30,
      emailNotify: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'mock-user',
  };
}

export async function getUserJobs(userId: string, limitCount: number = 10): Promise<Job[]> {
  // Mock job list for local development
  return [
    {
      id: 'mock-job-1',
      status: 'done',
      progress: 100,
      outputUrl: 'https://mock-storage.com/sample-reel.mp4',
      error: null,
      payload: {
        title: 'Sample Property',
        location: 'Sample Location',
        description: 'Sample description',
        photos: ['https://mock-storage.com/photo1.jpg'],
        style: 'classic',
        durationSec: 30,
        emailNotify: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
    }
  ];
}

export function subscribeToJob(
  jobId: string,
  callback: (job: Job | null) => void
): () => void {
  // Mock subscription for local development
  const mockJob: Job = {
    id: jobId,
    status: 'rendering',
    progress: 50,
    outputUrl: null,
    error: null,
    payload: {
      title: 'Mock Property',
      location: 'Mock Location',
      description: 'Mock description',
      photos: ['https://mock-storage.com/photo1.jpg'],
      style: 'classic',
      durationSec: 30,
      emailNotify: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'mock-user',
  };
  
  callback(mockJob);
  
  // Return a mock unsubscribe function
  return () => console.log(`Mock unsubscribe from job: ${jobId}`);
}
