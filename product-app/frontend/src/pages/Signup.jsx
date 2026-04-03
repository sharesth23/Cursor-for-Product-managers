import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [companyName, setCompanyName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token } = await signup({ companyName, userName, email, password });
      login(token);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* Left Panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          padding: 48,
          flexDirection: "column",
          justifyContent: "space-between",
          background: `
            radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)
          `,
          backgroundColor: "#111827",
        }}
        className="login-left-panel hide-on-mobile"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="nav-logo-mark" />
          <span style={{ fontWeight: 600, fontSize: 18, color: "#fff" }}>Product App</span>
        </div>
        <div style={{ maxWidth: 480, marginBottom: 64 }}>
          <h2 style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.3, color: "#fff", marginBottom: 24 }}>
            "The best way to manage companies."
          </h2>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Create an account</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
             Get started with your company workspace.
          </p>

          {error && <div className="toast" style={{ background: "var(--danger)", marginBottom: 16, position: "relative", bottom: 0, transform: "none" }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label className="field-label">Company Name</label>
              <input className="input" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Your Name</label>
              <input className="input" required value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Work Email</label>
              <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Creating..." : "Sign up"}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, textAlign: "center", color: "var(--text-muted)" }}>
             Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
