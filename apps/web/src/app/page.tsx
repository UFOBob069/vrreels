'use client';

import { useState } from 'react';
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
import { UploadWizard } from '@/components/UploadWizard';
import { JobList } from '@/components/JobList';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, signOut } from '@/lib/auth';

export default function Home() {
  const [user, loading] = useAuthState();
  const [showJobs, setShowJobs] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Welcome to VR Reels Builder</h2>
          <p className="text-muted-foreground">
            Create stunning property reels with AI-powered voiceovers and video generation
          </p>
          <Button onClick={signInWithGoogle} className="w-full">
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {user.displayName}</h2>
          <p className="text-muted-foreground">Create your next property reel</p>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowJobs(!showJobs)}
          >
            {showJobs ? 'Create New' : 'My Jobs'}
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {showJobs ? <JobList /> : <UploadWizard />}
    </div>
  );
}
