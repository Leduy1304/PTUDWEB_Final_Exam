import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { fmtDateTime } from '../utils/format.js';

/** Nhắc việc sắp tới: xem danh sách, tạo cho một công việc, xóa. */
export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ task: '', remindAt: '', note: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const [remRes, taskRes] = await Promise.all([
      api.get('/reminders', { params: { upcoming: 'true' } }),
      api.get('/tasks'),
    ]);
    setReminders(remRes.data);
    setTasks(taskRes.data.filter((t) => t.status !== 'done'));
  };

  useEffect(() => {
    (async () => {
      try { await load(); } finally { setLoading(false); }
    })();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/reminders', {
        task: form.task,
        remindAt: new Date(form.remindAt).toISOString(),
        note: form.note,
      });
      setReminders((rs) => [...rs, data].sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt)));
      setForm({ task: '', remindAt: '', note: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tạo được nhắc việc');
    }
  };

  const remove = async (id) => {
    await api.delete(`/reminders/${id}`);
    setReminders((rs) => rs.filter((r) => r._id !== id));
  };

  const inputCls =
    'px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition w-full';

  if (loading) return <div className="text-slate-500">Đang tải nhắc việc…</div>;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-slate-800">Nhắc việc</h1>
      <p className="text-sm text-slate-500 mt-1">
        Máy chủ kiểm tra các nhắc việc đến hạn mỗi phút và ghi nhận lại (xem README để nối thông báo thật).
      </p>

      <form onSubmit={create} className="mt-6 bg-white border border-slate-200/70 rounded-3xl p-4 sm:p-6 shadow-sm max-w-2xl">
        <h2 className="font-bold text-slate-800 mb-4">⏰ Tạo nhắc việc mới</h2>
        {error && <div className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">{error}</div>}
        <div className="grid md:grid-cols-3 gap-3">
          <select className={inputCls} value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} required>
            <option value="">Chọn công việc…</option>
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            className={inputCls}
            value={form.remindAt}
            onChange={(e) => setForm({ ...form, remindAt: e.target.value })}
            required
          />
          <input
            className={inputCls}
            placeholder="Ghi chú (không bắt buộc)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition"
        >
          Thêm nhắc việc
        </button>
      </form>

      <div className="mt-8 max-w-2xl">
        <h2 className="font-bold text-slate-800 mb-3">Sắp tới ({reminders.length})</h2>
        {reminders.length === 0 ? (
          <div className="text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center">
            <div className="text-3xl mb-2">🔔</div>
            Chưa có nhắc việc nào sắp tới. Tạo một nhắc việc ở trên để không bỏ lỡ việc gì nhé!
          </div>
        ) : (
          <div className="space-y-2.5">
            {reminders.map((r) => (
              <div
                key={r._id}
                className="bg-white border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-lg shrink-0">🔔</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">{r.task?.title || '(công việc đã bị xóa)'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmtDateTime(r.remindAt)}{r.note ? ` — ${r.note}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => remove(r._id)}
                  className="text-xs w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-100 transition shrink-0"
                  title="Xóa nhắc việc"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
