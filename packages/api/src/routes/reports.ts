import { Router, Response } from 'express';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate } from '../middleware/auth';
import { generateAthleteReport } from '../services/pdfReport';

export const reportRouter = Router();
reportRouter.use(authenticate);

// Generate PDF report for a session
reportRouter.get('/sessions/:id/pdf', async (req, res: Response) => {
  try {
    const session = await prisma.screeningSession.findUnique({
      where: { id: param(req, 'id') },
      include: {
        athlete: true,
        team: { include: { club: true } },
        scoreRecords: true,
        exercisePrescriptions: true,
      },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

    const doc = generateAthleteReport(session as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="screening-${session.athlete.lastName}-${new Date(session.date).toISOString().split('T')[0]}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Export session data as JSON
reportRouter.get('/sessions/:id/export', async (req, res: Response) => {
  const session = await prisma.screeningSession.findUnique({
    where: { id: param(req, 'id') },
    include: {
      athlete: true,
      team: { include: { club: true } },
      scoreRecords: true,
      exercisePrescriptions: true,
    },
  });
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="screening-${session.athlete.lastName}-${new Date(session.date).toISOString().split('T')[0]}.json"`);
  res.json(session);
});

// Export all sessions as CSV
reportRouter.get('/sessions/export/csv', async (_req, res: Response) => {
  const sessions = await prisma.screeningSession.findMany({
    include: {
      athlete: true,
      team: { include: { club: true } },
      scoreRecords: true,
    },
    orderBy: { date: 'desc' },
  });

  const header = 'Date,Athlete,Team,Club,Status,Risk Score,Risk Category,Movement Scores,Strength Scores,Hop Scores\n';
  const rows = sessions.map((s) => {
    const movementScores = s.scoreRecords.filter((r) => r.type === 'movement').map((r) => `${r.name}:${r.score ?? ''}`).join(';');
    const strengthScores = s.scoreRecords.filter((r) => r.type === 'strength').map((r) => `${r.name}:L${r.valueLeft ?? ''}R${r.valueRight ?? ''}`).join(';');
    const hopScores = s.scoreRecords.filter((r) => r.type === 'hop').map((r) => `${r.name}:L${r.valueLeft ?? ''}R${r.valueRight ?? ''}`).join(';');
    return [
      new Date(s.date).toISOString().split('T')[0],
      `"${s.athlete.firstName} ${s.athlete.lastName}"`,
      `"${s.team.name}"`,
      `"${s.team.club.name}"`,
      s.status,
      s.riskScore ?? '',
      s.riskCategory ?? '',
      `"${movementScores}"`,
      `"${strengthScores}"`,
      `"${hopScores}"`,
    ].join(',');
  }).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="screening-sessions.csv"');
  res.send(header + rows);
});
