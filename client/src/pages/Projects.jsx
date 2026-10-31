import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

/** Lưới các dự án, có tạo mới / xóa. */
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', color: '#4f46e5' });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data } = await api.get('/projects');
    setProjects(data);
  };

  useEffect(() => {
    (async () => {
      try { await load(); } finally { setLoading(false); }
    })();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/projects', form);
    setProjects((ps) => [data, ...ps]);
    setForm({ name: '', description: '', color: '#4f46e5' });
    setShowForm(false);
  };

  const remove = async (p) => {
    if (!window.confirm(`Xóa dự án "${p.name}" cùng toàn bộ công việc trong đó?`)) return;
    await api.delete(`/projects/${p._id}`);
    setProjects((ps) => ps.filter((x) => x._id !== p._id));
  };

  const inputCls =
    'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

  if (loading) return <div className="text-slate-500">Đang tải dự án…</div>;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Dự án</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý dự án và làm việc cùng nhóm của bạn.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition"
        >
          + Dự án mới
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="pop-in mt-5 bg-white border border-slate-200/70 rounded-3xl p-4 sm:p-6 shadow-sm max-w-xl">
          <h2 className="font-bold text-slate-800 mb-4">Tạo dự án mới</h2>
          <label className={labelCls}>Tên dự án *</label>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nhập tên dự án…" required />
          <label className={`${labelCls} mt-4`}>Mô tả</label>
          <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn về dự án…" />
          <label className={`${labelCls} mt-4`}>Màu đại diện</label>
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20 rounded-lg cursor-pointer" />
          <div className="flex gap-2 mt-5">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition"
            >
              Tạo dự án
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">
              Hủy
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="mt-6 text-slate-400 text-sm bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center">
          <div className="text-3xl mb-2">📁</div>
          Chưa có dự án nào — tạo một dự án để bắt đầu cộng tác cùng nhóm nhé!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="group bg-white border border-slate-200/70 rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}1f` }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                  </span>
                  <Link to={`/projects/${p._id}`} className="font-bold text-slate-800 hover:text-indigo-600 truncate transition">
                    {p.name}
                  </Link>
                </div>
                <button
                  onClick={() => remove(p)}
                  className="text-slate-300 hover:text-rose-600 transition shrink-0"
                  title="Xóa dự án"
                >
                  🗑️
                </button>
              </div>
              {p.description && <p className="text-sm text-slate-500 mt-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                <span>👑 {p.owner?.name}</span>
                <span>👥 {p.members?.length || 0} thành viên</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
