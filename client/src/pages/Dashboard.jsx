import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, priorityStyle } from '../utils/format.js';

/** Trang tổng quan: số liệu, danh sách quá hạn & hạn hôm nay, thao tác nhanh. */
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, open: 0, done: 0, overdue: 0, dueToday: [] });
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [all, od, today] = await Promise.all([
          api.get('/tasks'),
          api.get('/tasks', { params: { overdue: 'true' } }),
          api.get('/tasks', { params: { dueToday: 'true' } }),
        ]);
        const tasks = all.data;
        setStats({
          total: tasks.length,
          open: tasks.filter((t) => t.status !== 'done').length,
          done: tasks.filter((t) => t.status === 'done').length,
          overdue: od.data.length,
          dueToday: today.data.filter((t) => t.status !== 'done'),
        });
        setOverdue(od.data.slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-slate-500">Đang tải tổng quan…</div>;

  const cards = [
    { label: 'Tổng số việc', value: stats.total, icon: '🗂️', cls: 'from-indigo-500 to-indigo-600 shadow-indigo-200' },
    { label: 'Đang làm', value: stats.open, icon: '⏳', cls: 'from-amber-500 to-orange-500 shadow-amber-200' },
    { label: 'Đã hoàn thành', value: stats.done, icon: '✅', cls: 'from-emerald-500 to-teal-500 shadow-emerald-200' },
    { label: 'Quá hạn', value: stats.overdue, icon: '🔥', cls: 'from-rose-500 to-pink-500 shadow-rose-200' },
  ];

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-slate-800">Xin chào, {user?.name} 👋</h1>
      <p className="text-slate-500 text-sm mt-1">Đây là những việc đang chờ bạn hôm nay.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 md:mt-7">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-gradient-to-br ${c.cls} text-white rounded-3xl p-4 md:p-5 shadow-lg hover:-translate-y-0.5 transition-transform duration-150`}
          >
            <div className="flex items-start justify-between">
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">{c.value}</div>
              <span className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-white/20 flex items-center justify-center text-lg">{c.icon}</span>
            </div>
            <div className="text-sm font-medium opacity-95 mt-2">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-5 mt-6 md:mt-7">
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-4 sm:p-6">
          <h2 className="font-bold text-slate-800 mb-4">📅 Hạn hôm nay ({stats.dueToday.length})</h2>
          {stats.dueToday.length === 0 ? (
            <p className="text-sm text-slate-400">Không có việc nào hôm nay. Thư giãn thôi! ☕</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.dueToday.map((t) => {
                const prio = priorityStyle(t.priority);
                return (
                  <li key={t._id} className="text-sm flex justify-between items-center gap-2 py-2.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-5 rounded-full shrink-0 ${prio.bar}`} aria-hidden="true" />
                      <span className="truncate font-medium text-slate-700">{t.title}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${prio.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                      {prio.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-4 sm:p-6">
          <h2 className="font-bold text-slate-800 mb-4">⚠️ Quá hạn</h2>
          {overdue.length === 0 ? (
            <p className="text-sm text-slate-400">Không có việc quá hạn. Tuyệt vời! 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {overdue.map((t) => {
                const prio = priorityStyle(t.priority);
                return (
                  <li key={t._id} className="text-sm flex justify-between items-center gap-2 py-2.5">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-5 rounded-full shrink-0 ${prio.bar}`} aria-hidden="true" />
                      <span className="truncate font-medium text-slate-700">{t.title}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className={`hidden min-[420px]:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${prio.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                        {prio.label}
                      </span>
                      <span className="text-rose-600 font-medium text-xs bg-rose-50 px-2 py-0.5 rounded-full">{fmtDate(t.dueDate)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          to="/tasks"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition"
        >
          + Thêm việc mới
        </Link>
        <a
          href="/api/calendar/export.ics"
          className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
        >
          ⬇ Xuất lịch (.ics)
        </a>
        <Link
          to="/projects"
          className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
        >
          Xem dự án
        </Link>
      </div>
    </div>
  );
}
