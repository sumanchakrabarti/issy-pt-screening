import { ScoreRecord } from '@prisma/client';

interface RiskResult {
  riskScore: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
}

/**
 * Calculates ACL injury risk based on screening score records.
 *
 * Risk category thresholds:
 *   Low < 30, Moderate 30–49, High 50–69, Very High ≥ 70
 *
 * This is a clinic support tool and is NOT diagnostic.
 */
export function calculateRisk(scores: ScoreRecord[]): RiskResult {
  if (scores.length === 0) {
    return { riskScore: 0, riskCategory: 'low' };
  }

  let totalScore = 0;
  let count = 0;

  for (const record of scores) {
    // Movement scores contribute directly
    if (record.score !== null) {
      totalScore += record.score;
      count++;
    }

    // Asymmetry between left/right values increases risk
    if (record.valueLeft !== null && record.valueRight !== null) {
      const max = Math.max(record.valueLeft, record.valueRight);
      if (max > 0) {
        const asymmetry = Math.abs(record.valueLeft - record.valueRight) / max;
        // Asymmetry > 15% is a known risk factor; scale to 0–100
        const asymmetryScore = Math.min(asymmetry * 100, 100);
        totalScore += asymmetryScore;
        count++;
      }
    }
  }

  const riskScore = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;
  const riskCategory = categorize(riskScore);

  return { riskScore, riskCategory };
}

function categorize(score: number): RiskResult['riskCategory'] {
  if (score >= 70) return 'very_high';
  if (score >= 50) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}
