import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { renderHandler } from './handlers/render';
import { healthHandler } from './handlers/health';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/health', healthHandler);
app.post('/render', renderHandler);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Renderer service listening on port ${port}`);
});