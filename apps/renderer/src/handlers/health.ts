import { Request, Response } from 'express';

export function healthHandler(req: Request, res: Response) {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'vr-reels-renderer'
  });
}