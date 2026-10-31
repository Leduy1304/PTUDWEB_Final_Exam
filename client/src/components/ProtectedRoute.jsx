import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Khu vực quản trị chỉ dành cho admin — người dùng thường quay về Tổng quan.
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
