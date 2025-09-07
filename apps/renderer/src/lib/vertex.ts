import { VertexAI } from '@google-cloud/vertexai';
import { VertexAIConfig } from '@vr-reels/shared';
import * as fs from 'fs';
import * as path from 'path';

const config: VertexAIConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || '',
  location: process.env.VERTEX_LOCATION || 'us-central1',
  geminiModel: process.env.VERTEX_GEMINI_MODEL || 'gemini-2.0-flash',
  veoModel: process.env.VERTEX_VEO_MODEL || 'veo-3',
};

const vertexAI = new VertexAI({
  project: config.projectId,
  location: config.location,
});

export async function generateScript(location: string, description: string): Promise<string> {
  try {
    const model = vertexAI.getGenerativeModel({ model: config.geminiModel });

    const prompt = `You write concise travel voiceovers for 25–32 second vertical reels.

Write a 95-word, second-person narration for a property reel.
Location: ${location}
Description: """${description}"""

Requirements:
- Start with a 1-sentence hook.
- Include 3 standout features from the description.
- Include exactly one sensory detail.
- End with: "Save this for your next trip."
Style: upbeat, cinematic, clear. No emojis, no hashtags, no brand names.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('No script generated');
    }

    return text.trim();
  } catch (error) {
    console.error('Error generating script:', error);
    // Fallback script
    return `Welcome to ${location}. This stunning property offers incredible features that will make your stay unforgettable. The beautiful surroundings and amazing amenities create the perfect getaway experience. You'll love the peaceful atmosphere and modern comforts. Save this for your next trip.`;
  }
}

export async function generateVeoVideo(location: string): Promise<string> {
  try {
    const model = vertexAI.getGenerativeModel({ model: config.veoModel });

    const prompt = `A subtle motion accent to intercut with vacation rental photos.
Scene: nature or amenity adjacent to ${location}. Gentle movement, aesthetic bokeh.
Examples: palm fronds swaying, fireplace flicker, ocean shimmer, tree leaves in breeze.
Cinematic, soft light, crisp detail. Vertical 9:16. Duration 6–8 seconds.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // In a real implementation, this would return a video file
    // For now, we'll create a placeholder
    const outputPath = path.join('/tmp', 'veo.mp4');
    
    // Create a placeholder file (in real implementation, this would be the actual video)
    fs.writeFileSync(outputPath, 'placeholder video content');
    
    return outputPath;
  } catch (error) {
    console.error('Error generating Veo video:', error);
    throw error;
  }
}