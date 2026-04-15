import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Club, Team } from '../types';

export function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [coaches, setCoaches] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [allCoaches, setAllCoaches] = useState<{ id: string; firstName: string; lastName: string; email: string; role: string }[]>([]);
  const [selectedCoach, setSelectedCoach] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get<Club>(`/clubs/${id}`).then((c) => { setClub(c); setName(c.name); setTeams(c.teams || []); });
    if (currentUser?.role === 'admin') {
      api.get<any[]>(`/relations/clubs/${id}/coaches`).then(setCoaches);
      api.get<any[]>('/users').then((users) => setAllCoaches(users.filter((u: any) => u.role === 'coach')));
    }
  }, [id]);

  const handleUpdate = async () => {
    if (!id || !name) return;
    const updated = await api.put<Club>(`/clubs/${id}`, { name, clinicId: club!.clinicId });
    setClub({ ...club!, ...updated });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this club and all its teams?')) return;
    await api.delete(`/clubs/${id}`);
    navigate('/clubs');
  };

  const handleAddTeam = async () => {
    if (!newTeamName || !id) return;
    const team = await api.post<Team>('/teams', { name: newTeamName, clubId: id });
    setTeams([...teams, team]);
    setNewTeamName('');
    setShowTeamForm(false);
  };

  if (!club) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/clubs">Clubs</Link> / {club.name}
      </div>

      <div className="detail-header">
        {editing ? (
          <div className="inline-form">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-primary" onClick={handleUpdate}>Save</button>
            <button className="btn-secondary" onClick={() => { setEditing(false); setName(club.name); }}>Cancel</button>
          </div>
        ) : (
          <>
            <h1>{club.name}</h1>
            <div className="detail-actions">
              <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </>
        )}
      </div>

      <div className="detail-info">
        <p><strong>Clinic:</strong> {club.clinic?.name || '—'}</p>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="section">
          <h2>Coaches ({coaches.length})</h2>
          {coaches.length > 0 && (
            <div className="relation-chips">
              {coaches.map((c) => (
                <span key={c.id} className="relation-chip">
                  {c.firstName} {c.lastName}
                  <button className="chip-remove" onClick={async () => {
                    await api.delete(`/relations/coaches/${c.id}/clubs/${id}`);
                    setCoaches(coaches.filter((x) => x.id !== c.id));
                  }}>✕</button>
                </span>
              ))}
            </div>
          )}
          {(() => {
            const available = allCoaches.filter((c) => !coaches.some((x) => x.id === c.id));
            return available.length > 0 ? (
              <div className="relation-add">
                <select value={selectedCoach} onChange={(e) => setSelectedCoach(e.target.value)}>
                  <option value="">Add coach...</option>
                  {available.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
                <button className="btn-primary" disabled={!selectedCoach} style={{ width: 'auto' }} onClick={async () => {
                  if (!selectedCoach) return;
                  await api.post(`/relations/coaches/${selectedCoach}/clubs/${id}`, {});
                  const refreshed = await api.get<any[]>(`/relations/clubs/${id}/coaches`);
                  setCoaches(refreshed);
                  setSelectedCoach('');
                }}>Add</button>
              </div>
            ) : null;
          })()}
        </div>
      )}

      <div className="section">
        <div className="page-header">
          <h2>Teams ({teams.length})</h2>
          <button className="btn-primary" onClick={() => setShowTeamForm(!showTeamForm)}>+ Add Team</button>
        </div>

        {showTeamForm && (
          <div className="inline-form">
            <input placeholder="Team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
            <button className="btn-primary" onClick={handleAddTeam}>Save</button>
            <button className="btn-secondary" onClick={() => setShowTeamForm(false)}>Cancel</button>
          </div>
        )}

        {teams.length === 0 ? (
          <p className="empty-state">No teams yet. Add one to get started.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Athletes</th></tr></thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td><Link to={`/teams/${team.id}`}>{team.name}</Link></td>
                  <td>{team.athletes?.length ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
