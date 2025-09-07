export type StylePreset = "classic" | "parallax" | "hybrid" | "destination";

export interface CreateJobPayload {
  title?: string;
  location: string;
  description: string;
  photos: string[];
  style: StylePreset;
  durationSec?: number;
  voice?: string;
  musicId?: string;
  emailNotify?: boolean;
}

export type JobStatus = "queued" | "rendering" | "done" | "error";

export interface Job {
  id: string;
  status: JobStatus;
  progress?: number;
  outputUrl?: string | null;
  error?: string | null;
  payload: CreateJobPayload;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CloudTaskPayload {
  jobId: string;
}

export interface TTSProvider {
  synthesizeVoice(text: string, voice?: string): Promise<Uint8Array>;
}

export interface VertexAIConfig {
  projectId: string;
  location: string;
  geminiModel: string;
  veoModel: string;
}

export interface RenderConfig {
  enableVeo: boolean;
  musicBucketPath: string;
  outputBucket: string;
  ttsProvider: string;
}
