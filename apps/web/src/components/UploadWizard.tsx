'use client';

import { useState, useRef } from 'react';
// Mock auth state for local development
const useAuthState = () => {
  const [user, setUser] = useState({
    uid: 'mock-user-id',
    displayName: 'Mock User',
    email: 'mock@example.com',
    getIdToken: async () => 'mock-token'
  });
  const [loading, setLoading] = useState(false);
  
  return [user, loading];
};
import { uploadFile, getStoragePath } from '@/lib/storage';
import { createJob } from '@/lib/firestore';
// import { createRenderTask } from '@/lib/tasks'; // Moved to API route
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Check } from 'lucide-react';
import { StylePreset } from '@vr-reels/shared';

interface UploadedFile {
  file: File;
  url: string;
  progress: number;
  error?: string;
}

export function UploadWizard() {
  const [user] = useAuthState();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState<StylePreset>('classic');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const uploadedFile: UploadedFile = {
          file,
          url: '',
          progress: 0,
        };
        setUploadedFiles(prev => [...prev, uploadedFile]);
      }
    });
  };

  const uploadFileToStorage = async (uploadedFile: UploadedFile, index: number) => {
    if (!user) return;

    try {
      const path = getStoragePath(user.uid, 'temp', uploadedFile.file.name);
      const url = await uploadFile(
        uploadedFile.file,
        path,
        (progress) => {
          setUploadedFiles(prev => 
            prev.map((file, i) => 
              i === index ? { ...file, progress } : file
            )
          );
        }
      );

      setUploadedFiles(prev => 
        prev.map((file, i) => 
          i === index ? { ...file, url, progress: 100 } : file
        )
      );
    } catch (error) {
      setUploadedFiles(prev => 
        prev.map((file, i) => 
          i === index ? { ...file, error: 'Upload failed' } : file
        )
      );
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (!user || uploadedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await Promise.all(
        uploadedFiles.map((file, index) => uploadFileToStorage(file, index))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user || !location || !description || uploadedFiles.length === 0) return;

    const completedFiles = uploadedFiles.filter(f => f.url && f.progress === 100);
    if (completedFiles.length === 0) {
      alert('Please upload at least one photo first');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        title: title || undefined,
        location,
        description,
        photos: completedFiles.map(f => f.url),
        style,
        durationSec: 30,
        emailNotify: false,
      };

      // Call API route to create job and trigger render task
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      const { jobId } = await response.json();
      setCreatedJobId(jobId);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const canGenerate = location && description && uploadedFiles.some(f => f.url && f.progress === 100);
  const allUploaded = uploadedFiles.every(f => f.url && f.progress === 100);

  if (createdJobId) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Job Created Successfully
          </CardTitle>
          <CardDescription>
            Your reel is being generated. Job ID: {createdJobId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              setCreatedJobId(null);
              setUploadedFiles([]);
              setTitle('');
              setLocation('');
              setDescription('');
              setStyle('classic');
            }}
            className="w-full"
          >
            Create Another Reel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Property Reel</CardTitle>
          <CardDescription>
            Upload photos, add details, and let AI create a stunning reel for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Photos (6-15 recommended)</label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Photos
                </Button>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.file.name}</p>
                      {file.progress < 100 && (
                        <Progress value={file.progress} className="mt-1" />
                      )}
                      {file.error && (
                        <p className="text-sm text-red-500">{file.error}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {!allUploaded && (
                  <Button
                    onClick={handleUploadAll}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? 'Uploading...' : 'Upload All Photos'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title (optional)</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Beautiful Beach House"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Location *</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Malibu, California"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the property, its features, and what makes it special..."
                rows={4}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={(value: StylePreset) => setStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic (Ken Burns, captions, VO, music)</SelectItem>
                  <SelectItem value="parallax">Parallax (same as classic, with depth masks)</SelectItem>
                  <SelectItem value="hybrid">Hybrid (classic + AI video insert)</SelectItem>
                  <SelectItem value="destination">Destination (classic + map fly-in)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? 'Creating Job...' : 'Generate Reel'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
