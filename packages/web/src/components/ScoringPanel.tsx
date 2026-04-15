import { useState } from 'react';
import { api } from '../services/api';
import type { TestDefinition } from '../services/screeningTests';

interface Props {
  tests: TestDefinition[];
  sessionId: string;
  existingScores: Record<string, { valueLeft?: number; valueRight?: number; score?: number; notes?: string }>;
  onComplete: () => void;
}

export function ScoringPanel({ tests, sessionId, existingScores, onComplete }: Props) {
  const [scores, setScores] = useState<Record<string, { valueLeft: string; valueRight: string; score: string; notes: string }>>(
    () => {
      const init: Record<string, { valueLeft: string; valueRight: string; score: string; notes: string }> = {};
      for (const t of tests) {
        const existing = existingScores[t.name];
        init[t.name] = {
          valueLeft: existing?.valueLeft?.toString() ?? '',
          valueRight: existing?.valueRight?.toString() ?? '',
          score: existing?.score?.toString() ?? '',
          notes: existing?.notes ?? '',
        };
      }
      return init;
    }
  );
  const [saving, setSaving] = useState(false);

  const updateScore = (testName: string, field: string, value: string) => {
    setScores((prev) => ({ ...prev, [testName]: { ...prev[testName], [field]: value } }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const test of tests) {
        const data = scores[test.name];
        const hasData = data.valueLeft || data.valueRight || data.score;
        if (!hasData) continue;

        await api.post(`/sessions/${sessionId}/scores`, {
          type: test.type,
          name: test.name,
          valueLeft: data.valueLeft ? Number(data.valueLeft) : undefined,
          valueRight: data.valueRight ? Number(data.valueRight) : undefined,
          score: data.score ? Number(data.score) : undefined,
          notes: data.notes || undefined,
        });
      }
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const asymmetry = (left: string, right: string): string | null => {
    const l = Number(left);
    const r = Number(right);
    if (!l && !r) return null;
    const max = Math.max(l, r);
    if (max === 0) return null;
    const pct = Math.round((Math.abs(l - r) / max) * 100);
    return `${pct}%`;
  };

  const asymmetryColor = (left: string, right: string): string => {
    const l = Number(left);
    const r = Number(right);
    const max = Math.max(l, r);
    if (max === 0) return '#94a3b8';
    const pct = (Math.abs(l - r) / max) * 100;
    if (pct > 20) return '#ef4444';
    if (pct > 15) return '#f97316';
    if (pct > 10) return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="scoring-panel">
      {tests.map((test) => {
        const data = scores[test.name];
        return (
          <div key={test.name} className="test-card">
            <div className="test-header">
              <h3>{test.label}</h3>
              <span className="badge badge-gray">{test.type}</span>
            </div>
            <p className="test-description">{test.description}</p>

            <div className="test-inputs">
              {(test.inputMode === 'bilateral' || test.inputMode === 'both') && (
                <div className="bilateral-inputs">
                  <div className="form-group">
                    <label>Left {test.unit ? `(${test.unit})` : ''}</label>
                    <input type="number" value={data.valueLeft} onChange={(e) => updateScore(test.name, 'valueLeft', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Right {test.unit ? `(${test.unit})` : ''}</label>
                    <input type="number" value={data.valueRight} onChange={(e) => updateScore(test.name, 'valueRight', e.target.value)} />
                  </div>
                  {data.valueLeft && data.valueRight && (
                    <div className="asymmetry-indicator">
                      <span style={{ color: asymmetryColor(data.valueLeft, data.valueRight) }}>
                        Asymmetry: {asymmetry(data.valueLeft, data.valueRight)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {(test.inputMode === 'score' || test.inputMode === 'both') && (
                <div className="form-group">
                  <label>{test.scoreLabel || 'Score (0–100)'}</label>
                  <input type="number" min="0" max="100" value={data.score} onChange={(e) => updateScore(test.name, 'score', e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <input type="text" placeholder="Optional notes" value={data.notes} onChange={(e) => updateScore(test.name, 'notes', e.target.value)} />
              </div>
            </div>
          </div>
        );
      })}

      <button className="btn-primary" onClick={handleSaveAll} disabled={saving} style={{ width: 'auto', marginTop: '1rem' }}>
        {saving ? 'Saving...' : 'Save & Continue'}
      </button>
    </div>
  );
}
