import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
});

const bucketName = process.env.FIREBASE_STORAGE_BUCKET || '';

export async function uploadOutput(jobId: string, localFilePath: string): Promise<string> {
  const fileName = `users/${jobId}/reel.mp4`;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  await bucket.upload(localFilePath, {
    destination: fileName,
    metadata: {
      contentType: 'video/mp4',
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Make the file publicly accessible
  await file.makePublic();

  // Return the public URL
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

export async function downloadFile(gsUrl: string, localPath: string): Promise<void> {
  const fileName = gsUrl.replace(`gs://${bucketName}/`, '');
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  await file.download({ destination: localPath });
}

export async function fileExists(gsUrl: string): Promise<boolean> {
  try {
    const fileName = gsUrl.replace(`gs://${bucketName}/`, '');
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    return false;
  }
}