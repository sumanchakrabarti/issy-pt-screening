import PDFDocument from 'pdfkit';
import { ScreeningSession, Athlete, Team, Club, ScoreRecord, ExercisePrescription } from '@prisma/client';

type FullSession = ScreeningSession & {
  athlete: Athlete;
  team: Team & { club: Club };
  scoreRecords: ScoreRecord[];
  exercisePrescriptions: ExercisePrescription[];
};

const COLORS = {
  low: '#22c55e',
  moderate: '#ca8a04',
  high: '#ea580c',
  very_high: '#dc2626',
};

export function generateAthleteReport(session: FullSession): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  const athlete = session.athlete;
  const age = Math.floor((Date.now() - new Date(athlete.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('ACL Screening Report', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#64748b')
    .text('Issaquah Physical Therapy', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#e2e8f0').stroke();
  doc.moveDown(0.75);

  // Athlete info
  doc.fillColor('#000');
  doc.fontSize(14).font('Helvetica-Bold').text('Athlete Information');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  const infoY = doc.y;
  doc.text(`Name: ${athlete.firstName} ${athlete.lastName}`, 50, infoY);
  doc.text(`Age: ${age} years`, 50);
  doc.text(`Gender: ${athlete.gender}`, 50);
  doc.text(`Date of Birth: ${new Date(athlete.dateOfBirth).toLocaleDateString()}`, 300, infoY);
  doc.text(`Team: ${session.team.name}`, 300);
  doc.text(`Club: ${session.team.club.name}`, 300);
  doc.y = Math.max(doc.y, infoY + 50);

  if (athlete.medicalHistory) {
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text('Medical History: ', { continued: true });
    doc.font('Helvetica').text(athlete.medicalHistory);
  }

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#e2e8f0').stroke();
  doc.moveDown(0.75);

  // Session info + Risk Assessment side-by-side
  const sectionTop = doc.y;
  const leftCol = 50;
  const rightCol = 310;

  // Left column: Session Details
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Session Details', leftCol, sectionTop);
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Date: ${new Date(session.date).toLocaleDateString()}`, leftCol);
  doc.text(`Status: ${session.status}`, leftCol);
  if (session.notes) doc.text(`Notes: ${session.notes}`, leftCol, doc.y, { width: 240 });
  const leftBottom = doc.y;

  // Right column: Risk Assessment
  if (session.riskScore !== null && session.riskCategory) {
    const riskColor = COLORS[session.riskCategory as keyof typeof COLORS] || '#94a3b8';
    const label = session.riskCategory.replace('_', ' ').toUpperCase();

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Risk Assessment', rightCol, sectionTop, { width: 252, align: 'center' });
    const riskValueY = sectionTop + 22;
    doc.fontSize(36).font('Helvetica-Bold').fillColor(riskColor)
      .text(`${session.riskScore}`, rightCol, riskValueY, { width: 252, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor(riskColor)
      .text(label, rightCol, doc.y, { width: 252, align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
      .text('⚠ Clinic support tool — NOT a diagnostic assessment.', rightCol, doc.y, { width: 252, align: 'center' });
  }

  doc.y = Math.max(leftBottom, doc.y) + 10;
  doc.x = leftCol;

  doc.fillColor('#000');
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#e2e8f0').stroke();
  doc.moveDown(0.75);

  // Score records table
  const scores = session.scoreRecords;
  if (scores.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Score Records');
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const colX = [50, 120, 230, 310, 390, 450];
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
    doc.text('TYPE', colX[0], tableTop);
    doc.text('TEST', colX[1], tableTop);
    doc.text('LEFT', colX[2], tableTop);
    doc.text('RIGHT', colX[3], tableTop);
    doc.text('SCORE', colX[4], tableTop);
    doc.text('NOTES', colX[5], tableTop);

    doc.moveTo(50, tableTop + 14).lineTo(562, tableTop + 14).strokeColor('#e2e8f0').stroke();

    doc.fillColor('#000').font('Helvetica').fontSize(9);
    let rowY = tableTop + 20;
    for (const s of scores) {
      if (rowY > 700) { doc.addPage(); rowY = 50; }
      doc.text(s.type, colX[0], rowY);
      doc.text(s.name, colX[1], rowY, { width: 100 });
      doc.text(s.valueLeft !== null ? String(s.valueLeft) : '—', colX[2], rowY);
      doc.text(s.valueRight !== null ? String(s.valueRight) : '—', colX[3], rowY);
      doc.text(s.score !== null ? String(s.score) : '—', colX[4], rowY);
      doc.text(s.notes || '—', colX[5], rowY, { width: 112 });
      rowY += 18;
    }
    doc.x = 50;
    doc.y = rowY + 10;
  }

  doc.moveDown(0.5);

  // Exercise prescriptions
  const prescriptions = session.exercisePrescriptions;
  if (prescriptions.length > 0) {
    if (doc.y > 600) doc.addPage();
    doc.x = 50;
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.75);

    doc.x = 50;
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Exercise Prescriptions', 50);
    doc.moveDown(0.5);

    for (const p of prescriptions) {
      if (doc.y > 700) { doc.addPage(); doc.x = 50; }
      doc.fontSize(10).font('Helvetica-Bold').text(p.exerciseName, 50);
      const details: string[] = [];
      if (p.sets) details.push(`${p.sets} sets`);
      if (p.reps) details.push(`${p.reps} reps`);
      if (p.duration) details.push(p.duration);
      doc.fontSize(9).font('Helvetica').text(details.join(' × '), 50);
      if (p.notes) doc.fontSize(8).fillColor('#64748b').text(p.notes, 50);
      doc.fillColor('#000');
      doc.moveDown(0.4);
    }
  }

  // Footer
  doc.moveDown(1);
  doc.x = 50;
  doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#e2e8f0').stroke();
  doc.moveDown(0.5);
  doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
    .text(`Report generated: ${new Date().toLocaleString()}`, 50, doc.y, { align: 'center', width: 512 });
  doc.text('Issaquah Physical Therapy — Confidential', 50, doc.y, { align: 'center', width: 512 });

  return doc;
}
