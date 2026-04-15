import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Club } from '../types';

interface Props {
  userId: string;
}

export function CoachClubManager({ userId }: Props) {
  const [assignedClubs, setAssignedClubs] = useState<Club[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState('');

  useEffect(() => {
    api.get<Club[]>(`/relations/coaches/${userId}/clubs`).then(setAssignedClubs);
    api.get<Club[]>('/clubs').then(setAllClubs);
  }, [userId]);

  const handleAssign = async () => {
    if (!selectedClubId) return;
    await api.post(`/relations/coaches/${userId}/clubs/${selectedClubId}`, {});
    const refreshed = await api.get<Club[]>(`/relations/coaches/${userId}/clubs`);
    setAssignedClubs(refreshed);
    setSelectedClubId('');
  };

  const handleRemove = async (clubId: string) => {
    await api.delete(`/relations/coaches/${userId}/clubs/${clubId}`);
    setAssignedClubs(assignedClubs.filter((c) => c.id !== clubId));
  };

  const available = allClubs.filter((c) => !assignedClubs.some((a) => a.id === c.id));

  return (
    <div className="relation-manager">
      <h4>Assigned Clubs</h4>
      {assignedClubs.length === 0 ? (
        <p className="text-muted">No clubs assigned.</p>
      ) : (
        <div className="relation-chips">
          {assignedClubs.map((c) => (
            <span key={c.id} className="relation-chip">
              {c.name}
              <button className="chip-remove" onClick={() => handleRemove(c.id)}>✕</button>
            </span>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <div className="relation-add">
          <select value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)}>
            <option value="">Add club...</option>
            {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary" onClick={handleAssign} disabled={!selectedClubId} style={{ width: 'auto' }}>Add</button>
        </div>
      )}
    </div>
  );
}
