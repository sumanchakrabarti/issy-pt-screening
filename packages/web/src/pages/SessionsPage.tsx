import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ScreeningSession, Athlete, Team } from '../types';

export function SessionsPage() {
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ athleteId: '', teamId: '', notes: '' });

  useEffect(() => {
    api.get<ScreeningSession[]>('/sessions').then(setSessions);
    api.get<Athlete[]>('/athletes').then(setAthletes);
    api.get<Team[]>('/teams').then(setTeams);
  }, []);

  const handleCreate = async () => {
    if (!form.athleteId || !form.teamId) return;
    const session = await api.post<ScreeningSession>('/sessions', form);
    setSessions([session, ...sessions]);
    setForm({ athleteId: '', teamId: '', notes: '' });
    setShowForm(false);
  };

  const riskBadge= (cat?: string, score?: number) => {
    const colors: Record<string, string> = { low: '#22c55e', moderate: '#eab308', high: '#f97316', very_high: '#ef4444' };
    if (!cat) return <span className="badge badge-gray">Pending</span>;
    return (
      <span className="badge" style={{ backgroundColor: colors[cat] || '#94a3b8', color: '#fff' }}>
        {cat.replace('_', ' ').toUpperCase()} {score !== undefined && score !== null ? `(${score})` : ''}
      </span>
    );
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/reports/sessions/export/csv', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'screening-sessions.csv';
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Screening Sessions</h1>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={handleExportCSV}>📥 Export CSV</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ New Session</button>
        </div>
      </div>

      {showForm && (
        <div className="inline-form">
          <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
            <option value="">Select team...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={form.athleteId} onChange={(e) => setForm({ ...form, athleteId: e.target.value })}>
            <option value="">Select athlete...</option>
            {athletes.filter((a) => !form.teamId || a.teamId === form.teamId).map((a) => (
              <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
            ))}
          </select>
          <textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn-primary" onClick={handleCreate}>Start Session</button>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Athlete</th><th>Team</th><th>Date</th><th>Status</th><th>Risk</th></tr></thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>
                <Link to={`/sessions/${s.id}`}>
                  {s.athlete ? `${s.athlete.firstName} ${s.athlete.lastName}` : s.athleteId}
                </Link>
              </td>
              <td>{s.team?.name || '—'}</td>
              <td>{new Date(s.date).toLocaleDateString()}</td>
              <td>{s.status}</td>
              <td>{riskBadge(s.riskCategory, s.riskScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
