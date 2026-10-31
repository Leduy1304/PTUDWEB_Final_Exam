import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/client.js';
import { toDateTimeLocal, priorityStyle } from '../utils/format.js';

/**
 * Form dạng hộp thoại để tạo mới hoặc sửa một công việc.
 * Props:
 *   task      — việc cần sửa (hoặc null nếu tạo mới)
 *   projects  — danh sách dự án để chọn
 *   members   — người dùng có thể giao việc (dùng trong trang chi tiết dự án)
 *   fixedProject — nếu có, ẩn ô chọn dự án và khóa theo dự án này
 *   onClose, onSaved
 */
export default function TaskModal({ task, projects = [], members = [], fixedProject = null, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    project: '',
    assignee: '',
    labels: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: toDateTimeLocal(task.dueDate),
        project: task.project?._id || task.project || '',
        assignee: task.assignee?._id || task.assignee || '',
        labels: (task.labels || []).join(', '),
      });
    } else if (fixedProject) {
      setForm((f) => ({ ...f, project: fixedProject }));
    }
  }, [task, fixedProject]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        project: form.project || null,
        assignee: form.assignee || null,
        labels: form.labels.split(',').map((s) => s.trim()).filter(Boolean),
      };
      let data;
      if (task) {
        ({ data } = await api.patch(`/tasks/${task._id}`, payload));
      } else {
        ({ data } = await api.post('/tasks', payload));
      }
      onSaved(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không lưu được công việc');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

  // Render qua portal ra thẳng <body> để tránh bị ảnh hưởng bởi transform
  // của các phần tử cha (animation fade-up) — nếu không, lớp phủ "fixed"
  // sẽ căn theo trang thay vì màn hình và hộp thoại bị lệch lên trên.
  return createPortal(
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="pop-in bg-white rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-7 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-800">{task ? 'Sửa công việc' : 'Thêm việc mới'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
            title="Đóng"
          >
            ✕
          </button>
        </div>
        {error && <div className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">{error}</div>}

        <label className={labelCls}>Tiêu đề *</label>
        <input className={inputCls} value={form.title} onChange={set('title')} placeholder="Nhập tên công việc…" required />

        <label className={`${labelCls} mt-4`}>Mô tả</label>
        <textarea className={inputCls} rows={3} value={form.description} onChange={set('description')} placeholder="Mô tả chi tiết (không bắt buộc)…" />

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 mt-4">
          <div>
            <label className={labelCls}>Trạng thái</label>
            <select className={inputCls} value={form.status} onChange={set('status')}>
              <option value="todo">Cần làm</option>
              <option value="in-progress">Đang làm</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Mức ưu tiên</label>
            <select
              className={`${inputCls} font-semibold ${priorityStyle(form.priority).select}`}
              value={form.priority}
              onChange={set('priority')}
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
        </div>

        <label className={`${labelCls} mt-4`}>Hạn chót</label>
        <input type="datetime-local" className={inputCls} value={form.dueDate} onChange={set('dueDate')} />

        {!fixedProject && (
          <>
            <label className={`${labelCls} mt-4`}>Dự án</label>
            <select className={inputCls} value={form.project} onChange={set('project')}>
              <option value="">Không thuộc dự án (cá nhân)</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </>
        )}

        {(members.length > 0 || form.assignee) && (
          <>
            <label className={`${labelCls} mt-4`}>Người phụ trách</label>
            <select className={inputCls} value={form.assignee} onChange={set('assignee')}>
              <option value="">Chưa giao cho ai</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </>
        )}

        <label className={`${labelCls} mt-4`}>Nhãn (cách nhau bằng dấu phẩy)</label>
        <input className={inputCls} value={form.labels} onChange={set('labels')} placeholder="cong-viec, khan-cap" />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium transition">
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 disabled:opacity-50 transition"
          >
            {saving ? 'Đang lưu…' : task ? 'Lưu thay đổi' : 'Tạo công việc'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
