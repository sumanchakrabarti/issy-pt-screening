import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Athlete } from '../types';

interface Props {
  athletes: Athlete[];
  showTeamColumn?: boolean;
  onDelete?: (id: string) => void;
}

export function AthleteSearchList({ athletes, showTeamColumn = false, onDelete }: Props) {
  const [search, setSearch] = useState('');

  const filtered = athletes.filter((a) => {
    const q = search.toLowerCase();
    return !q || `${a.firstName} ${a.lastName}`.toLowerCase().includes(q);
  });

  const age = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search athletes by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">{athletes.length === 0 ? 'No athletes yet.' : 'No athletes match your search.'}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              {showTeamColumn && <th>Team</th>}
              {onDelete && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td><Link to={`/athletes/${a.id}`}>{a.lastName}, {a.firstName}</Link></td>
                <td>{age(a.dateOfBirth)}</td>
                <td>{a.gender}</td>
                {showTeamColumn && <td>{a.team?.name || '—'}</td>}
                {onDelete && (
                  <td><button className="btn-danger" onClick={() => onDelete(a.id)}>Delete</button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
