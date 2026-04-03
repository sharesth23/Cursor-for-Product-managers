import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createProject,
  fetchLatestAnalysis,
  fetchProjects,
} from "../api.js";

function getStepsCompleted(projectId) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(`project-steps-${projectId}`) || "{}";
  try {
    const parsed = JSON.parse(raw);
    return Object.values(parsed).filter(Boolean).length;
  } catch {
    return 0;
  }
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisByProject, setAnalysisByProject] = useState({});
  const [name, setName] = useState("Onboarding discovery");
  const [description, setDescription] = useState(
    "Interviews + tickets around onboarding friction.",
  );
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const { companySlug } = useParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasVisited = window.localStorage.getItem("has-visited-dashboard");
      if (!hasVisited) {
        setShowWelcome(true);
        window.localStorage.setItem("has-visited-dashboard", "true");
      }
    }
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const list = await fetchProjects();
      setProjects(list);
      // Preload latest analysis per project for activity feed.
      const entries = await Promise.all(
        list.map(async (p) => {
          try {
            const a = await fetchLatestAnalysis(p.id);
            return [p.id, a];
          } catch {
            return [p.id, null];
          }
        }),
      );
      const map = {};
      for (const [id, value] of entries) {
        if (value) map[id] = value;
      }
      setAnalysisByProject(map);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const p = await createProject({ name, description });
    setProjects((prev) => [p, ...prev]);
    navigate(`/${companySlug}/projects/${p.id}`);
  }

  const lastOpenId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("last-open-project-id")
      : null;
  const lastProject =
    projects.find((p) => String(p.id) === String(lastOpenId)) || null;

  const activityItems = Object.entries(analysisByProject)
    .map(([projectId, a]) => ({
      project: projects.find((p) => String(p.id) === String(projectId)),
      analysis: a,
    }))
    .filter((x) => x.project && x.analysis)
    .sort(
      (a, b) =>
        new Date(b.analysis.last_run).getTime() -
        new Date(a.analysis.last_run).getTime(),
    )
    .slice(0, 5);

  return (
    <main className="shell">
      {showWelcome && (
        <div
          style={{
            marginBottom: 24,
            padding: 24,
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 8px 24px rgba(74, 158, 255, 0.25)",
            animation: "fadeIn 0.5s ease-out",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Welcome to Product App! 👋</h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.9 }}>
              Get started by creating a project and uploading your user research.
            </p>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.3)")}
            onMouseOut={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
          >
            Dismiss
          </button>
        </div>
      )}

      {lastProject && !showWelcome && (
        <div className="card" style={{ marginBottom: 24, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <div className="card-subtitle" style={{ fontSize: 12, marginBottom: 2 }}>Jump back in</div>
              <div className="card-title" style={{ fontSize: 16 }}>{lastProject.name}</div>
            </div>
          </div>
          <Link
            to={`/${companySlug}/projects/${lastProject.id}`}
            className="btn btn-primary"
            style={{ padding: "8px 16px" }}
          >
            Open workspace →
          </Link>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <div className="card-title">Projects</div>
          <p className="card-subtitle" style={{ marginTop: 6 }}>
            Group your evidence and analysis by problem area or product surface.
          </p>
          {loading ? (
            <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>Loading projects…</p>
          ) : projects.length === 0 ? (
            <div style={{ marginTop: 24, padding: 32, textAlign: "center", background: "var(--bg-elevated)", borderRadius: 8, border: "1px dashed var(--border)" }}>
               <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
               <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>No projects yet</div>
               <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Create your first one on the right.</div>
            </div>
          ) : (
            <ul className="list" style={{ marginTop: 16, gap: 12 }}>
              {projects.map((p) => {
                const stepsDone = getStepsCompleted(p.id);
                const totalSteps = 4;
                const pct = (stepsDone / totalSteps) * 100;
                return (
                  <li key={p.id} className="list-item" style={{ padding: 16 }}>
                    <Link to={`/${companySlug}/projects/${p.id}`} style={{ display: "block" }}>
                      <div className="row" style={{ alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div className="list-item-title" style={{ fontSize: 15 }}>{p.name}</div>
                          <div className="list-item-subtitle" style={{ marginTop: 4 }}>
                            {p.description || "No description"}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                           {timeAgo(p.createdAt)}
                        </div>
                      </div>
                      
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                           <div style={{ width: 8, height: 8, borderRadius: "50%", background: stepsDone === totalSteps ? "var(--priority-low)" : "var(--accent)" }} />
                           {stepsDone}/{totalSteps} steps
                        </div>
                        <div className="sidebar-progress" style={{ width: 120, margin: 0, height: 6, background: "var(--bg-base)" }}>
                          <div
                            className="sidebar-progress-bar"
                            style={{ width: `${pct}%`, background: stepsDone === totalSteps ? "var(--priority-low)" : "var(--accent)" }}
                          />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="columns">
          <div className="card">
            <div className="card-title">New workspace</div>
            <p className="card-subtitle" style={{ marginTop: 6 }}>
              Think &quot;onboarding&quot;, &quot;billing&quot;, or a specific
              product bet you&apos;re exploring.
            </p>
            <form
              onSubmit={handleCreate}
              style={{ marginTop: 16, display: "grid", gap: 12 }}
            >
              <label>
                <div className="field-label">Workspace Name</div>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                <div className="field-label">Description</div>
                <textarea
                  className="textarea"
                  style={{ minHeight: 100 }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <button className="btn btn-primary" type="submit" style={{ justifyContent: "center", marginTop: 4 }}>
                Create workspace
              </button>
            </form>
          </div>

          {activityItems.length > 0 && (
            <div className="card">
              <div className="card-title">Recent Activity</div>
              <ul className="list" style={{ marginTop: 16, gap: 12 }}>
                {activityItems.map(({ project, analysis }) => (
                  <li key={project.id} className="list-item" style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                       <div style={{ fontSize: 16, marginTop: 2 }}>⚡</div>
                       <div>
                         <div className="list-item-title">{project.name}</div>
                         <div className="list-item-subtitle" style={{ marginTop: 4 }}>
                           Analysis ran {timeAgo(analysis.last_run)} ·{" "}
                           <span style={{ color: "var(--text-primary)" }}>{analysis.features?.length || 0} features</span>
                         </div>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

