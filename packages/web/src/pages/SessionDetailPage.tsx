import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { API_BASE } from '../config';
import { useAuth } from '../hooks/useAuth';
import { ScoringPanel } from '../components/ScoringPanel';
import { VideoCapture } from '../components/VideoCapture';
import { MOVEMENT_TESTS, STRENGTH_TESTS, HOP_TESTS, SCREENING_STEPS } from '../services/screeningTests';
import { statusLabel, statusBadgeClass } from '../services/sessionStatus';
import type { ScreeningSession, Exercise, ExercisePrescription } from '../types';

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'clinician';
  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [step, setStep] = useState(0);

  // Per-session prescription editing state.
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [addingRx, setAddingRx] = useState(false);
  const [rxForm, setRxForm] = useState({ exerciseId: '', sets: '', reps: '', duration: '', notes: '' });
  const [editingRxId, setEditingRxId] = useState<string | null>(null);
  const [editRxForm, setEditRxForm] = useState({ exerciseId: '', sets: '', reps: '', duration: '', notes: '' });

  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [sessionVideos, setSessionVideos] = useState<{ id: string; viewType: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    loadSession();
  }, [id]);

  useEffect(() => {
    if (canManage) api.get<Exercise[]>('/exercises').then(setCatalog);
  }, [canManage]);

  const loadSession = () => {
    api.get<ScreeningSession>(`/sessions/${id}`).then((s) => {
      setSession(s);
      if (s.status !== 'in_progress') goToStep(4); // jump to review/results
    });
    loadVideos();
  };

  const loadVideos = () => {
    api.get<{ id: string; viewType: string }[]>(`/sessions/${id}/videos`).then(setSessionVideos);
  };

  const handleComplete = async () => {
    if (!id) return;
    const updated = await api.post<ScreeningSession>(`/sessions/${id}/complete`, {});
    setSession(updated);
    setStep(4);
  };

  const handleFinalize = async () => {
    if (!id) return;
    if (!confirm('Finalize this screening? This marks the review complete with the selected prescriptions.')) return;
    const updated = await api.post<ScreeningSession>(`/sessions/${id}/finalize`, {});
    setSession(updated);
    setStep(4);
  };

  const handleRequestConsultation = async () => {
    if (!id) return;
    if (!confirm('Request a consultation with a clinician about this screening?')) return;
    const updated = await api.post<ScreeningSession>(`/sessions/${id}/request-consultation`, {});
    setSession(updated);
    setStep(4);
  };

  const handleArchive = async () => {
    if (!id) return;
    if (!confirm('Archive this screening? No further follow-up will be requested.')) return;
    const updated = await api.post<ScreeningSession>(`/sessions/${id}/archive`, {});
    setSession(updated);
    setStep(4);
  };

  const rxPayload = (f: { exerciseId: string; sets: string; reps: string; duration: string; notes: string }) => ({
    exerciseId: f.exerciseId,
    sets: f.sets ? Number(f.sets) : undefined,
    reps: f.reps ? Number(f.reps) : undefined,
    duration: f.duration || undefined,
    notes: f.notes || undefined,
  });

  const handleAddRx = async () => {
    if (!id || !rxForm.exerciseId) return;
    await api.post<ExercisePrescription>(`/sessions/${id}/prescriptions`, rxPayload(rxForm));
    setRxForm({ exerciseId: '', sets: '', reps: '', duration: '', notes: '' });
    setAddingRx(false);
    loadSession();
  };

  const handleUpdateRx = async (pid: string) => {
    if (!id) return;
    await api.put<ExercisePrescription>(`/sessions/${id}/prescriptions/${pid}`, rxPayload(editRxForm));
    setEditingRxId(null);
    loadSession();
  };

  const handleDeleteRx = async (pid: string) => {
    if (!id || !confirm('Remove this prescription?')) return;
    await api.delete(`/sessions/${id}/prescriptions/${pid}`);
    loadSession();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this screening session and all its data?')) return;
    await api.delete(`/sessions/${id}`);
    navigate('/sessions');
  };

  const handleExport = (format: 'pdf' | 'json') => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/reports/sessions/${id}/${format === 'pdf' ? 'pdf' : 'export'}`;
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
  // Post-completion states share the same read-only results view; the athlete/family
  // can act on a `completed` screening by requesting a consultation or archiving it.
  const isPostCompletion = ['completed', 'consultation_requested', 'archived'].includes(session.status);

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
      {session.status === 'in_progress' && (
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
                <dt>Status</dt><dd><span className={`badge ${statusBadgeClass(session.status)}`}>{statusLabel(session.status)}</span></dd>
              </dl>
            </div>
          </div>

          <div className="section">
            <h3>Video Capture</h3>
            <p className="text-muted">Record front and side view videos of the athlete performing movements.</p>
            <div className="video-grid">
              <VideoCapture
                label="Front View"
                sessionId={id!}
                viewType="front"
                existingVideoUrl={
                  sessionVideos.find((v) => v.viewType === 'front')
                    ? `${API_BASE}/videos/${sessionVideos.find((v) => v.viewType === 'front')!.id}/stream`
                    : undefined
                }
                onUploaded={loadVideos}
              />
              <VideoCapture
                label="Side View"
                sessionId={id!}
                viewType="side"
                existingVideoUrl={
                  sessionVideos.find((v) => v.viewType === 'side')
                    ? `${API_BASE}/videos/${sessionVideos.find((v) => v.viewType === 'side')!.id}/stream`
                    : undefined
                }
                onUploaded={loadVideos}
              />
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

          {session.status !== 'in_progress' && (
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
                  <dt>Status</dt><dd><span className={`badge ${statusBadgeClass(session.status)}`}>{statusLabel(session.status)}</span></dd>
                  <dt>Total Scores</dt><dd>{scores.length}</dd>
                  <dt>Prescriptions</dt><dd>{prescriptions.length}</dd>
                </dl>
              </div>
            </div>
          )}

          {isPostCompletion && (
            <div className="export-buttons">
              <button className="btn-secondary" onClick={() => handleExport('pdf')}>📄 Download PDF Report</button>
              <button className="btn-secondary" onClick={() => handleExport('json')}>📋 Export JSON</button>
            </div>
          )}

          {session.status === 'completed' && (
            <div className="complete-section">
              <p>The screening is complete. You can request a consultation with a clinician to discuss the results, or archive it if no further follow-up is needed.</p>
              <div className="wizard-nav" style={{ gap: '0.5rem' }}>
                <button className="btn-primary" onClick={handleRequestConsultation} style={{ width: 'auto' }}>
                  💬 Request Consultation
                </button>
                <button className="btn-secondary" onClick={handleArchive} style={{ width: 'auto' }}>
                  🗄 Archive
                </button>
              </div>
            </div>
          )}

          {session.status === 'consultation_requested' && (
            <div className="review-banner info-card" style={{ borderColor: '#1d4ed8' }}>
              <h3>💬 Consultation requested</h3>
              <p className="text-muted">
                A consultation has been requested for this screening. A clinician will follow up.
                {canManage
                  ? ' Once resolved, archive it below.'
                  : ' A clinician or admin will archive it once resolved.'}
              </p>
              {canManage && (
                <button className="btn-secondary" onClick={handleArchive} style={{ width: 'auto' }}>
                  🗄 Archive
                </button>
              )}
            </div>
          )}

          {session.status === 'archived' && (
            <div className="review-banner info-card" style={{ borderColor: '#94a3b8' }}>
              <h3>🗄 Archived</h3>
              <p className="text-muted">This screening has been archived. No further follow-up is requested.</p>
            </div>
          )}

          {session.status !== 'in_progress' && sessionVideos.length > 0 && (
            <div className="section">
              <h3>Recorded Videos</h3>
              <div className="video-grid">
                {sessionVideos.map((v) => (
                  <VideoCapture
                    key={v.id}
                    label={v.viewType === 'front' ? 'Front View' : 'Side View'}
                    sessionId={id!}
                    viewType={v.viewType as 'front' | 'side'}
                    existingVideoUrl={`${API_BASE}/videos/${v.id}/stream`}
                    disabled
                  />
                ))}
              </div>
            </div>
          )}

          {session.status === 'in_progress' && (
            <div className="complete-section">
              <p>You have recorded <strong>{scores.length}</strong> score(s). Click below to calculate the risk score. The screening will then be flagged for review, where a clinician selects the exercises to prescribe.</p>
              <button className="btn-primary" onClick={handleComplete} style={{ width: 'auto' }}>
                ✓ Score Screening & Calculate Risk
              </button>
              <div className="wizard-nav" style={{ marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={() => goToStep(3)}>← Back to Hop Testing</button>
              </div>
            </div>
          )}

          {session.status === 'needs_review' && (
            <div className="review-banner info-card" style={{ borderColor: '#f59e0b' }}>
              <h3>🔎 This screening needs review</h3>
              <p className="text-muted">
                The screening has been scored. {canManage
                  ? 'Review the results and select the exercises to prescribe below, then finalize the review.'
                  : 'A clinician will review the results and select the exercises to prescribe.'}
              </p>
              {canManage && (
                <button className="btn-primary" onClick={handleFinalize} style={{ width: 'auto' }}>
                  ✓ Finalize Review
                </button>
              )}
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
          <div className="section">
            <div className="page-header">
              <div>
                <h3>Exercise Prescriptions</h3>
                {canManage && !isPostCompletion && (
                  <p className="text-muted">Select the exercises to prescribe based on this screening's results.</p>
                )}
              </div>
              {canManage && !addingRx && (
                <button className="btn-primary" onClick={() => setAddingRx(true)} style={{ width: 'auto' }}>+ Add Prescription</button>
              )}
            </div>

            {canManage && addingRx && (
              <div className="edit-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Exercise</label>
                    <select value={rxForm.exerciseId} onChange={(e) => setRxForm({ ...rxForm, exerciseId: e.target.value })}>
                      <option value="">Select…</option>
                      {catalog.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sets</label>
                    <input type="number" value={rxForm.sets} onChange={(e) => setRxForm({ ...rxForm, sets: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Reps</label>
                    <input type="number" value={rxForm.reps} onChange={(e) => setRxForm({ ...rxForm, reps: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input value={rxForm.duration} onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })} placeholder="e.g., 30 seconds" />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input value={rxForm.notes} onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn-primary" onClick={handleAddRx}>Add</button>
                  <button className="btn-secondary" onClick={() => { setAddingRx(false); setRxForm({ exerciseId: '', sets: '', reps: '', duration: '', notes: '' }); }}>Cancel</button>
                </div>
              </div>
            )}

            {prescriptions.length === 0 ? (
              <p className="empty-state">No prescriptions.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Duration</th><th>Notes</th>{canManage && <th>Actions</th>}</tr></thead>
                <tbody>
                  {prescriptions.map((p) => (
                    <tr key={p.id}>
                      {editingRxId === p.id ? (
                        <>
                          <td>
                            <select value={editRxForm.exerciseId} onChange={(e) => setEditRxForm({ ...editRxForm, exerciseId: e.target.value })}>
                              {catalog.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                            </select>
                          </td>
                          <td><input type="number" value={editRxForm.sets} onChange={(e) => setEditRxForm({ ...editRxForm, sets: e.target.value })} /></td>
                          <td><input type="number" value={editRxForm.reps} onChange={(e) => setEditRxForm({ ...editRxForm, reps: e.target.value })} /></td>
                          <td><input value={editRxForm.duration} onChange={(e) => setEditRxForm({ ...editRxForm, duration: e.target.value })} /></td>
                          <td><input value={editRxForm.notes} onChange={(e) => setEditRxForm({ ...editRxForm, notes: e.target.value })} /></td>
                          <td>
                            <button className="btn-primary" onClick={() => handleUpdateRx(p.id)} style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Save</button>
                            <button className="btn-secondary" onClick={() => setEditingRxId(null)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td><strong>{p.exercise?.name ?? '—'}</strong></td>
                          <td>{p.sets ?? '—'}</td>
                          <td>{p.reps ?? '—'}</td>
                          <td>{p.duration || '—'}</td>
                          <td>{p.notes || '—'}</td>
                          {canManage && (
                            <td>
                              <button className="btn-secondary" onClick={() => { setEditingRxId(p.id); setEditRxForm({ exerciseId: p.exerciseId, sets: p.sets != null ? String(p.sets) : '', reps: p.reps != null ? String(p.reps) : '', duration: p.duration || '', notes: p.notes || '' }); }} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Edit</button>
                              <button className="btn-danger" onClick={() => handleDeleteRx(p.id)}>Delete</button>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="section delete-section">
        <button className="btn-danger" onClick={handleDelete}>Delete Session</button>
      </div>
    </div>
  );
}
