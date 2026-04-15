import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AthleteSearchList } from '../components/AthleteSearchList';
import type { Team, Athlete } from '../types';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [showAthleteForm, setShowAthleteForm] = useState(false);
  const [athleteForm, setAthleteForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: '', medicalHistory: '' });

  useEffect(() => {
    if (!id) return;
    api.get<Team>(`/teams/${id}`).then((t) => { setTeam(t); setName(t.name); setAthletes(t.athletes || []); });
  }, [id]);

  const handleUpdate = async () => {
    if (!id || !name) return;
    const updated = await api.put<Team>(`/teams/${id}`, { name, clubId: team!.clubId });
    setTeam({ ...team!, ...updated });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this team and all its athletes?')) return;
    await api.delete(`/teams/${id}`);
    navigate('/teams');
  };

  const handleAddAthlete = async () => {
    const { firstName, lastName, dateOfBirth, gender } = athleteForm;
    if (!firstName || !lastName || !dateOfBirth || !gender || !id) return;
    const athlete = await api.post<Athlete>('/athletes', { ...athleteForm, teamId: id });
    setAthletes([...athletes, athlete]);
    setAthleteForm({ firstName: '', lastName: '', dateOfBirth: '', gender: '', medicalHistory: '' });
    setShowAthleteForm(false);
  };

  if (!team) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/clubs">Clubs</Link> / <Link to={`/clubs/${team.club?.id}`}>{team.club?.name}</Link> / {team.name}
      </div>

      <div className="detail-header">
        {editing ? (
          <div className="inline-form">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-primary" onClick={handleUpdate}>Save</button>
            <button className="btn-secondary" onClick={() => { setEditing(false); setName(team.name); }}>Cancel</button>
          </div>
        ) : (
          <>
            <h1>{team.name}</h1>
            <div className="detail-actions">
              <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </>
        )}
      </div>

      <div className="detail-info">
        <p><strong>Club:</strong> <Link to={`/clubs/${team.club?.id}`}>{team.club?.name}</Link></p>
      </div>

      <div className="section">
        <div className="page-header">
          <h2>Athletes ({athletes.length})</h2>
          <button className="btn-primary" onClick={() => setShowAthleteForm(!showAthleteForm)}>+ Add Athlete</button>
        </div>

        {showAthleteForm && (
          <div className="inline-form">
            <input placeholder="First name" value={athleteForm.firstName} onChange={(e) => setAthleteForm({ ...athleteForm, firstName: e.target.value })} />
            <input placeholder="Last name" value={athleteForm.lastName} onChange={(e) => setAthleteForm({ ...athleteForm, lastName: e.target.value })} />
            <input type="date" value={athleteForm.dateOfBirth} onChange={(e) => setAthleteForm({ ...athleteForm, dateOfBirth: e.target.value })} />
            <select value={athleteForm.gender} onChange={(e) => setAthleteForm({ ...athleteForm, gender: e.target.value })}>
              <option value="">Gender...</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
            <textarea placeholder="Medical history (optional)" value={athleteForm.medicalHistory} onChange={(e) => setAthleteForm({ ...athleteForm, medicalHistory: e.target.value })} />
            <button className="btn-primary" onClick={handleAddAthlete}>Save</button>
            <button className="btn-secondary" onClick={() => setShowAthleteForm(false)}>Cancel</button>
          </div>
        )}

        {athletes.length === 0 ? (
          <p className="empty-state">No athletes on this team yet.</p>
        ) : (
          <AthleteSearchList athletes={athletes} />
        )}
      </div>
    </div>
  );
}
