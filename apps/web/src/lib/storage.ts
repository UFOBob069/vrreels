// Mock storage functions for local development
export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Mock upload for local development
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      onProgress?.(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Return a mock URL
        resolve(`https://mock-storage.com/${path}`);
      }
    }, 100);
  });
}

export async function deleteFile(path: string): Promise<void> {
  // Mock delete for local development
  console.log(`Mock delete: ${path}`);
}

export function getStoragePath(userId: string, jobId: string, filename: string): string {
  return `users/${userId}/jobs/${jobId}/input/${filename}`;
}

export function getOutputPath(userId: string, jobId: string): string {
  return `users/${userId}/jobs/${jobId}/reel.mp4`;
}
