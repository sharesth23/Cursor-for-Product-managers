import { useState } from "react";
import { superAdminLogin } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await superAdminLogin(email, password);
      login(token);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div className="card" style={{ width: 400, padding: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, textAlign: "center" }}>Super Admin</h1>
        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div>
             <label className="field-label">Email</label>
             <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
             <label className="field-label">Password</label>
             <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
