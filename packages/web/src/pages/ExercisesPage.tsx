import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Exercise, MuscleGroup, LigamentGroup, ExerciseVideo } from '../types';

const CATEGORIES = ['strengthening', 'balance', 'plyometric', 'mobility', 'stretching', 'proprioception'];
const BODY_REGIONS = ['lower_leg', 'ankle', 'foot', 'knee', 'hip', 'thigh'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

type VideoDraft = { url: string; title: string; source: string };

interface FormState {
  name: string;
  description: string;
  instructions: string;
  category: string;
  bodyRegion: string;
  difficulty: string;
  defaultSets: string;
  defaultReps: string;
  defaultDuration: string;
  equipment: string;
  muscleGroupIds: string[];
  ligamentGroupIds: string[];
  videos: VideoDraft[];
}

const emptyForm: FormState = {
  name: '', description: '', instructions: '', category: 'strengthening',
  bodyRegion: 'lower_leg', difficulty: 'beginner', defaultSets: '', defaultReps: '',
  defaultDuration: '', equipment: '', muscleGroupIds: [], ligamentGroupIds: [], videos: [],
};

export function ExercisesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'clinician';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [ligamentGroups, setLigamentGroups] = useState<LigamentGroup[]>([]);

  // Filters
  const [q, setQ] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadExercises = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filterCategory) params.set('category', filterCategory);
    if (filterRegion) params.set('bodyRegion', filterRegion);
    if (filterDifficulty) params.set('difficulty', filterDifficulty);
    const query = params.toString();
    api.get<Exercise[]>(`/exercises${query ? `?${query}` : ''}`).then(setExercises);
  };

  useEffect(() => {
    api.get<{ muscleGroups: MuscleGroup[]; ligamentGroups: LigamentGroup[] }>('/exercises/tags').then((tags) => {
      setMuscleGroups(tags.muscleGroups);
      setLigamentGroups(tags.ligamentGroups);
    });
  }, []);

  useEffect(() => {
    loadExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filterCategory, filterRegion, filterDifficulty]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setForm({
      name: ex.name,
      description: ex.description || '',
      instructions: ex.instructions || '',
      category: ex.category,
      bodyRegion: ex.bodyRegion,
      difficulty: ex.difficulty,
      defaultSets: ex.defaultSets != null ? String(ex.defaultSets) : '',
      defaultReps: ex.defaultReps != null ? String(ex.defaultReps) : '',
      defaultDuration: ex.defaultDuration || '',
      equipment: ex.equipment || '',
      muscleGroupIds: (ex.muscleGroups || []).map((m) => m.id),
      ligamentGroupIds: (ex.ligamentGroups || []).map((l) => l.id),
      videos: (ex.videos || []).map((v: ExerciseVideo) => ({ url: v.url, title: v.title || '', source: v.source || '' })),
    });
    setShowForm(true);
  };

  const buildPayload = () => ({
    name: form.name,
    description: form.description || undefined,
    instructions: form.instructions || undefined,
    category: form.category,
    bodyRegion: form.bodyRegion,
    difficulty: form.difficulty,
    defaultSets: form.defaultSets ? Number(form.defaultSets) : undefined,
    defaultReps: form.defaultReps ? Number(form.defaultReps) : undefined,
    defaultDuration: form.defaultDuration || undefined,
    equipment: form.equipment || undefined,
    muscleGroupIds: form.muscleGroupIds,
    ligamentGroupIds: form.ligamentGroupIds,
    videos: form.videos
      .filter((v) => v.url.trim())
      .map((v) => ({ url: v.url, title: v.title || undefined, source: v.source || undefined })),
  });

  const handleSave = async () => {
    if (!form.name) return;
    const payload = buildPayload();
    if (editingId) {
      await api.put<Exercise>(`/exercises/${editingId}`, payload);
    } else {
      await api.post<Exercise>('/exercises', payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    loadExercises();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exercise?')) return;
    try {
      await api.delete(`/exercises/${id}`);
      loadExercises();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const addVideo = () => setForm({ ...form, videos: [...form.videos, { url: '', title: '', source: '' }] });
  const updateVideo = (i: number, patch: Partial<VideoDraft>) =>
    setForm({ ...form, videos: form.videos.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });
  const removeVideo = (i: number) =>
    setForm({ ...form, videos: form.videos.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="page-header">
        <h1>Exercise Library</h1>
        {canManage && <button className="btn-primary" onClick={openCreate}>+ Add Exercise</button>}
      </div>

      {/* Filters */}
      <div className="edit-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or description" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Body Region</label>
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
              <option value="">All</option>
              {BODY_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
              <option value="">All</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && canManage && (
        <div className="edit-form">
          <h3>{editingId ? 'Edit Exercise' : 'New Exercise'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Body Region</label>
              <select value={form.bodyRegion} onChange={(e) => setForm({ ...form, bodyRegion: e.target.value })}>
                {BODY_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Default Sets</label>
              <input type="number" value={form.defaultSets} onChange={(e) => setForm({ ...form, defaultSets: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Default Reps</label>
              <input type="number" value={form.defaultReps} onChange={(e) => setForm({ ...form, defaultReps: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Default Duration</label>
              <input value={form.defaultDuration} onChange={(e) => setForm({ ...form, defaultDuration: e.target.value })} placeholder="e.g., 30 seconds" />
            </div>
            <div className="form-group">
              <label>Equipment</label>
              <input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="e.g., resistance band" />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="form-group">
            <label>Instructions</label>
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} />
          </div>

          {/* Muscle group tags */}
          <div className="form-group">
            <label>Muscle Groups</label>
            <div className="tag-checkboxes">
              {muscleGroups.length === 0 && <span className="text-muted">No muscle groups defined.</span>}
              {muscleGroups.map((m) => (
                <label key={m.id} className="tag-checkbox">
                  <input
                    type="checkbox"
                    checked={form.muscleGroupIds.includes(m.id)}
                    onChange={() => setForm({ ...form, muscleGroupIds: toggleId(form.muscleGroupIds, m.id) })}
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>

          {/* Ligament group tags */}
          <div className="form-group">
            <label>Ligament Groups</label>
            <div className="tag-checkboxes">
              {ligamentGroups.length === 0 && <span className="text-muted">No ligament groups defined.</span>}
              {ligamentGroups.map((l) => (
                <label key={l.id} className="tag-checkbox">
                  <input
                    type="checkbox"
                    checked={form.ligamentGroupIds.includes(l.id)}
                    onChange={() => setForm({ ...form, ligamentGroupIds: toggleId(form.ligamentGroupIds, l.id) })}
                  />
                  {l.name}
                </label>
              ))}
            </div>
          </div>

          {/* Videos */}
          <div className="form-group">
            <label>Instructional Videos</label>
            {form.videos.map((v, i) => (
              <div key={i} className="form-grid" style={{ marginBottom: '0.5rem' }}>
                <input value={v.url} onChange={(e) => updateVideo(i, { url: e.target.value })} placeholder="URL" />
                <input value={v.title} onChange={(e) => updateVideo(i, { title: e.target.value })} placeholder="Title" />
                <input value={v.source} onChange={(e) => updateVideo(i, { source: e.target.value })} placeholder="Source (youtube, upload...)" />
                <button className="btn-danger" onClick={() => removeVideo(i)} style={{ width: 'auto' }}>Remove</button>
              </div>
            ))}
            <button className="btn-secondary" onClick={addVideo} style={{ width: 'auto' }}>+ Add Video</button>
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave}>{editingId ? 'Save' : 'Create'}</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th><th>Category</th><th>Region</th><th>Difficulty</th>
            <th>Muscle Groups</th><th>Ligament Groups</th>{canManage && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {exercises.length === 0 && (
            <tr><td colSpan={canManage ? 7 : 6} className="empty-state">No exercises found.</td></tr>
          )}
          {exercises.map((ex) => (
            <tr key={ex.id}>
              <td><strong>{ex.name}</strong></td>
              <td><span className="badge badge-gray">{ex.category}</span></td>
              <td>{ex.bodyRegion}</td>
              <td>{ex.difficulty}</td>
              <td>{(ex.muscleGroups || []).map((m) => m.name).join(', ') || '—'}</td>
              <td>{(ex.ligamentGroups || []).map((l) => l.name).join(', ') || '—'}</td>
              {canManage && (
                <td>
                  <button className="btn-secondary" onClick={() => openEdit(ex)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', marginRight: '0.25rem' }}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(ex.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
