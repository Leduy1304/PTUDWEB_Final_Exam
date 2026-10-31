import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Trang Nhóm: với mỗi dự án, hiển thị danh sách thành viên (thêm/xóa bằng
 * email), tổ chức của chủ dự án và các việc đang mở được giao cho từng người.
 */
export default function Team() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [assigned, setAssigned] = useState({});
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState({});
  const [error, setError] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/projects');
        setProjects(data);
        // Tải các việc đang mở của từng dự án để biết ai đang được giao việc gì.
        const map = {};
        for (const p of data) {
          const { data: tasks } = await api.get('/tasks', { params: { project: p._id } });
          map[p._id] = tasks.filter((t) => t.status !== 'done' && t.assignee);
        }
        setAssigned(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addMember = async (projectId, e) => {
    e.preventDefault();
    setError((er) => ({ ...er, [projectId]: '' }));
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { email: invite[projectId] });
      setProjects((ps) => ps.map((p) => (p._id === projectId ? data : p)));
      setInvite((iv) => ({ ...iv, [projectId]: '' }));
    } catch (err) {
      setError((er) => ({ ...er, [projectId]: err.response?.data?.message || 'Không thêm được thành viên' }));
    }
  };

  const removeMember = async (projectId, userId) => {
    if (!window.confirm('Xóa thành viên này khỏi dự án?')) return;
    const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);
    setProjects((ps) => ps.map((p) => (p._id === projectId ? data : p)));
  };

  if (loading) return <div className="text-slate-500">Đang tải nhóm…</div>;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-slate-800">Nhóm</h1>
      <p className="text-sm text-slate-500 mt-1">
        {user?.organization
          ? `Tổ chức: ${user.organization}. `
          : 'Hãy điền tổ chức trong hồ sơ của bạn để gom nhóm đồng đội. '}
        Mời thành viên bằng email và giao việc cho họ từ bất kỳ bảng dự án nào.
      </p>

      {projects.length === 0 ? (
        <div className="mt-6 text-slate-400 text-sm bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center">
          <div className="text-3xl mb-2">👥</div>
          Chưa có dự án nào —{' '}
          <Link to="/projects" className="text-indigo-600 font-semibold hover:text-indigo-700">tạo một dự án</Link>{' '}
          để bắt đầu xây dựng nhóm của bạn.
        </div>
      ) : (
        <div className="grid xl:grid-cols-2 gap-4 mt-6">
          {projects.map((p) => {
            const members = [p.owner, ...(p.members || [])].filter(Boolean);
            const byMember = {};
            for (const t of assigned[p._id] || []) {
              const key = t.assignee._id;
              (byMember[key] = byMember[key] || []).push(t);
            }
            return (
              <div key={p._id} className="bg-white border border-slate-200/70 rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Link to={`/projects/${p._id}`} className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-2.5 transition">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}1f` }}>
                      <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                    </span>
                    {p.name}
                  </Link>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                    {members.length} thành viên
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {members.map((m) => (
                    <div key={m._id} className="flex items-start justify-between gap-2 text-sm bg-slate-50 hover:bg-slate-100/70 rounded-2xl px-4 py-3 transition">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(m.name || '?').trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          <span className="text-slate-400 text-xs ml-2 break-all">{m.email}</span>
                          {p.owner?._id === m._id && (
                            <span className="ml-2 text-[11px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">👑 Chủ dự án</span>
                          )}
                          <div className="text-xs text-slate-500 mt-1">
                            {(byMember[m._id] || []).length} việc đang mở được giao
                            {(byMember[m._id] || []).slice(0, 3).map((t) => (
                              <span key={t._id} className="block truncate mt-0.5">· {t.title}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {p.owner?._id !== m._id && (
                        <button
                          onClick={() => removeMember(p._id, m._id)}
                          className="text-xs text-slate-400 hover:text-rose-600 shrink-0 ml-2 transition"
                          title="Xóa thành viên"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={(e) => addMember(p._id, e)} className="flex flex-col sm:flex-row gap-2 mt-4">
                  <input
                    type="email"
                    placeholder="Mời bằng email…"
                    value={invite[p._id] || ''}
                    onChange={(e) => setInvite((iv) => ({ ...iv, [p._id]: e.target.value }))}
                    className="flex-1 min-w-0 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                  <button type="submit" className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition">
                    Mời
                  </button>
                </form>
                {error[p._id] && <div className="text-xs text-rose-600 mt-1.5">{error[p._id]}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
