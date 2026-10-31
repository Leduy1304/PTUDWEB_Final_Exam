import { useEffect, useState } from 'react';
import api from '../api/client.js';
import TaskCard from '../components/TaskCard.jsx';
import TaskModal from '../components/TaskModal.jsx';

/** Danh sách việc cá nhân: tìm kiếm, lọc và đầy đủ thao tác thêm/sửa/xóa. */
export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', project: '' });

  const load = async () => {
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.project) params.project = filters.project;
    const { data } = await api.get('/tasks', { params });
    setTasks(data);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/projects');
        setProjects(data);
        await load();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const selectCls =
    'flex-1 min-w-[150px] sm:flex-none sm:min-w-0 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Việc của tôi</h1>
          <p className="text-slate-500 text-sm mt-1">Tất cả công việc cá nhân của bạn ở một nơi.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition"
        >
          + Thêm việc mới
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-6 bg-white border border-slate-200/70 rounded-2xl p-3 shadow-sm">
        <input
          placeholder="🔍 Tìm kiếm công việc…"
          value={filters.q}
          onChange={set('q')}
          className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm w-full sm:w-60 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <select className={selectCls} value={filters.status} onChange={set('status')}>
          <option value="">Mọi trạng thái</option>
          <option value="todo">Cần làm</option>
          <option value="in-progress">Đang làm</option>
          <option value="done">Hoàn thành</option>
        </select>
        <select className={selectCls} value={filters.priority} onChange={set('priority')}>
          <option value="">Mọi mức ưu tiên</option>
          <option value="low">Thấp</option>
          <option value="medium">Trung bình</option>
          <option value="high">Cao</option>
        </select>
        <select className={selectCls} value={filters.project} onChange={set('project')}>
          <option value="">Mọi dự án</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-500 mt-8">Đang tải công việc…</div>
      ) : tasks.length === 0 ? (
        <div className="mt-6 text-slate-400 text-sm bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center">
          <div className="text-3xl mb-2">✨</div>
          Chưa có công việc nào phù hợp. Tạo việc đầu tiên bằng nút “Thêm việc mới” ở trên nhé!
        </div>
      ) : (
        <div className="grid gap-3 mt-5">
          {tasks.map((t) => (
            <TaskCard key={t._id} task={t} onChanged={onChanged} onEdit={() => { setEditing(t); setShowModal(true); }} />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editing}
          projects={projects}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
