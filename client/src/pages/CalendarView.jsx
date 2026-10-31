import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { priorityStyle } from '../utils/format.js';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Lưới tháng hiển thị công việc theo hạn chót, kèm xuất file .ics. Tuần bắt đầu từ Thứ 2. */
export default function CalendarView() {
  const [tasks, setTasks] = useState([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const start = new Date(cursor.year, cursor.month, 1);
        const end = new Date(cursor.year, cursor.month + 1, 0, 23, 59, 59);
        const { data } = await api.get('/tasks', {
          params: { dueAfter: start.toISOString(), dueBefore: end.toISOString() },
        });
        setTasks(data.filter((t) => t.dueDate));
      } finally {
        setLoading(false);
      }
    })();
  }, [cursor]);

  // Số ô trống đầu tháng khi tuần bắt đầu từ Thứ 2 (T2 = 0 … CN = 6)
  const firstDow = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const rawMonthName = new Date(cursor.year, cursor.month, 1).toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
  const monthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);

  const byDay = {};
  for (const t of tasks) {
    const day = new Date(t.dueDate).getDate();
    (byDay[day] = byDay[day] || []).push(t);
  }

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const move = (delta) => {
    const m = cursor.month + delta;
    setCursor({ year: cursor.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 });
  };

  const today = new Date();
  const navBtn =
    'w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition';

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Lịch</h1>
          <p className="text-slate-500 text-sm mt-1">Xem công việc theo hạn chót trong tháng.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => move(-1)} className={navBtn} title="Tháng trước">←</button>
          <span className="font-bold text-slate-700 w-32 sm:w-44 text-center text-sm sm:text-base">{monthName}</span>
          <button onClick={() => move(1)} className={navBtn} title="Tháng sau">→</button>
          <a
            href="/api/calendar/export.ics"
            className="sm:ml-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition"
          >
            ⬇ Xuất .ics
          </a>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 mt-8">Đang tải lịch…</div>
      ) : (
        <div className="mt-6 bg-white border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50 text-[11px] sm:text-xs font-bold text-slate-500 border-b border-slate-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-1 py-2 sm:px-2 sm:py-3 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const isToday =
                day &&
                today.getFullYear() === cursor.year &&
                today.getMonth() === cursor.month &&
                today.getDate() === day;
              return (
                <div key={i} className={`min-h-[68px] sm:min-h-[88px] md:min-h-[100px] border-t border-l border-slate-100 p-1 sm:p-1.5 ${day ? 'hover:bg-indigo-50/40 transition' : 'bg-slate-50/60'}`}>
                  {day && (
                    <>
                      <div
                        className={`text-[11px] sm:text-xs font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {day}
                      </div>
                      <div className="mt-1 space-y-1">
                        {(byDay[day] || []).slice(0, 3).map((t) => (
                          <div
                            key={t._id}
                            title={`${t.title} (${priorityStyle(t.priority).label})`}
                            className={`text-[10px] sm:text-[11px] leading-tight font-medium px-1 sm:px-1.5 py-0.5 rounded-md truncate ${t.status === 'done' ? 'bg-slate-100 text-slate-400 line-through' : priorityStyle(t.priority).chip}`}
                          >
                            {t.title}
                          </div>
                        ))}
                        {(byDay[day] || []).length > 3 && (
                          <div className="text-[10px] sm:text-[11px] text-slate-400 px-0.5 sm:px-1">+{(byDay[day] || []).length - 3} việc nữa</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-4 leading-relaxed">
        File .ics có thể nhập vào Google Calendar, Apple Calendar hoặc Outlook. Từng công việc cũng có nút
        “Thêm vào Google Calendar” (🗓️ trên thẻ công việc).
      </p>
    </div>
  );
}
