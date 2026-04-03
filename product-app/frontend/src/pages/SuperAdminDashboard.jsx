import { useEffect, useState } from "react";
import { fetchAllCompanies, createCompany, updateCompany, deleteCompany, fetchAuthLogs } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", owner_email: "", initial_admin_password: "", plan: "starter", max_employees: 5, is_active: true
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "companies") {
        const data = await fetchAllCompanies();
        setCompanies(data);
      } else {
        const data = await fetchAuthLogs();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setFormData({ name: "", owner_email: "", initial_admin_password: "", plan: "starter", max_employees: 5, is_active: true });
    setShowModal(true);
  }

  function openEditModal(company) {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      owner_email: company.owner_email,
      plan: company.plan || "starter",
      max_employees: company.max_employees || 5,
      is_active: company.is_active === 1
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCompany(editingId, formData);
      } else {
        await createCompany(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.error || err.message));
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure? This deletes ALL data for this company forever!")) return;
    try {
      await deleteCompany(id);
      loadData();
    } catch (err) {
      alert("Failed to delete company.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="nav-logo-mark" style={{ width: 24, height: 24, borderRadius: 6 }} />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>Super Admin HQ</h1>
        </div>
        <button className="btn" onClick={logout}>Sign out</button>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1024, margin: "0 auto", padding: "32px 16px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 32, borderBottom: "1px solid var(--border)", marginBottom: 32 }}>
          <button 
            style={{ padding: "8px 0", background: "none", border: "none", borderBottom: `2px solid ${activeTab === "companies" ? "var(--accent)" : "transparent"}`, color: activeTab === "companies" ? "var(--accent)" : "var(--text-muted)", fontWeight: 500, cursor: "pointer" }}
            onClick={() => setActiveTab("companies")}
          >
            Companies
          </button>
          <button 
            style={{ padding: "8px 0", background: "none", border: "none", borderBottom: `2px solid ${activeTab === "logs" ? "var(--accent)" : "transparent"}`, color: activeTab === "logs" ? "var(--accent)" : "var(--text-muted)", fontWeight: 500, cursor: "pointer" }}
            onClick={() => setActiveTab("logs")}
          >
            Audit Logs
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : activeTab === "companies" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>All Companies ({companies.length})</h2>
              <button className="btn btn-primary" onClick={openCreateModal}>+ New Company</button>
            </div>
            
            <div className="card" style={{ overflow: "hidden" }}>
              <table style={{ minWidth: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Plan</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Seats Used</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{c.name}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>{c.slug}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                         <span style={{ textTransform: "capitalize", padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 12, fontSize: 12 }}>{c.plan}</span>
                      </td>
                      <td style={{ padding: "16px" }}>{c.employee_count} / {c.max_employees}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          display: "inline-block", padding: "4px 8px", borderRadius: 12, fontSize: 12,
                          background: c.is_active ? "rgba(16, 185, 129, 0.1)" : "rgba(224, 30, 90, 0.1)",
                          color: c.is_active ? "#10b981" : "var(--danger)"
                        }}>
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                         <button className="btn" style={{ padding: "6px 12px", marginRight: 8 }} onClick={() => openEditModal(c)}>Edit</button>
                         <button className="btn" style={{ padding: "6px 12px", color: "var(--danger)" }} onClick={() => handleDelete(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                     <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No companies found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
             <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>System Audit Logs</h2>
             <div className="card" style={{ overflow: "hidden" }}>
              <table style={{ minWidth: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Time</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Company</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>User Email</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>Action</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500 }}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>{new Date(l.created_at).toLocaleString()}</td>
                      <td style={{ padding: "12px 16px" }}>{l.company_name || l.company_id}</td>
                      <td style={{ padding: "12px 16px" }}>{l.employee_email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          padding: "2px 6px", borderRadius: 4, fontSize: 12,
                          background: l.action.includes("success") ? "rgba(16, 185, 129, 0.1)" : 
                                      l.action.includes("failed") ? "rgba(224, 30, 90, 0.1)" : "rgba(255,255,255,0.05)",
                          color: l.action.includes("success") ? "#10b981" : 
                                 l.action.includes("failed") ? "var(--danger)" : "var(--text-primary)"
                        }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>{l.ip_address}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                     <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No logs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)} />
          <div className="card" style={{ position: "relative", width: 500, padding: 32, animation: "fadeInUp 0.3s ease" }}>
             <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>{editingId ? "Edit Company" : "New Company"}</h2>
             <form onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
               <div>
                 <label className="field-label">Company Name</label>
                 <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!!editingId} />
               </div>
               
               {!editingId && (
                 <>
                   <div>
                     <label className="field-label">Admin Email</label>
                     <input className="input" type="email" required value={formData.owner_email} onChange={e => setFormData({...formData, owner_email: e.target.value})} />
                   </div>
                   <div>
                     <label className="field-label">Admin Initial Password</label>
                     <input className="input" required value={formData.initial_admin_password} onChange={e => setFormData({...formData, initial_admin_password: e.target.value})} />
                   </div>
                 </>
               )}
               
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                 <div>
                   <label className="field-label">Plan</label>
                   <select className="input" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} style={{ appearance: "auto" }}>
                     <option value="starter">Starter</option>
                     <option value="pro">Pro</option>
                     <option value="enterprise">Enterprise</option>
                   </select>
                 </div>
                 <div>
                   <label className="field-label">Max Seats</label>
                   <input className="input" type="number" min={1} required value={formData.max_employees} onChange={e => setFormData({...formData, max_employees: parseInt(e.target.value)})} />
                 </div>
               </div>

               {editingId && (
                 <div>
                   <label className="field-label">
                     <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} style={{ marginRight: 8 }} />
                     Company Active
                   </label>
                 </div>
               )}

               <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                 <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                 <button type="submit" className="btn btn-primary">{editingId ? "Save Changes" : "Create Company"}</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
