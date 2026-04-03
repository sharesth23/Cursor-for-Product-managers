import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  
  if (!user) return null; // Or a public header, but we only show this in App-body

  const dshboardLink = user.role === "super_admin" ? "/super-admin/dashboard" : `/${user.company_slug}/dashboard`;

  return (
    <header className="nav">
      <div className="nav-logo">
        <div className="nav-logo-mark" />
        <span>Product App</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {user.role !== "super_admin" && (
           <span className="pill" style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 600 }}>{user.plan} PLAN</span>
        )}
        <Link to={dshboardLink} className="btn btn-ghost">
          Dashboard
        </Link>
        {user.role === "admin" && (
           <Link to="/admin" className="btn btn-ghost">Admin Settings</Link>
        )}
        <div style={{ paddingLeft: 16, borderLeft: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
           <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>{user.sub.substring(0, 8)}...</span>
           <button onClick={logout} className="btn btn-ghost" style={{ padding: "6px 10px" }}>Sign out</button>
        </div>
      </div>
    </header>
  );
}

