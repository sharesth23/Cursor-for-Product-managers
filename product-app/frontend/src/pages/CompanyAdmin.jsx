import { useEffect, useState } from "react";
import { fetchEmployees, createEmployee, updateEmployee, updateEmployeeStatus } from "../api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function CompanyAdmin() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ seatsUsed: 0, maxSeats: 0 });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", email: "", role: "member", password: ""
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "employees") {
        const data = await fetchEmployees();
        setEmployees(data.employees);
        setStats({ seatsUsed: data.seatsUsed, maxSeats: data.maxSeats });
      } else {
        // Future settings fetch
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setFormData({ name: "", email: "", role: "member", password: Math.random().toString(36).slice(-10) });
    setShowModal(true);
  }

  function openEditModal(emp) {
    setEditingId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      password: ""
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateEmployee(editingId, { name: formData.name, role: formData.role });
      } else {
        await createEmployee(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.error || err.message));
    }
  }

  async function handleToggleStatus(emp) {
    try {
      await updateEmployeeStatus(emp.id, !emp.is_active);
      loadData();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    }
  }

  const seatPercentage = stats.maxSeats > 0 ? (stats.seatsUsed / stats.maxSeats) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="nav-logo-mark" style={{ width: 24, height: 24, borderRadius: 6 }} />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>{user?.company_slug} Admin</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to={`/${user?.company_slug}/dashboard`} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14 }}>Back to App</Link>
          <button className="btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        
        {/* Seat Usage Widget */}
        <div className="card" style={{ padding: 24, marginBottom: 32, display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", marginBottom: 8 }}>Seat Usage</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{stats.seatsUsed} <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 400 }}>/ {stats.maxSeats} active users</span></div>
              <div style={{ fontSize: 13, color: seatPercentage >= 100 ? "var(--danger)" : "var(--accent)" }}>
                {seatPercentage >= 100 ? "Limit reached" : `${stats.maxSeats - stats.seatsUsed} seats available`}
              </div>
            </div>
            <div style={{ width: "100%", height: 8, background: "var(--bg-base)", borderRadius: 4, overflow: "hidden" }}>
               <div style={{ height: "100%", width: `${Math.min(seatPercentage, 100)}%`, background: seatPercentage >= 100 ? "var(--danger)" : "var(--accent)", transition: "width 0.5s ease" }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal} disabled={stats.seatsUsed >= stats.maxSeats}>+ Invite User</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 32, borderBottom: "1px solid var(--border)", marginBottom: 32 }}>
          <button 
            style={{ padding: "8px 0", background: "none", border: "none", borderBottom: `2px solid ${activeTab === "employees" ? "var(--accent)" : "transparent"}`, color: activeTab === "employees" ? "var(--accent)" : "var(--text-muted)", fontWeight: 500, cursor: "pointer" }}
            onClick={() => setActiveTab("employees")}
          >
            Team Members
          </button>
          <button 
            style={{ padding: "8px 0", background: "none", border: "none", borderBottom: `2px solid ${activeTab === "settings" ? "var(--accent)" : "transparent"}`, color: activeTab === "settings" ? "var(--accent)" : "var(--text-muted)", fontWeight: 500, cursor: "pointer" }}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : activeTab === "employees" ? (
          <div>
            <div className="card" style={{ overflow: "hidden" }}>
              <table style={{ minWidth: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>User</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Role</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{emp.name} {emp.id === user.sub && "(You)"}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>{emp.email}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                         <span style={{ textTransform: "capitalize", padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 12, fontSize: 12 }}>{emp.role}</span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          display: "inline-block", padding: "4px 8px", borderRadius: 12, fontSize: 12,
                          background: emp.is_active ? "rgba(16, 185, 129, 0.1)" : "rgba(224, 30, 90, 0.1)",
                          color: emp.is_active ? "#10b981" : "var(--danger)"
                        }}>
                          {emp.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                         <button className="btn" style={{ padding: "6px 12px" }} onClick={() => openEditModal(emp)}>Edit</button>
                         {emp.id !== user.sub && (
                            <button className="btn" style={{ padding: "6px 12px", color: emp.is_active ? "var(--danger)" : "#10b981" }} onClick={() => handleToggleStatus(emp)}>
                              {emp.is_active ? "Deactivate" : "Activate"}
                            </button>
                         )}
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                     <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No team members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
             Settings coming soon...
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)} />
          <div className="card" style={{ position: "relative", width: 400, padding: 32, animation: "fadeInUp 0.3s ease" }}>
             <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>{editingId ? "Edit User" : "Invite User"}</h2>
             <form onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
               <div>
                 <label className="field-label">Name</label>
                 <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               
               <div>
                 <label className="field-label">Email</label>
                 <input className="input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editingId} />
               </div>
               
               <div>
                 <label className="field-label">Role</label>
                 <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ appearance: "auto" }}>
                   <option value="member">Member</option>
                   <option value="manager">Manager</option>
                   <option value="admin">Admin</option>
                 </select>
               </div>

               {!editingId && (
                 <div>
                   <label className="field-label">Temporary Password</label>
                   <div style={{ display: "flex", gap: 8 }}>
                     <input className="input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                     <button type="button" className="btn" onClick={() => setFormData({...formData, password: Math.random().toString(36).slice(-10)})}>Regen</button>
                   </div>
                   <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Copy this password and securely share it with the user.</p>
                 </div>
               )}

               <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                 <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                 <button type="submit" className="btn btn-primary">{editingId ? "Save Changes" : "Send Invite"}</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
