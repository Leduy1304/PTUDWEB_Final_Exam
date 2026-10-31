/** Các hàm định dạng ngày tháng & nhãn dùng chung (tiếng Việt, locale vi-VN). */

export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** 'YYYY-MM-DDTHH:mm' cho <input type="datetime-local"> */
export function toDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isOverdue(task) {
  return task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();
}

/**
 * Nguồn sự thật duy nhất cho màu sắc mức ưu tiên — dùng ở MỌI nơi hiển thị
 * một công việc (thẻ việc, lịch, tổng quan, kanban, quản trị, modal):
 *   Cao        → đỏ/hồng (rose)
 *   Trung bình → hổ phách/vàng (amber)
 *   Thấp       → xám xanh (slate)
 *   badge — nhãn dạng viên thuốc (nền nhạt + chữ + viền)
 *   dot   — chấm tròn nhỏ đi kèm nhãn
 *   bar   — thanh/màu nhấn đặc (thanh dọc, vạch màu)
 *   chip  — ô nhỏ trên lịch (màu đậm hơn badge một chút để dễ đọc ở cỡ nhỏ)
 *   select — màu viền + chữ cho ô <select> trong modal khi chọn mức này
 */
export const PRIORITY_STYLES = {
  high: {
    label: 'Cao',
    badge: 'bg-rose-50 text-rose-600 border border-rose-200',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-700',
    select: 'border-rose-300 text-rose-600',
  },
  medium: {
    label: 'Trung bình',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800',
    select: 'border-amber-300 text-amber-600',
  },
  low: {
    label: 'Thấp',
    badge: 'bg-slate-50 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
    chip: 'bg-slate-200 text-slate-600',
    select: 'border-slate-300 text-slate-600',
  },
};

/** Lấy style ưu tiên, mặc định về "Trung bình" nếu giá trị lạ/thiếu. */
export function priorityStyle(priority) {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
}

// Giữ lại 2 map phẳng này (suy ra từ PRIORITY_STYLES) cho các chỗ chỉ cần
// nhãn hoặc chấm màu — không khai báo màu ở nơi khác nữa.
export const PRIORITY_LABELS = {
  low: PRIORITY_STYLES.low.label,
  medium: PRIORITY_STYLES.medium.label,
  high: PRIORITY_STYLES.high.label,
};

export const PRIORITY_DOT = {
  low: PRIORITY_STYLES.low.dot,
  medium: PRIORITY_STYLES.medium.dot,
  high: PRIORITY_STYLES.high.dot,
};

export const STATUS_LABELS = {
  todo: 'Cần làm',
  'in-progress': 'Đang làm',
  done: 'Hoàn thành',
};

export const STATUS_STYLES = {
  todo: 'bg-sky-100 text-sky-700',
  'in-progress': 'bg-violet-100 text-violet-700',
  done: 'bg-emerald-100 text-emerald-700',
};
