import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { MuscleGroup } from '../types';

export function MuscleGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', region: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', region: '' });

  useEffect(() => {
    api.get<MuscleGroup[]>('/muscle-groups').then(setGroups);
  }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    const group = await api.post<MuscleGroup>('/muscle-groups', form);
    setGroups([...groups, group].sort((a, b) => a.name.localeCompare(b.name)));
    setForm({ name: '', region: '' });
    setShowForm(false);
  };

  const handleUpdate = async (id: string) => {
    const updated = await api.put<MuscleGroup>(`/muscle-groups/${id}`, editForm);
    setGroups(groups.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this muscle group?')) return;
    await api.delete(`/muscle-groups/${id}`);
    setGroups(groups.filter((g) => g.id !== id));
  };

  const canManage = user?.role === 'admin' || user?.role === 'clinician';

  return (
    <div>
      <div className="page-header">
        <h1>Muscle Groups</h1>
        {canManage && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Muscle Group</button>}
      </div>

      {showForm && (
        <div className="edit-form">
          <h3>New Muscle Group</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Gastrocnemius" />
            </div>
            <div className="form-group">
              <label>Region</label>
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g., lower_leg" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleCreate}>Create</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Name</th><th>Region</th>{canManage && <th>Actions</th>}</tr></thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.id}>
              {editingId === g.id ? (
                <>
                  <td><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td><input value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} /></td>
                  <td>
                    <button className="btn-primary" onClick={() => handleUpdate(g.id)} style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{g.name}</td>
                  <td>{g.region || '—'}</td>
                  {canManage && (
                    <td>
                      <button className="btn-secondary" onClick={() => { setEditingId(g.id); setEditForm({ name: g.name, region: g.region || '' }); }} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(g.id)}>Delete</button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
