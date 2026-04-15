import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Athlete, ScreeningSession, Team } from '../types';

export function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [editing, setEditing] = useState(false);
  const [parents, setParents] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [allParents, setAllParents] = useState<{ id: string; firstName: string; lastName: string; email: string; role: string }[]>([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: '', medicalHistory: '', teamId: '' });

  useEffect(() => {
    if (!id) return;
    api.get<Athlete>(`/athletes/${id}`).then((a) => {
      setAthlete(a);
      setForm({
        firstName: a.firstName,
        lastName: a.lastName,
        dateOfBirth: a.dateOfBirth.split('T')[0],
        gender: a.gender,
        medicalHistory: a.medicalHistory || '',
        teamId: a.teamId,
      });
    });
    api.get<Team[]>('/teams').then(setTeams);
    if (user?.role === 'admin') {
      api.get<any[]>(`/relations/athletes/${id}/parents`).then(setParents);
      api.get<any[]>('/users').then((users) => setAllParents(users.filter((u: any) => u.role === 'parent')));
    }
  }, [id]);

  const handleUpdate = async () => {
    if (!id || !form.firstName || !form.lastName) return;
    const updated = await api.put<Athlete>(`/athletes/${id}`, form);
    setAthlete({ ...athlete!, ...updated });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this athlete and all screening data?')) return;
    await api.delete(`/athletes/${id}`);
    navigate('/athletes');
  };

  const handleNewSession = async () => {
    if (!athlete) return;
    const session = await api.post<ScreeningSession>('/sessions', {
      athleteId: athlete.id,
      teamId: athlete.teamId,
    });
    navigate(`/sessions/${session.id}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this screening session?')) return;
    await api.delete(`/sessions/${sessionId}`);
    setAthlete((prev) => prev ? { ...prev, screeningSessions: prev.screeningSessions?.filter((s) => s.id !== sessionId) } : prev);
  };

  const age= (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const riskBadge = (cat?: string, score?: number) => {
    const colors: Record<string, string> = { low: '#22c55e', moderate: '#eab308', high: '#f97316', very_high: '#ef4444' };
    if (!cat) return <span className="badge badge-gray">Pending</span>;
    return (
      <span className="badge" style={{ backgroundColor: colors[cat] || '#94a3b8', color: '#fff' }}>
        {cat.replace('_', ' ').toUpperCase()} {score != null ? `(${score})` : ''}
      </span>
    );
  };

  if (!athlete) return <div className="loading">Loading...</div>;

  const sessions = athlete.screeningSessions || [];

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/athletes">Athletes</Link>
        {athlete.team && <> / <Link to={`/teams/${athlete.team.id}`}>{athlete.team.name}</Link></>}
        {' '} / {athlete.firstName} {athlete.lastName}
      </div>

      <div className="detail-header">
        <h1>{athlete.firstName} {athlete.lastName}</h1>
        <div className="detail-actions">
          <button className="btn-primary" onClick={handleNewSession}>+ New Screening</button>
          <button className="btn-secondary" onClick={() => setEditing(!editing)}>Edit</button>
        </div>
      </div>

      {editing ? (
        <div className="edit-form">
          <h3>Edit Athlete</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div className="form-group">
              <label>Team</label>
              <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Medical History</label>
              <textarea value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} rows={3} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleUpdate}>Save Changes</button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="detail-cards">
          <div className="info-card">
            <h3>Demographics</h3>
            <dl>
              <dt>Age</dt><dd>{age(athlete.dateOfBirth)} years</dd>
              <dt>Date of Birth</dt><dd>{new Date(athlete.dateOfBirth).toLocaleDateString()}</dd>
              <dt>Gender</dt><dd>{athlete.gender}</dd>
              <dt>Team</dt><dd><Link to={`/teams/${athlete.teamId}`}>{athlete.team?.name || '—'}</Link></dd>
            </dl>
          </div>
          <div className="info-card">
            <h3>Medical History</h3>
            <p>{athlete.medicalHistory || 'No medical history recorded.'}</p>
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="section">
          <h2>Parents / Guardians ({parents.length})</h2>
          {parents.length > 0 && (
            <div className="relation-chips">
              {parents.map((p) => (
                <span key={p.id} className="relation-chip">
                  {p.firstName} {p.lastName} ({p.email})
                  <button className="chip-remove" onClick={async () => {
                    await api.delete(`/relations/parents/${p.id}/athletes/${id}`);
                    setParents(parents.filter((x) => x.id !== p.id));
                  }}>✕</button>
                </span>
              ))}
            </div>
          )}
          {(() => {
            const available = allParents.filter((p) => !parents.some((x) => x.id === p.id));
            return available.length > 0 ? (
              <div className="relation-add">
                <select value={selectedParent} onChange={(e) => setSelectedParent(e.target.value)}>
                  <option value="">Add parent...</option>
                  {available.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
                <button className="btn-primary" disabled={!selectedParent} style={{ width: 'auto' }} onClick={async () => {
                  if (!selectedParent) return;
                  await api.post(`/relations/parents/${selectedParent}/athletes/${id}`, {});
                  const refreshed = await api.get<any[]>(`/relations/athletes/${id}/parents`);
                  setParents(refreshed);
                  setSelectedParent('');
                }}>Add</button>
              </div>
            ) : null;
          })()}
        </div>
      )}

      <div className="section">
        <h2>Screening History ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p className="empty-state">No screenings yet. <button className="btn-link" onClick={handleNewSession}>Start one</button></p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Date</th><th>Status</th><th>Risk</th><th>Actions</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/sessions/${s.id}`}>{new Date(s.date).toLocaleDateString()}</Link></td>
                  <td><span className={`badge ${s.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
                  <td>{riskBadge(s.riskCategory, s.riskScore)}</td>
                  <td><button className="btn-danger" onClick={() => handleDeleteSession(s.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="section delete-section">
          <button className="btn-danger" onClick={handleDelete}>Delete Athlete</button>
        </div>
      )}
    </div>
  );
}
