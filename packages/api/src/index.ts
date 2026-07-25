import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { clinicRouter } from './routes/clinics';
import { clubRouter } from './routes/clubs';
import { teamRouter } from './routes/teams';
import { athleteRouter } from './routes/athletes';
import { sessionRouter } from './routes/sessions';
import { reportRouter } from './routes/reports';
import { userRouter, statsRouter } from './routes/users';
import { relationRouter } from './routes/relations';
import { videoRouter } from './routes/videos';
import { exerciseRouter } from './routes/exercises';
import { muscleGroupRouter } from './routes/muscleGroups';
import { ligamentGroupRouter } from './routes/ligamentGroups';

const app = express();
const PORT = process.env.PORT || 3001;

// In production (behind the Azure App Service reverse proxy) trust the first
// proxy so req.protocol/secure and client IPs are correct.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Allowed CORS origins come from the CORS_ORIGIN env var (comma-separated) in
// production; fall back to the local Vite dev server otherwise.
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/clinics', clinicRouter);
app.use('/api/clubs', clubRouter);
app.use('/api/teams', teamRouter);
app.use('/api/athletes', athleteRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/reports', reportRouter);
app.use('/api/users', userRouter);
app.use('/api/stats', statsRouter);
app.use('/api/relations', relationRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/muscle-groups', muscleGroupRouter);
app.use('/api/ligament-groups', ligamentGroupRouter);
app.use('/api', videoRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
