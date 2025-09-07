import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { StylePreset } from '@vr-reels/shared';

export interface RenderOptions {
  jobId: string;
  photos: string[];
  script: string;
  voiceBuffer: Uint8Array;
  veoVideoPath?: string | null;
  style: StylePreset;
  durationSec: number;
}

export async function renderVideo(options: RenderOptions): Promise<string> {
  const { jobId, photos, script, voiceBuffer, veoVideoPath, style, durationSec } = options;
  
  const outputPath = path.join('/tmp', `${jobId}.mp4`);
  const voicePath = path.join('/tmp', 'voice.wav');
  const musicPath = process.env.MUSIC_BUCKET_PATH || '/tmp/music.wav';
  
  // Write voice buffer to file
  fs.writeFileSync(voicePath, Buffer.from(voiceBuffer));
  
  // Create music file if it doesn't exist
  if (!fs.existsSync(musicPath)) {
    await createSilentAudio(musicPath, durationSec);
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    
    // Add photo inputs
    photos.forEach(photo => {
      command.input(photo);
    });
    
    // Add voice input
    command.input(voicePath);
    
    // Add music input
    command.input(musicPath);
    
    // Add Veo video if available
    if (veoVideoPath && fs.existsSync(veoVideoPath)) {
      command.input(veoVideoPath);
    }

    // Build filter complex based on style
    const filterComplex = buildFilterComplex(photos, style, veoVideoPath, durationSec, script);
    
    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-r 30',
        '-s 1080x1920', // 9:16 aspect ratio
        '-pix_fmt yuv420p'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg started:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('FFmpeg progress:', progress.percent);
      })
      .on('end', () => {
        console.log('FFmpeg finished');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

function buildFilterComplex(photos: string[], style: StylePreset, veoVideoPath?: string | null, durationSec: number = 30, script?: string): string {
  const photoCount = photos.length;
  const photoDuration = durationSec / photoCount;
  
  let filters: string[] = [];
  
  // Scale and apply Ken Burns effect to each photo
  for (let i = 0; i < photoCount; i++) {
    const inputIndex = i;
    const outputName = `photo${i}`;
    
    filters.push(
      `[${inputIndex}]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0015,1.5)':d=${photoDuration * 30}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920[${outputName}]`
    );
  }
  
  // Concatenate photos with crossfade
  let concatInputs = '';
  let concatFilters = '';
  
  for (let i = 0; i < photoCount; i++) {
    concatInputs += `[photo${i}]`;
    
    if (i < photoCount - 1) {
      const nextIndex = i + 1;
      const crossfadeName = `crossfade${i}`;
      concatFilters += `[photo${i}][photo${nextIndex}]blend=all_expr='A*(if(gte(T,0.5),1,2*T))+B*(if(lt(T,0.5),1,2-2*T))':shortest=1[${crossfadeName}];`;
    }
  }
  
  // Handle Veo video insertion for hybrid style
  if (style === 'hybrid' && veoVideoPath) {
    const veoInputIndex = photoCount; // Veo video is after photos
    const veoOutputName = 'veo_scaled';
    
    filters.push(
      `[${veoInputIndex}]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[${veoOutputName}]`
    );
    
    // Insert Veo video after second photo
    if (photoCount >= 2) {
      concatFilters += `[photo0][photo1]blend=all_expr='A*(if(gte(T,0.5),1,2*T))+B*(if(lt(T,0.5),1,2-2*T))':shortest=1[crossfade0];`;
      concatFilters += `[crossfade0][veo_scaled]concat=n=2:v=1:a=0[veo_insert];`;
      
      // Continue with remaining photos
      for (let i = 2; i < photoCount; i++) {
        concatFilters += `[veo_insert][photo${i}]blend=all_expr='A*(if(gte(T,0.5),1,2*T))+B*(if(lt(T,0.5),1,2-2*T))':shortest=1[veo_insert];`;
      }
    }
  } else {
    // Regular crossfade between all photos
    for (let i = 0; i < photoCount - 1; i++) {
      const nextIndex = i + 1;
      const crossfadeName = i === 0 ? 'final' : `crossfade${i}`;
      const prevName = i === 0 ? 'photo0' : `crossfade${i-1}`;
      
      concatFilters += `[${prevName}][photo${nextIndex}]blend=all_expr='A*(if(gte(T,0.5),1,2*T))+B*(if(lt(T,0.5),1,2-2*T))':shortest=1[${crossfadeName}];`;
    }
  }
  
  // Add captions
  const captionFilter = addCaptions(script || '', style);
  
  // Audio mixing
  const voiceInputIndex = photoCount; // Voice is after photos
  const musicInputIndex = photoCount + 1; // Music is after voice
  const audioFilter = `[${voiceInputIndex}][${musicInputIndex}]amix=inputs=2:duration=first:dropout_transition=2[audio]`;
  
  // Combine all filters
  const allFilters = [
    ...filters,
    concatFilters,
    captionFilter,
    audioFilter
  ].filter(Boolean).join(';');
  
  return allFilters;
}

function addCaptions(script: string, style: StylePreset): string {
  // Simple caption overlay at bottom center
  const words = script.split(' ');
  const wordsPerCaption = 4;
  const captionText = words.reduce((acc, word, index) => {
    if (index % wordsPerCaption === 0) {
      acc.push(words.slice(index, index + wordsPerCaption).join(' '));
    }
    return acc;
  }, [] as string[]).join('\\n');
  
  return `[final]drawtext=text='${captionText}':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=h-380:box=1:boxcolor=black@0.5:boxborderw=10[final_with_captions]`;
}

async function createSilentAudio(outputPath: string, durationSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=channel_layout=stereo:sample_rate=48000')
      .inputOptions(['-f', 'lavfi'])
      .outputOptions(['-t', durationSec.toString()])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}