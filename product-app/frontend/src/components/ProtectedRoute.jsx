import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const roleHierarchy = {
  admin: 3,
  manager: 2,
  member: 1,
};

export default function ProtectedRoute({ children, minRole, requireSuperAdmin }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && user.role !== "super_admin") {
    return <Navigate to="/login" replace />;
  }

  if (minRole) {
    const userRoleValue = roleHierarchy[user.role] || 0;
    const requiredRoleValue = roleHierarchy[minRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      return <Navigate to={`/${user.company_slug}/dashboard`} replace />;
    }
  }

  return children;
}
