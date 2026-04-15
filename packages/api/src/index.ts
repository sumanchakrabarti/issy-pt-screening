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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
