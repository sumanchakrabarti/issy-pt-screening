import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AthleteSearchList } from '../components/AthleteSearchList';
import type { Athlete, Team } from '../types';

export function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [teamFilter, setTeamFilter] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: '', teamId: '', medicalHistory: '' });

  useEffect(() => {
    api.get<Athlete[]>('/athletes').then(setAthletes);
    api.get<Team[]>('/teams').then(setTeams);
  }, []);

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.gender || !form.teamId) return;
    const athlete = await api.post<Athlete>('/athletes', form);
    setAthletes([...athletes, athlete]);
    setForm({ firstName: '', lastName: '', dateOfBirth: '', gender: '', teamId: '', medicalHistory: '' });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this athlete?')) return;
    await api.delete(`/athletes/${id}`);
    setAthletes(athletes.filter((a) => a.id !== id));
  };

  const filtered = teamFilter ? athletes.filter((a) => a.teamId === teamFilter) : athletes;

  return (
    <div>
      <div className="page-header">
        <h1>Athletes</h1>
        <div className="page-header-actions">
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="search-filter">
            <option value="">All teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Athlete</button>
        </div>
      </div>

      {showForm && (
        <div className="inline-form">
          <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Gender...</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
          <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
            <option value="">Select team...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <textarea placeholder="Medical history (optional)" value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} />
          <button className="btn-primary" onClick={handleCreate}>Save</button>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      <AthleteSearchList athletes={filtered} showTeamColumn onDelete={handleDelete} />
    </div>
  );
}
