'use client';

import { useState, useEffect } from 'react';
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
import { getUserJobs, subscribeToJob } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Job, JobStatus } from '@vr-reels/shared';

export function JobList() {
  const [user] = useAuthState();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadJobs = async () => {
      try {
        const userJobs = await getUserJobs(user.uid);
        setJobs(userJobs);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user]);

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'rendering':
        return <Loader className="h-4 w-4 animate-spin" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'rendering':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your jobs...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No jobs yet. Create your first reel!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Your Jobs</h3>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const [currentJob, setCurrentJob] = useState(job);

  useEffect(() => {
    const unsubscribe = subscribeToJob(job.id, (updatedJob) => {
      if (updatedJob) {
        setCurrentJob(updatedJob);
      }
    });

    return unsubscribe;
  }, [job.id]);

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'rendering':
        return <Loader className="h-4 w-4 animate-spin" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'rendering':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {currentJob.payload.title || `${currentJob.payload.location} Reel`}
            </CardTitle>
            <CardDescription>
              {currentJob.payload.location} • {currentJob.payload.style} • {formatDate(currentJob.createdAt)}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(currentJob.status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(currentJob.status)}
              {currentJob.status}
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {currentJob.status === 'rendering' && currentJob.progress !== undefined && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentJob.progress}%</span>
            </div>
            <Progress value={currentJob.progress} />
          </div>
        )}

        {currentJob.status === 'done' && currentJob.outputUrl && (
          <div className="space-y-2">
            <p className="text-sm text-green-600">Your reel is ready!</p>
            <Button asChild>
              <a href={currentJob.outputUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download MP4
              </a>
            </Button>
          </div>
        )}

        {currentJob.status === 'error' && currentJob.error && (
          <div className="space-y-2">
            <p className="text-sm text-red-600">Error: {currentJob.error}</p>
          </div>
        )}

        {currentJob.status === 'queued' && (
          <p className="text-sm text-muted-foreground">Your job is in the queue...</p>
        )}
      </CardContent>
    </Card>
  );
}
