import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ScoringPanel } from '../components/ScoringPanel';
import { VideoCapture } from '../components/VideoCapture';
import { MOVEMENT_TESTS, STRENGTH_TESTS, HOP_TESTS, SCREENING_STEPS } from '../services/screeningTests';
import type { ScreeningSession } from '../types';

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [step, setStep] = useState(0);

  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [videos, setVideos] = useState<{ front?: Blob; side?: Blob }>({});

  useEffect(() => {
    if (!id) return;
    loadSession();
  }, [id]);

  const loadSession = () => {
    api.get<ScreeningSession>(`/sessions/${id}`).then((s) => {
      setSession(s);
      if (s.status === 'completed') goToStep(4); // jump to review
    });
  };

  const handleComplete = async () => {
    if (!id) return;
    const updated = await api.post<ScreeningSession>(`/sessions/${id}/complete`, {});
    setSession(updated);
    setStep(4);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this screening session and all its data?')) return;
    await api.delete(`/sessions/${id}`);
    navigate('/sessions');
  };

  const handleExport = (format: 'pdf' | 'json') => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:3001/api/reports/sessions/${id}/${format === 'pdf' ? 'pdf' : 'export'}`;
    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    // Use fetch with auth header for proper download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = format === 'pdf' ? 'screening-report.pdf' : 'screening-data.json';
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  const existingScores = () => {
    const map: Record<string, { valueLeft?: number; valueRight?: number; score?: number; notes?: string }> = {};
    for (const s of session?.scoreRecords || []) {
      map[s.name] = { valueLeft: s.valueLeft, valueRight: s.valueRight, score: s.score, notes: s.notes };
    }
    return map;
  };

  const riskColor = (cat?: string) => {
    switch (cat) {
      case 'low': return '#22c55e';
      case 'moderate': return '#eab308';
      case 'high': return '#f97316';
      case 'very_high': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  if (!session) return <div className="loading">Loading...</div>;

  const scores = session.scoreRecords || [];
  const prescriptions = session.exercisePrescriptions || [];
  const currentStep = SCREENING_STEPS[step];

  return (
    <div>
      <div className="detail-header">
        <div className="breadcrumb">
          <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
          <Link to="/sessions">Sessions</Link>
          {session.athlete && <>{' / '}<Link to={`/athletes/${session.athlete.id}`}>{session.athlete.firstName} {session.athlete.lastName}</Link></>}
        </div>
      </div>

      {/* Step indicator */}
      {session.status !== 'completed' && (
        <div className="wizard-steps">
          {SCREENING_STEPS.map((s, i) => (
            <button
              key={s.key}
              className={`wizard-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            >
              <span className="step-number">{i + 1}</span>
              <span className="step-label">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 0: Session Info + Video */}
      {currentStep.key === 'info' && (
        <div>
          <h2>Session Info</h2>
          <div className="detail-cards">
            <div className="info-card">
              <h3>Details</h3>
              <dl>
                <dt>Athlete</dt>
                <dd>{session.athlete ? `${session.athlete.firstName} ${session.athlete.lastName}` : '—'}</dd>
                <dt>Team</dt><dd>{session.team?.name || '—'}</dd>
                <dt>Date</dt><dd>{new Date(session.date).toLocaleDateString()}</dd>
                <dt>Status</dt><dd><span className={`badge ${session.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>{session.status}</span></dd>
              </dl>
            </div>
          </div>

          <div className="section">
            <h3>Video Capture</h3>
            <p className="text-muted">Record front and side view videos of the athlete performing movements.</p>
            <div className="video-grid">
              <VideoCapture label="Front View" onRecorded={(blob) => setVideos({ ...videos, front: blob })} />
              <VideoCapture label="Side View" onRecorded={(blob) => setVideos({ ...videos, side: blob })} />
            </div>
          </div>

          <div className="wizard-nav">
            <div></div>
            <button className="btn-primary" onClick={() => goToStep(1)} style={{ width: 'auto' }}>
              Next: Movement Scoring →
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Movement */}
      {currentStep.key === 'movement' && (
        <div>
          <h2>Movement Scoring</h2>
          <p className="text-muted">Score each movement test. Higher score = greater risk concern.</p>
          <ScoringPanel
            tests={MOVEMENT_TESTS}
            sessionId={id!}
            existingScores={existingScores()}
            onComplete={() => { loadSession(); goToStep(2); }}
          />
          <div className="wizard-nav">
            <button className="btn-secondary" onClick={() => goToStep(0)}>← Back</button>
          </div>
        </div>
      )}

      {/* Step 2: Strength */}
      {currentStep.key === 'strength' && (
        <div>
          <h2>Strength Testing</h2>
          <p className="text-muted">Enter bilateral strength measurements. Asymmetry {'>'} 15% is a risk factor.</p>
          <ScoringPanel
            tests={STRENGTH_TESTS}
            sessionId={id!}
            existingScores={existingScores()}
            onComplete={() => { loadSession(); goToStep(3); }}
          />
          <div className="wizard-nav">
            <button className="btn-secondary" onClick={() => goToStep(1)}>← Back</button>
          </div>
        </div>
      )}

      {/* Step 3: Hop */}
      {currentStep.key === 'hop' && (
        <div>
          <h2>Hop Testing</h2>
          <p className="text-muted">Enter bilateral hop measurements. Asymmetry {'>'} 10% is a risk factor.</p>
          <ScoringPanel
            tests={HOP_TESTS}
            sessionId={id!}
            existingScores={existingScores()}
            onComplete={() => { loadSession(); goToStep(4); }}
          />
          <div className="wizard-nav">
            <button className="btn-secondary" onClick={() => goToStep(2)}>← Back</button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Complete */}
      {currentStep.key === 'review' && (
        <div>
          <h2>Review & Results</h2>

          {session.status === 'completed' && (
            <div className="detail-cards">
              <div className="info-card risk-card" style={{ borderColor: riskColor(session.riskCategory) }}>
                <h3>Risk Assessment</h3>
                <div className="risk-score" style={{ color: riskColor(session.riskCategory) }}>
                  {session.riskScore}
                </div>
                <div className="risk-category" style={{ color: riskColor(session.riskCategory) }}>
                  {session.riskCategory?.replace('_', ' ').toUpperCase()}
                </div>
                <p className="disclaimer">
                  ⚠️ This is a clinic support tool and is NOT a diagnostic assessment.
                </p>
              </div>
              <div className="info-card">
                <h3>Session Summary</h3>
                <dl>
                  <dt>Athlete</dt><dd>{session.athlete ? `${session.athlete.firstName} ${session.athlete.lastName}` : '—'}</dd>
                  <dt>Date</dt><dd>{new Date(session.date).toLocaleDateString()}</dd>
                  <dt>Total Scores</dt><dd>{scores.length}</dd>
                  <dt>Prescriptions</dt><dd>{prescriptions.length}</dd>
                </dl>
              </div>
            </div>
          )}

          {session.status === 'completed' && (
            <div className="export-buttons">
              <button className="btn-secondary" onClick={() => handleExport('pdf')}>📄 Download PDF Report</button>
              <button className="btn-secondary" onClick={() => handleExport('json')}>📋 Export JSON</button>
            </div>
          )}

          {session.status !== 'completed' && (
            <div className="complete-section">
              <p>You have recorded <strong>{scores.length}</strong> score(s). Click below to calculate the risk score and generate exercise prescriptions.</p>
              <button className="btn-primary" onClick={handleComplete} style={{ width: 'auto' }}>
                ✓ Complete Session & Calculate Risk
              </button>
              <div className="wizard-nav" style={{ marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={() => goToStep(3)}>← Back to Hop Testing</button>
              </div>
            </div>
          )}

          {/* Score Records */}
          <div className="section">
            <h3>All Score Records ({scores.length})</h3>
            {scores.length === 0 ? (
              <p className="empty-state">No scores recorded.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Type</th><th>Test</th><th>Left</th><th>Right</th><th>Score</th><th>Notes</th></tr></thead>
                <tbody>
                  {scores.map((s) => (
                    <tr key={s.id}>
                      <td><span className="badge badge-gray">{s.type}</span></td>
                      <td>{s.name}</td>
                      <td>{s.valueLeft ?? '—'}</td>
                      <td>{s.valueRight ?? '—'}</td>
                      <td>{s.score ?? '—'}</td>
                      <td>{s.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Exercise Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="section">
              <h3>Exercise Prescriptions</h3>
              <table className="data-table">
                <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Duration</th><th>Notes</th></tr></thead>
                <tbody>
                  {prescriptions.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.exerciseName}</strong></td>
                      <td>{p.sets ?? '—'}</td>
                      <td>{p.reps ?? '—'}</td>
                      <td>{p.duration || '—'}</td>
                      <td>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="section delete-section">
        <button className="btn-danger" onClick={handleDelete}>Delete Session</button>
      </div>
    </div>
  );
}
