
'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import AdminNav from '../_components/AdminNav';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [form, setForm] = useState({ title: '', difficulty: 'EASY', topic: '', description: '', starterCode: '', constraints: '', visibleTests: '', hiddenTests: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchQuestions(); }, [page]);

  async function fetchQuestions() {
    setLoading(true);
    const res = await fetch(`/api/admin/questions?page=${page}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  function openEdit(q: any) {
    setEditingQuestion(q);
    setForm({
      title: q.title, difficulty: q.difficulty, topic: q.topic,
      description: q.description, starterCode: q.starterCode,
      constraints: q.constraints?.join('\n') || '',
      visibleTests: JSON.stringify(q.visibleTests || [], null, 2),
      hiddenTests: JSON.stringify(q.hiddenTests || [], null, 2),
    });
    setShowForm(true);
  }

  function openNew() {
    setEditingQuestion(null);
    setForm({ title: '', difficulty: 'EASY', topic: '', description: '', starterCode: '', constraints: '', visibleTests: '[]', hiddenTests: '[]' });
    setShowForm(true);
  }

  async function saveQuestion() {
    setSaving(true);
    try {
      const body = {
        ...form,
        constraints: form.constraints.split('\n').filter(Boolean),
        visibleTests: JSON.parse(form.visibleTests || '[]'),
        hiddenTests: JSON.parse(form.hiddenTests || '[]'),
        examples: [],
      };

      const url = editingQuestion ? `/api/admin/questions/${editingQuestion.id}` : '/api/admin/questions';
      const method = editingQuestion ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setShowForm(false); fetchQuestions(); }
      else { const d = await res.json(); alert(d.error || 'Save failed'); }
    } catch (e) { alert('Invalid JSON in test cases'); }
    setSaving(false);
  }

  async function deleteQuestion(id: string) {
  if (!confirm('Delete this question? This will also remove any interviews that used this question.')) return;
  try {
    const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchQuestions();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete question');
    }
  } catch (e) {
    alert('Network error while deleting');
  }
}

  const inputStyle = { width: '100%', padding: '8px 12px', background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 8, color: '#dae2fd', fontSize: 13, boxSizing: 'border-box' as const, outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#c7c4d8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326' }}>
      <AdminNav active="questions" />
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#dae2fd' }}>Questions</h1>
            <p style={{ margin: '4px 0 0', color: '#c7c4d8', fontSize: 13 }}>{total} total questions</p>
          </div>
          <button onClick={openNew} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #c0c1ff, #4b4dd8)', border: 'none', borderRadius: 8, color: '#1000a9', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Add Question
          </button>
        </div>

        {loading ? <p style={{ color: '#c7c4d8' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(70,69,85,0.3)' }}>
                {['Title', 'Difficulty', 'Topic', 'Visible Tests', 'Hidden Tests', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#c7c4d8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                  <td style={{ padding: '12px', color: '#dae2fd', fontWeight: 600 }}>{q.title}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: q.difficulty === 'EASY' ? 'rgba(74,222,128,0.1)' : q.difficulty === 'MEDIUM' ? 'rgba(251,191,36,0.1)' : 'rgba(255,180,171,0.1)', color: q.difficulty === 'EASY' ? '#4ade80' : q.difficulty === 'MEDIUM' ? '#fbbf24' : '#ffb4ab' }}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>{q.topic}</td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>{(q.visibleTests as any[])?.length ?? 0}</td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>{(q.hiddenTests as any[])?.length ?? 0}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => openEdit(q)} style={{ marginRight: 8, padding: '4px 12px', background: 'rgba(192,193,255,0.1)', border: '1px solid rgba(192,193,255,0.2)', borderRadius: 6, color: '#c0c1ff', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteQuestion(q.id)} style={{ padding: '4px 12px', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 6, color: '#ffb4ab', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 6, color: '#dae2fd', cursor: 'pointer', fontSize: 13 }}>← Prev</button>}
          <span style={{ padding: '6px 14px', color: '#c7c4d8', fontSize: 13 }}>Page {page}</span>
          {questions.length === 20 && <button onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 6, color: '#dae2fd', cursor: 'pointer', fontSize: 13 }}>Next →</button>}
        </div>
      </main>

      {/* Question form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#171f33', borderRadius: 16, padding: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(70,69,85,0.3)' }}>
            <h2 style={{ margin: '0 0 20px', color: '#dae2fd', fontWeight: 800 }}>{editingQuestion ? 'Edit Question' : 'Add Question'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Topic</label>
                <input style={inputStyle} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Difficulty</label>
              <select style={inputStyle} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option>EASY</option><option>MEDIUM</option><option>HARD</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, height: 100, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Starter Code</label>
              <textarea style={{ ...inputStyle, height: 100, fontFamily: 'monospace', resize: 'vertical' }} value={form.starterCode} onChange={e => setForm(f => ({ ...f, starterCode: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Constraints (one per line)</label>
              <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={form.constraints} onChange={e => setForm(f => ({ ...f, constraints: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Visible Test Cases (JSON)</label>
              <textarea style={{ ...inputStyle, height: 80, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} value={form.visibleTests} onChange={e => setForm(f => ({ ...f, visibleTests: e.target.value }))} />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#c7c4d8' }}>Format: [{`{"input":"...","expectedOutput":"..."}`}]</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Hidden Test Cases (JSON)</label>
              <textarea style={{ ...inputStyle, height: 80, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} value={form.hiddenTests} onChange={e => setForm(f => ({ ...f, hiddenTests: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveQuestion} disabled={saving} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #c0c1ff, #4b4dd8)', border: 'none', borderRadius: 8, color: '#1000a9', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Question'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 8, color: '#c7c4d8', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
