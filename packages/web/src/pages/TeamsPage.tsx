import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Team } from '../types';

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [clubId, setClubId] = useState('');
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.get<Team[]>('/teams').then(setTeams);
    api.get<{ id: string; name: string }[]>('/clubs').then(setClubs);
  }, []);

  const handleCreate = async () => {
    if (!name || !clubId) return;
    const team = await api.post<Team>('/teams', { name, clubId });
    setTeams([...teams, team]);
    setName('');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    await api.delete(`/teams/${id}`);
    setTeams(teams.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Teams</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Team</button>
      </div>

      {showForm && (
        <div className="inline-form">
          <input placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={clubId} onChange={(e) => setClubId(e.target.value)}>
            <option value="">Select club...</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary" onClick={handleCreate}>Save</button>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Name</th><th>Club</th><th>Actions</th></tr></thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id}>
              <td><Link to={`/teams/${team.id}`}>{team.name}</Link></td>
              <td>{team.club?.name || '—'}</td>
              <td><button className="btn-danger" onClick={() => handleDelete(team.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
