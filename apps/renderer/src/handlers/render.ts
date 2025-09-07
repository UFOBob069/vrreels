import { Request, Response } from 'express';
import { CloudTaskPayload } from '@vr-reels/shared';
import { getJob, updateJobStatus } from '../lib/firestore';
import { generateScript } from '../lib/vertex';
import { synthesizeVoice } from '../lib/tts';
import { generateVeoVideo } from '../lib/vertex';
import { renderVideo } from '../lib/ffmpeg';
import { uploadOutput } from '../lib/storage';

export async function renderHandler(req: Request, res: Response) {
  try {
    const { jobId }: CloudTaskPayload = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId' });
    }

    console.log(`Starting render job: ${jobId}`);

    // Fetch job and update status
    const job = await getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await updateJobStatus(jobId, { status: 'rendering', progress: 5 });

    try {
      // Step 1: Generate script with Gemini
      console.log('Generating script...');
      const script = await generateScript(job.payload.location, job.payload.description);
      await updateJobStatus(jobId, { progress: 15 });

      // Step 2: Generate TTS
      console.log('Generating voiceover...');
      const voiceBuffer = await synthesizeVoice(script, job.payload.voice);
      await updateJobStatus(jobId, { progress: 25 });

      // Step 3: Generate Veo video (if hybrid style)
      let veoVideoPath: string | null = null;
      if (job.payload.style === 'hybrid' && process.env.ENABLE_VEO === 'true') {
        console.log('Generating Veo video...');
        try {
          veoVideoPath = await generateVeoVideo(job.payload.location);
          await updateJobStatus(jobId, { progress: 40 });
        } catch (error) {
          console.warn('Veo generation failed, continuing without it:', error);
        }
      } else {
        await updateJobStatus(jobId, { progress: 40 });
      }

      // Step 4: Render video with FFmpeg
      console.log('Rendering video...');
      const outputPath = await renderVideo({
        jobId,
        photos: job.payload.photos,
        script,
        voiceBuffer,
        veoVideoPath,
        style: job.payload.style,
        durationSec: job.payload.durationSec || 30,
      });
      await updateJobStatus(jobId, { progress: 80 });

      // Step 5: Upload to storage
      console.log('Uploading to storage...');
      const outputUrl = await uploadOutput(jobId, outputPath);
      await updateJobStatus(jobId, { 
        status: 'done', 
        progress: 100, 
        outputUrl 
      });

      console.log(`Render job completed: ${jobId}`);
      res.json({ success: true, jobId, outputUrl });

    } catch (error) {
      console.error(`Render job failed: ${jobId}`, error);
      await updateJobStatus(jobId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.status(500).json({ error: 'Render failed' });
    }

  } catch (error) {
    console.error('Render handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}