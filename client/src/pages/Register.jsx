import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthBrand, authInputCls, authLabelCls } from './Login.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Đăng ký thất bại';
      setError(msg);
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Tạo tài khoản mới 🚀</h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-7">Bắt đầu sắp xếp công việc của bạn ngay hôm nay.</p>
          {error && <div className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">{error}</div>}
          <label className={authLabelCls}>Họ tên</label>
          <input className={authInputCls} value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" required />
          <label className={`${authLabelCls} mt-4`}>Email</label>
          <input type="email" className={authInputCls} value={form.email} onChange={set('email')} placeholder="ban@congty.com" required />
          <label className={`${authLabelCls} mt-4`}>Mật khẩu (tối thiểu 6 ký tự)</label>
          <input type="password" className={authInputCls} value={form.password} onChange={set('password')} placeholder="••••••••" required />
          <label className={`${authLabelCls} mt-4`}>
            Tổ chức / công ty <span className="text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <input className={authInputCls} value={form.organization} onChange={set('organization')} placeholder="Tên công ty hoặc nhóm của bạn" />
          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-200 disabled:opacity-50 transition"
          >
            {busy ? 'Đang tạo tài khoản…' : 'Đăng ký'}
          </button>
          <p className="text-sm text-slate-500 mt-5 text-center">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
