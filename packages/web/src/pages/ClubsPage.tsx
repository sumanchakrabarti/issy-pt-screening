import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Club } from '../types';

export function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.get<Club[]>('/clubs').then(setClubs);
    api.get<{ id: string; name: string }[]>('/clinics').then(setClinics);
  }, []);

  const handleCreate = async () => {
    if (!name || !clinicId) return;
    const club = await api.post<Club>('/clubs', { name, clinicId });
    setClubs([...clubs, club]);
    setName('');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this club?')) return;
    await api.delete(`/clubs/${id}`);
    setClubs(clubs.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Clubs</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Club</button>
      </div>

      {showForm && (
        <div className="inline-form">
          <input placeholder="Club name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
            <option value="">Select clinic...</option>
            {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary" onClick={handleCreate}>Save</button>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Name</th><th>Clinic</th><th>Actions</th></tr></thead>
        <tbody>
          {clubs.map((club) => (
            <tr key={club.id}>
              <td><Link to={`/clubs/${club.id}`}>{club.name}</Link></td>
              <td>{club.clinic?.name || '—'}</td>
              <td><button className="btn-danger" onClick={() => handleDelete(club.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
