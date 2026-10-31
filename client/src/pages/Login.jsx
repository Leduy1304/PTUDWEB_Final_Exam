import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function AuthBrand() {
  return (
    <div className="hidden md:flex flex-col justify-between w-[42%] shrink-0 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 text-white p-10 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="relative flex items-center gap-2.5">
        <span className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-xl">⚡</span>
        <span className="text-2xl font-bold tracking-tight">TaskFlow</span>
      </div>
      <div className="relative">
        <h2 className="text-3xl font-bold leading-snug">
          Quản lý công việc,
          <br />
          làm việc hiệu quả hơn mỗi ngày.
        </h2>
        <p className="text-indigo-200 mt-4 leading-relaxed text-[15px]">
          Danh sách việc cần làm, bảng dự án kéo thả, nhắc việc đúng hạn và cộng tác
          cùng nhóm — tất cả trong một nơi.
        </p>
        <ul className="mt-6 space-y-2.5 text-sm text-indigo-100">
          <li>✓ Bảng Kanban kéo thả trực quan</li>
          <li>✓ Nhắc việc &amp; đồng bộ lịch (.ics, Google Calendar)</li>
          <li>✓ Giao việc cho thành viên trong nhóm</li>
        </ul>
      </div>
      <div className="relative text-xs text-indigo-300">TaskFlow — gọn gàng, tập trung, đúng hạn.</div>
    </div>
  );
}

export const authInputCls =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';
export const authLabelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AuthBrand />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <form onSubmit={submit} className="w-full max-w-sm fade-up">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">⚡</span>
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Chào mừng trở lại 👋</h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-7">Đăng nhập để tiếp tục quản lý công việc của bạn.</p>
          {error && <div className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">{error}</div>}
          <label className={authLabelCls}>Email</label>
          <input type="email" className={authInputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@congty.com" required />
          <label className={`${authLabelCls} mt-4`}>Mật khẩu</label>
          <input type="password" className={authInputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-200 disabled:opacity-50 transition"
          >
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
          <p className="text-sm text-slate-500 mt-5 text-center">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
