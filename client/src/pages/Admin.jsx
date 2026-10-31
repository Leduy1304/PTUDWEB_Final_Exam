import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, STATUS_LABELS, STATUS_STYLES, priorityStyle, isOverdue } from '../utils/format.js';

/** Dịch nhanh các thông báo lỗi quen thuộc từ API sang tiếng Việt. */
function viError(err, fallback) {
  const msg = err?.response?.data?.message || '';
  const map = {
    'Admin access required': 'Bạn không có quyền quản trị',
    'Cannot demote the last admin': 'Không thể hạ quyền quản trị viên cuối cùng của hệ thống',
    'Cannot delete the last admin': 'Không thể xóa quản trị viên cuối cùng của hệ thống',
    'You cannot delete your own account': 'Bạn không thể tự xóa tài khoản của mình',
    'User not found': 'Không tìm thấy người dùng',
    'Role must be "user" or "admin"': 'Vai trò không hợp lệ',
  };
  return map[msg] || fallback;
}

const ROLE_LABELS = { user: 'Người dùng', admin: 'Quản trị viên' };

const TABS = [
  { key: 'users', label: 'Người dùng' },
  { key: 'projects', label: 'Tất cả dự án' },
  { key: 'tasks', label: 'Tất cả công việc' },
];

/**
 * Trang Quản trị (chỉ admin): thống kê toàn hệ thống, quản lý mọi tài khoản
 * (đổi vai trò / xóa), và xem toàn bộ dự án + công việc của mọi người.
 */
export default function Admin() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStatus, setTaskStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadStats = async () => {
    const { data } = await api.get('/admin/stats');
    setStats(data);
  };
  const loadUsers = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };
  const loadProjects = async () => {
    const { data } = await api.get('/admin/projects');
    setProjects(data);
  };
  const loadTasks = async (status) => {
    const { data } = await api.get('/admin/tasks', { params: status ? { status } : {} });
    setTasks(data);
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadStats(), loadUsers(), loadProjects(), loadTasks('')]);
      } catch (err) {
        setError(viError(err, 'Không tải được dữ liệu quản trị'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) loadTasks(taskStatus).catch((err) => setError(viError(err, 'Không tải được danh sách công việc')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatus]);

  const changeRole = async (u, role) => {
    setError('');
    setNotice('');
    try {
      const { data } = await api.patch(`/admin/users/${u._id}/role`, { role });
      setUsers((list) => list.map((x) => (x._id === u._id ? data : x)));
      setNotice(`Đã đổi vai trò của ${u.name} thành ${ROLE_LABELS[role]}.`);
    } catch (err) {
      setError(viError(err, 'Không đổi được vai trò'));
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Xóa tài khoản "${u.name}" (${u.email})?\n\nDự án và công việc do người này sở hữu cũng sẽ bị xóa. Hành động này không thể hoàn tác.`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/users/${u._id}`);
      setUsers((list) => list.filter((x) => x._id !== u._id));
      await Promise.all([loadStats(), loadProjects(), loadTasks(taskStatus)]);
      setNotice(`Đã xóa tài khoản ${u.name}.`);
    } catch (err) {
      setError(viError(err, 'Không xóa được tài khoản'));
    }
  };

  if (loading) return <div className="text-slate-500">Đang tải dữ liệu quản trị…</div>;

  const cards = [
    { label: 'Tổng người dùng', value: stats?.users ?? 0, icon: '👥', cls: 'from-indigo-500 to-indigo-600 shadow-indigo-200' },
    { label: 'Tổng dự án', value: stats?.projects ?? 0, icon: '▤', cls: 'from-violet-500 to-purple-600 shadow-violet-200' },
    { label: 'Tổng công việc', value: stats?.tasks ?? 0, icon: '🗂️', cls: 'from-sky-500 to-blue-600 shadow-sky-200' },
    { label: 'Quá hạn', value: stats?.overdue ?? 0, icon: '🔥', cls: 'from-rose-500 to-pink-500 shadow-rose-200' },
  ];

  const thCls = 'text-left text-xs font-semibold uppercase tracking-wide text-slate-400 px-4 py-3';
  const tdCls = 'px-4 py-3 text-sm text-slate-700';

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-slate-800">Quản trị hệ thống 🛡️</h1>
      <p className="text-slate-500 text-sm mt-1">Toàn cảnh TaskFlow: người dùng, dự án và công việc của mọi người.</p>

      {error && <div className="mt-5 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</div>}
      {notice && <div className="mt-5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{notice}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 md:mt-7">
        {cards.map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.cls} text-white rounded-3xl p-4 md:p-5 shadow-lg hover:-translate-y-0.5 transition-transform duration-150`}>
            <div className="flex items-start justify-between">
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">{c.value}</div>
              <span className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-white/20 flex items-center justify-center text-lg">{c.icon}</span>
            </div>
            <div className="text-sm font-medium opacity-95 mt-2">{c.label}</div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 font-medium">Cần làm: {stats.tasksByStatus.todo}</span>
          <span className="px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 font-medium">Đang làm: {stats.tasksByStatus['in-progress']}</span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Hoàn thành: {stats.tasksByStatus.done}</span>
        </div>
      )}

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition ${
              tab === t.key
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="mt-4 bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className={thCls}>Họ tên</th>
                  <th className={thCls}>Email</th>
                  <th className={thCls}>Tổ chức</th>
                  <th className={thCls}>Vai trò</th>
                  <th className={thCls}>Ngày tạo</th>
                  <th className={thCls}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = String(u._id) === String(me?.id);
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition">
                      <td className={`${tdCls} font-semibold text-slate-800`}>
                        {u.name} {isSelf && <span className="text-xs font-medium text-indigo-500">(bạn)</span>}
                      </td>
                      <td className={tdCls}>{u.email}</td>
                      <td className={tdCls}>{u.organization || '—'}</td>
                      <td className={tdCls}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className={tdCls}>{fmtDate(u.createdAt)}</td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => changeRole(u, e.target.value)}
                            title={isSelf ? 'Bạn không thể tự đổi vai trò của mình' : 'Đổi vai trò'}
                            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            <option value="user">Người dùng</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                          <button
                            onClick={() => removeUser(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Bạn không thể tự xóa tài khoản của mình' : 'Xóa tài khoản'}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 transition"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Chưa có người dùng nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="mt-4 bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className={thCls}>Tên dự án</th>
                  <th className={thCls}>Chủ sở hữu</th>
                  <th className={thCls}>Số thành viên</th>
                  <th className={thCls}>Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition">
                    <td className={`${tdCls} font-semibold text-slate-800`}>
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: p.color }} />
                      {p.name}
                    </td>
                    <td className={tdCls}>{p.owner?.name} <span className="text-slate-400">({p.owner?.email})</span></td>
                    <td className={tdCls}>{p.memberCount} người</td>
                    <td className={tdCls}>{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">Chưa có dự án nào trong hệ thống.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <label className="text-sm font-medium text-slate-600">Lọc theo trạng thái:</label>
            <select
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả</option>
              <option value="todo">Cần làm</option>
              <option value="in-progress">Đang làm</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className={thCls}>Công việc</th>
                    <th className={thCls}>Dự án</th>
                    <th className={thCls}>Người phụ trách</th>
                    <th className={thCls}>Ưu tiên</th>
                    <th className={thCls}>Trạng thái</th>
                    <th className={thCls}>Hạn chót</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((t) => {
                    const prio = priorityStyle(t.priority);
                    return (
                    <tr key={t._id} className="hover:bg-slate-50/60 transition">
                      <td className={`${tdCls} font-semibold text-slate-800`}>{t.title}</td>
                      <td className={tdCls}>{t.project?.name || <span className="text-slate-400">Cá nhân</span>}</td>
                      <td className={tdCls}>{t.assignee?.name || <span className="text-slate-400">Chưa giao</span>}</td>
                      <td className={tdCls}>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${prio.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                          {prio.label}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                      </td>
                      <td className={tdCls}>
                        {t.dueDate ? (
                          <span className={isOverdue(t) ? 'text-rose-600 font-semibold' : ''}>
                            {fmtDate(t.dueDate)}{isOverdue(t) ? ' (quá hạn)' : ''}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Không có công việc nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
