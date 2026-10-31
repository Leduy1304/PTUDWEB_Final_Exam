import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Tổng quan', icon: '▦', end: true },
  { to: '/tasks', label: 'Việc của tôi', icon: '✓' },
  { to: '/projects', label: 'Dự án', icon: '▤' },
  { to: '/calendar', label: 'Lịch', icon: '📅' },
  { to: '/reminders', label: 'Nhắc việc', icon: '⏰' },
  { to: '/team', label: 'Nhóm', icon: '👥' },
];

function Logo({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 text-left" title="TaskFlow">
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-950/50 shrink-0">
        ⚡
      </span>
      <span className="text-xl font-bold text-white tracking-tight">TaskFlow</span>
    </button>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Chuyển trang xong thì tự đóng ngăn kéo (trên di động).
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  const navLinkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/40'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Thanh trên cùng — chỉ hiện trên màn hình nhỏ (< md) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-950 text-white shadow-md">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-lg leading-none transition shrink-0"
          aria-label="Mở menu"
          title="Mở menu"
        >
          ☰
        </button>
        <Logo onClick={() => navigate('/')} />
      </header>

      <div className="flex">
        {/* Lớp phủ sau ngăn kéo — chỉ di động */}
        {drawerOpen && (
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-40 md:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-300 flex flex-col h-screen transform transition-transform duration-200 ease-out ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          } md:sticky md:top-0 md:z-auto md:translate-x-0`}
        >
          <div className="px-6 pt-7 pb-6">
            <div className="flex items-start justify-between gap-2">
              <Logo
                onClick={() => {
                  setDrawerOpen(false);
                  navigate('/');
                }}
              />
              <button
                onClick={() => setDrawerOpen(false)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition shrink-0"
                aria-label="Đóng menu"
                title="Đóng menu"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Quản lý công việc, làm việc hiệu quả
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navLinkCls}>
                <span className="w-5 text-center text-base leading-none">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkCls}>
                <span className="w-5 text-center text-base leading-none">🛡️</span>
                Quản trị
              </NavLink>
            )}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-1">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {initial}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="mt-3.5 w-full text-sm px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-medium transition"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
