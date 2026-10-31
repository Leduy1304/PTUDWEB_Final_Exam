import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client.js';
import TaskCard from '../components/TaskCard.jsx';
import TaskModal from '../components/TaskModal.jsx';

const COLUMNS = [
  { key: 'todo', label: 'Cần làm', dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700', ring: 'border-sky-300 bg-sky-50' },
  { key: 'in-progress', label: 'Đang làm', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700', ring: 'border-violet-300 bg-violet-50' },
  { key: 'done', label: 'Hoàn thành', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', ring: 'border-emerald-300 bg-emerald-50' },
];

/**
 * Chi tiết dự án: bảng Kanban kéo thả giữa các cột Cần làm / Đang làm /
 * Hoàn thành, tạo công việc, quản lý thành viên và giao việc cho thành viên.
 */
export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [dragOver, setDragOver] = useState(null);

  const load = async () => {
    const [projRes, tasksRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get('/tasks', { params: { project: id } }),
    ]);
    setProject(projRes.data);
    setTasks(tasksRes.data);
  };

  useEffect(() => {
    (async () => {
      try { await load(); } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const members = project
    ? [project.owner, ...(project.members || [])].filter(Boolean)
    : [];

  const onChanged = (updated, deletedId) => {
    if (deletedId) setTasks((ts) => ts.filter((t) => t._id !== deletedId));
    else setTasks((ts) => ts.map((t) => (t._id === updated._id ? updated : t)));
  };

  const onSaved = (saved) => {
    setTasks((ts) => {
      const exists = ts.some((t) => t._id === saved._id);
      return exists ? ts.map((t) => (t._id === saved._id ? saved : t)) : [saved, ...ts];
    });
    setShowModal(false);
    setEditing(null);
  };

  // --- kéo & thả: thả thẻ vào cột để đổi trạng thái ---
  const onDragStart = (taskId) => (e) => {
    e.dataTransfer.setData('text/task-id', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropColumn = (status) => async (e) => {
    e.preventDefault();
    setDragOver(null);
    const taskId = e.dataTransfer.getData('text/task-id');
    if (!taskId) return;
    const current = tasks.find((t) => t._id === taskId);
    if (!current || current.status === status) return;
    const { data } = await api.patch(`/tasks/${taskId}`, { status });
    onChanged(data);
  };

  // --- quản lý thành viên ---
  const invite = async (e) => {
    e.preventDefault();
    setInviteError('');
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: inviteEmail });
      setProject(data);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Không thêm được thành viên');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Xóa thành viên này khỏi dự án?')) return;
    const { data } = await api.delete(`/projects/${id}/members/${userId}`);
    setProject(data);
  };

  if (loading) return <div className="text-slate-500">Đang tải dự án…</div>;
  if (!project) return <div className="text-slate-500">Không tìm thấy dự án.</div>;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${project.color}1f` }}>
            <span className="w-4 h-4 rounded-full" style={{ background: project.color }} />
          </span>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">{project.name}</h1>
            {project.description && <p className="text-sm text-slate-500">{project.description}</p>}
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition"
        >
          + Thêm việc mới
        </button>
      </div>

      {/* Thành viên */}
      <div className="mt-6 bg-white border border-slate-200/70 rounded-3xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-3">👥 Thành viên ({members.length})</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <span key={m._id} className="inline-flex items-center gap-2 text-xs font-medium bg-slate-100 hover:bg-slate-200/70 rounded-full pl-3.5 pr-1.5 py-1.5 transition">
              {m.name}
              {project.owner?._id === m._id && <span className="text-amber-600 font-semibold">👑 Chủ dự án</span>}
              {project.owner?._id !== m._id && (
                <button onClick={() => removeMember(m._id)} className="text-slate-400 hover:text-rose-600 px-1 transition" title="Xóa thành viên">✕</button>
              )}
            </span>
          ))}
        </div>
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-2 mt-4 max-w-md">
          <input
            type="email"
            placeholder="Mời bằng email…"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 min-w-0 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            required
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition"
          >
            Mời
          </button>
        </form>
        {inviteError && <div className="text-xs text-rose-600 mt-2">{inviteError}</div>}
        <p className="text-xs text-slate-400 mt-2.5">
          Mời bằng email — người được mời phải đã có tài khoản. Bạn có thể giao việc cho họ trong khung sửa công việc.
        </p>
      </div>

      {/* Bảng Kanban — di động: cuộn ngang từng cột; lg trở lên: lưới 3 cột */}
      <div className="flex gap-4 mt-6 items-start overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-x-visible lg:pb-0 lg:snap-none">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          const isOver = dragOver === col.key;
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={onDropColumn(col.key)}
              className={`snap-start shrink-0 w-[85vw] sm:w-[320px] lg:w-auto rounded-3xl p-3 min-h-[320px] border-2 transition-all duration-150 ${
                isOver ? `${col.ring} border-dashed` : 'bg-slate-100/80 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between px-2 pt-1 mb-3">
                <h2 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  {col.label}
                </h2>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${col.badge}`}>{colTasks.length}</span>
              </div>
              <div className="space-y-2.5 kanban-col max-h-[65vh] overflow-y-auto pr-0.5">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t._id}
                    task={t}
                    draggable
                    onDragStart={onDragStart(t._id)}
                    onChanged={onChanged}
                    onEdit={() => { setEditing(t); setShowModal(true); }}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-8 border border-dashed border-slate-300 rounded-2xl">
                    Kéo thả công việc vào đây
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <TaskModal
          task={editing}
          members={members}
          fixedProject={id}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
