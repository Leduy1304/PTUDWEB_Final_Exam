import { useState } from 'react';
import api from '../api/client.js';
import {
  fmtDate, priorityStyle, STATUS_LABELS, STATUS_STYLES, isOverdue,
} from '../utils/format.js';

/**
 * Một dòng công việc: ô tích hoàn thành, tiêu đề/thông tin, nhãn mức ưu tiên
 * & trạng thái, người phụ trách, tiến độ việc con, nút sửa/xóa/thêm Google Calendar.
 */
export default function TaskCard({ task, onChanged, onEdit, draggable, onDragStart }) {
  const [busy, setBusy] = useState(false);

  const toggleDone = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}`, {
        status: task.status === 'done' ? 'todo' : 'done',
      });
      onChanged?.(data);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Xóa việc "${task.title}"?`)) return;
    await api.delete(`/tasks/${task._id}`);
    onChanged?.(null, task._id);
  };

  const addToGoogleCalendar = async () => {
    try {
      const { data } = await api.get(`/calendar/google-link/${task._id}`);
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      alert(err.response?.data?.message || 'Không tạo được link lịch');
    }
  };

  const doneSubs = task.subtasks?.filter((s) => s.done).length || 0;
  const totalSubs = task.subtasks?.length || 0;
  const overdue = isOverdue(task);
  const prio = priorityStyle(task.priority);

  const iconBtn =
    'text-xs w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`group relative overflow-hidden bg-white rounded-2xl border border-slate-200/70 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-150 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${task.status === 'done' ? 'opacity-70' : ''}`}
    >
      {/* Thanh màu theo mức ưu tiên ở mép trái thẻ */}
      <span className={`absolute inset-y-0 left-0 w-1 ${prio.bar}`} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.status === 'done'}
          onChange={toggleDone}
          disabled={busy}
          className="task-check mt-0.5"
          title="Đánh dấu hoàn thành / mở lại"
        />
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-[15px] leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </div>
          {task.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${prio.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
              {prio.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
            {task.dueDate && (
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  overdue ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                📅 {fmtDate(task.dueDate)}{overdue ? ' · Quá hạn' : ''}
              </span>
            )}
            {task.assignee && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                👤 {task.assignee.name}
              </span>
            )}
            {task.project && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                📁 {task.project.name}
              </span>
            )}
            {totalSubs > 0 && (
              <span className="text-slate-500">☑ {doneSubs}/{totalSubs} việc con</span>
            )}
            {task.labels?.map((l) => (
              <span key={l} className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">#{l}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button onClick={onEdit} className={iconBtn} title="Sửa">
            ✏️
          </button>
          {task.dueDate && (
            <button onClick={addToGoogleCalendar} className={iconBtn} title="Thêm vào Google Calendar">
              🗓️
            </button>
          )}
          <button onClick={remove} className={`${iconBtn} hover:bg-rose-50 hover:border-rose-100`} title="Xóa">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
