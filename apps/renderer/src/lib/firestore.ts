import { Firestore } from '@google-cloud/firestore';
import { Job, JobStatus } from '@vr-reels/shared';

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
});

export async function getJob(jobId: string): Promise<Job | null> {
  const doc = await db.collection('jobs').doc(jobId).get();
  
  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    status: data.status,
    progress: data.progress,
    outputUrl: data.outputUrl,
    error: data.error,
    payload: data.payload,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    userId: data.userId,
  };
}

export async function updateJobStatus(
  jobId: string,
  updates: Partial<Pick<Job, 'status' | 'progress' | 'outputUrl' | 'error'>>
): Promise<void> {
  await db.collection('jobs').doc(jobId).update({
    ...updates,
    updatedAt: new Date(),
  });
}