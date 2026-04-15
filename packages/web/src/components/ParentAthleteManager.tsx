import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Athlete } from '../types';

interface Props {
  userId: string;
}

export function ParentAthleteManager({ userId }: Props) {
  const [assignedAthletes, setAssignedAthletes] = useState<Athlete[]>([]);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');

  useEffect(() => {
    api.get<Athlete[]>(`/relations/parents/${userId}/athletes`).then(setAssignedAthletes);
    api.get<Athlete[]>('/athletes').then(setAllAthletes);
  }, [userId]);

  const handleAssign = async () => {
    if (!selectedAthleteId) return;
    await api.post(`/relations/parents/${userId}/athletes/${selectedAthleteId}`, {});
    const refreshed = await api.get<Athlete[]>(`/relations/parents/${userId}/athletes`);
    setAssignedAthletes(refreshed);
    setSelectedAthleteId('');
  };

  const handleRemove = async (athleteId: string) => {
    await api.delete(`/relations/parents/${userId}/athletes/${athleteId}`);
    setAssignedAthletes(assignedAthletes.filter((a) => a.id !== athleteId));
  };

  const available = allAthletes.filter((a) => !assignedAthletes.some((x) => x.id === a.id));

  return (
    <div className="relation-manager">
      <h4>Assigned Athletes</h4>
      {assignedAthletes.length === 0 ? (
        <p className="text-muted">No athletes assigned.</p>
      ) : (
        <div className="relation-chips">
          {assignedAthletes.map((a) => (
            <span key={a.id} className="relation-chip">
              {a.firstName} {a.lastName} {a.team ? `(${a.team.name})` : ''}
              <button className="chip-remove" onClick={() => handleRemove(a.id)}>✕</button>
            </span>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <div className="relation-add">
          <select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)}>
            <option value="">Add athlete...</option>
            {available.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
          </select>
          <button className="btn-primary" onClick={handleAssign} disabled={!selectedAthleteId} style={{ width: 'auto' }}>Add</button>
        </div>
      )}
    </div>
  );
}
