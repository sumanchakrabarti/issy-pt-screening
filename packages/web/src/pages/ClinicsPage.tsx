import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Clinic } from '../types';

export function ClinicsPage() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    api.get<Clinic[]>('/clinics').then(setClinics);
  }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    const clinic = await api.post<Clinic>('/clinics', form);
    setClinics([...clinics, clinic]);
    setForm({ name: '', address: '', phone: '' });
    setShowForm(false);
  };

  const handleUpdate = async (id: string) => {
    const updated = await api.put<Clinic>(`/clinics/${id}`, editForm);
    setClinics(clinics.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this clinic?')) return;
    await api.delete(`/clinics/${id}`);
    setClinics(clinics.filter((c) => c.id !== id));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div className="page-header">
        <h1>Clinics</h1>
        {isAdmin && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Clinic</button>}
      </div>

      {showForm && (
        <div className="edit-form">
          <h3>New Clinic</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleCreate}>Create</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Name</th><th>Address</th><th>Phone</th>{isAdmin && <th>Actions</th>}</tr></thead>
        <tbody>
          {clinics.map((c) => (
            <tr key={c.id}>
              {editingId === c.id ? (
                <>
                  <td><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td><input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></td>
                  <td><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></td>
                  <td>
                    <button className="btn-primary" onClick={() => handleUpdate(c.id)} style={{ width: 'auto', fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{c.name}</td>
                  <td>{c.address || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn-secondary" onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, address: c.address || '', phone: c.phone || '' }); }} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
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
