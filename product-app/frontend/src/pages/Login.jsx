import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchCompaniesList, login as apiLogin } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const QUOTES = [
  "“The most important thing is to understand what you're trying to solve before you start building.”",
  "“Great products are built with a deep understanding of the customer's problem.”",
  "“Discovery is not a phase. It's a continuous process.”",
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [result, setResult] = useState("");
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const list = await fetchCompaniesList();
        setCompanies(list);
        if (list.length > 0) setSelectedCompanyId(list[0].id);
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    }
    fetchCompanies();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const res = await apiLogin(email, password);
      // Ensure the user belongs to the selected company (client-side verification just for UX coherence)
      if (selectedCompanyId && res.companySlug !== companies.find(c => c.id === selectedCompanyId)?.slug) {
         // It's mostly visual since email is unique globally, but we can enforce it here
         throw new Error("User does not belong to the selected company workspace");
      }
      login(res.token);
    } catch (err) {
      setResult(err.message || err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* Left Panel - Mesh Gradient & Quotes */}
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
          <h2 style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.3, color: "#fff", marginBottom: 24, minHeight: 120, transition: "opacity 0.5s ease" }}>
            {QUOTES[quoteIdx]}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {QUOTES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 4,
                  borderRadius: 2,
                  background: i === quoteIdx ? "var(--accent)" : "rgba(255,255,255,0.2)",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div className="nav-logo-mark" style={{ margin: "0 auto 16px", width: 48, height: 48, borderRadius: 12 }} />
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Sign in to Product App</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label>
              <div className="field-label">Workspace</div>
              <select 
                className="input" 
                value={selectedCompanyId} 
                onChange={e => setSelectedCompanyId(e.target.value)}
                style={{ padding: "10px 14px", appearance: "auto" }}
                required
              >
                <option value="" disabled>Select your company workspace</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              <div className="field-label">Email</div>
              <input
                className="input"
                type="email"
                required
                style={{ padding: "10px 14px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              <div className="field-label">Password</div>
              <input
                className="input"
                type="password"
                required
                style={{ padding: "10px 14px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
               <a href="#" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>Forgot password?</a>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: "12px", justifyContent: "center", marginTop: 8 }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          {result && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(224, 30, 90, 0.1)", color: "var(--priority-high)", fontSize: 13, textAlign: "center" }}>
              {result}
            </div>
          )}
          
          <div style={{ marginTop: 32, textAlign: "center" }}>
             <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
               Don't have an account? <Link to="/signup" style={{ color: "var(--accent)" }}>Sign up</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
