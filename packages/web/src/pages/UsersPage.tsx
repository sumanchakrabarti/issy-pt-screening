import { useEffect, useState, Fragment } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CoachClubManager } from '../components/CoachClubManager';
import { ParentAthleteManager } from '../components/ParentAthleteManager';
import type { Clinic } from '../types';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicId?: string;
  clinic?: { name: string };
  createdAt: string;
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'clinician', clinicId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '', clinicId: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserRow[]>('/users').then(setUsers);
    api.get<Clinic[]>('/clinics').then(setClinics);
  }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return;
    await api.post<UserRow>('/users', {
      ...form,
      clinicId: form.clinicId || undefined,
    });
    const refreshed = await api.get<UserRow[]>('/users');
    setUsers(refreshed);
    setForm({ email: '', password: '', firstName: '', lastName: '', role: 'clinician', clinicId: '' });
    setShowForm(false);
  };

  const startEdit = (u: UserRow) => {
    setEditingId(u.id);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, role: u.role, clinicId: u.clinicId || '' });
  };

  const handleUpdate = async (id: string) => {
    await api.put<UserRow>(`/users/${id}`, {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      role: editForm.role,
      clinicId: editForm.clinicId || null,
    });
    // Reload full list to get clinic relation
    const refreshed = await api.get<UserRow[]>('/users');
    setUsers(refreshed);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    setUsers(users.filter((u) => u.id !== id));
  };

  if (currentUser?.role !== 'admin') {
    return <div className="empty-state">Access denied. Admin only.</div>;
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = { admin: '#7c3aed', clinician: '#2563eb', coach: '#059669', parent: '#64748b' };
    return <span className="badge" style={{ backgroundColor: colors[role] || '#94a3b8', color: '#fff' }}>{role}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add User</button>
      </div>

      {showForm && (
        <div className="edit-form">
          <h3>Create New User</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="clinician">Clinician</option>
                <option value="admin">Admin</option>
                <option value="coach">Coach</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Clinic</label>
              <select value={form.clinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })}>
                <option value="">No clinic</option>
                {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleCreate}>Create User</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Clinic</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <Fragment key={u.id}>
            {editingId === u.id ? (
              <tr>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} style={{ width: '80px', padding: '0.2rem' }} />
                    <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} style={{ width: '80px', padding: '0.2rem' }} />
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} style={{ padding: '0.2rem' }}>
                    <option value="admin">Admin</option>
                    <option value="clinician">Clinician</option>
                    <option value="coach">Coach</option>
                    <option value="parent">Parent</option>
                  </select>
                </td>
                <td>
                  <select value={editForm.clinicId} onChange={(e) => setEditForm({ ...editForm, clinicId: e.target.value })} style={{ padding: '0.2rem' }}>
                    <option value="">None</option>
                    {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn-primary" onClick={() => handleUpdate(u.id)} style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginRight: '0.25rem' }}>Save</button>
                  <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{roleBadge(u.role)}</td>
                <td>{u.clinic?.name || '—'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn-secondary" onClick={() => startEdit(u)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Edit</button>
                  {(u.role === 'coach' || u.role === 'parent') && (
                    <button className="btn-secondary" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>
                      {expandedId === u.id ? '▲ Access' : '▼ Access'}
                    </button>
                  )}
                  {u.id !== currentUser?.id && (
                    <button className="btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                  )}
                </td>
              </tr>
            )}
            {expandedId === u.id && (u.role === 'coach' || u.role === 'parent') && (
              <tr>
                <td colSpan={6}>
                  <div className="access-panel">
                    {u.role === 'coach' && <CoachClubManager userId={u.id} />}
                    {u.role === 'parent' && <ParentAthleteManager userId={u.id} />}
                  </div>
                </td>
              </tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
