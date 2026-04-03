import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchAnalysisSummary,
  fetchProject,
  runAnalysis
} from "../api.js";
import Sidebar from "../components/Sidebar.jsx";
import FeatureCard from "../components/FeatureCard.jsx";
import AIChat from "../components/AIChat.jsx";

export default function Analysis() {
  const { companySlug, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState(false);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!projectId) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("last-open-project-id", String(projectId));
    }
    void load();
  }, [projectId]);

  async function load() {
    try {
      const p = await fetchProject(projectId);
      const s = await fetchAnalysisSummary(projectId);
      setProject(p);
      setSummary(s?.summary || "");
      setPageError(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setPageError(true);
      } else {
        setError(
          err?.response?.data?.error || "Failed to load analysis summary.",
        );
      }
    }
  }

  function showToast(msg) {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? "" : prev));
    }, 2500);
  }

  async function handleRunAnalysis() {
    if (!projectId) return;
    setRunning(true);
    setError("");
    try {
      const result = await runAnalysis(projectId);
      setAnalysis(result);
      setSummary(result.summary);
      showToast(
        `Analysis complete — ${result.features?.length || 0} features identified`,
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Analysis failed. Make sure you have at least one upload.",
      );
    } finally {
      setRunning(false);
    }
  }

  if (!projectId) return null;

  if (pageError) {
    return (
      <main className="shell">
        <div style={{ textAlign: "center", padding: 64 }}>
           <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
           <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Project not found</h2>
           <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>The project you're looking for doesn't exist or you don't have access.</p>
           <Link to={`/${companySlug}/dashboard`} className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </main>
    )
  }

  const lastRunLabel = analysis?.last_run
    ? new Date(analysis.last_run).toLocaleTimeString()
    : null;

  const hasAnalysis = !!analysis?.features?.length;

  return (
    <main className="shell">
      <div style={{ display: "flex" }}>
        <Sidebar projectName={project?.name} />
        <div style={{ flex: 1 }}>
          {error && (
            <div
              style={{
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 10,
                background: "#3f1d20",
                border: "1px solid #f85149",
                fontSize: 13
              }}
            >
              <span>{error}</span>{" "}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleRunAnalysis}
              >
                Retry
              </button>
            </div>
          )}

          <div
            className="grid"
            style={{ alignItems: "flex-start", marginTop: 0 }}
          >
            <div>
              <div className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 6,
                          background:
                            "conic-gradient(from 200deg,#4f46e5,#8b5cf6,#ec4899,#f97316,#22c55e,#4f46e5)"
                        }}
                      />
                      <div className="card-title">AI analysis</div>
                    </div>
                    <p
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "var(--text-muted)"
                      }}
                    >
                      {project
                        ? `Project: ${project.name}`
                        : "Run analysis on this project."}
                    </p>
                    <p
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: "var(--text-muted)"
                      }}
                    >
                      {lastRunLabel
                        ? `Last run: ${lastRunLabel}`
                        : "No analysis yet."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRunAnalysis}
                    disabled={running}
                  >
                    {running ? "Analyzing…" : hasAnalysis ? "Re-run analysis" : "Run analysis"}
                  </button>
                </div>

                {!hasAnalysis && !running && (
                  <div
                    style={{
                      marginTop: 18,
                      textAlign: "center",
                      padding: 20
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      No analysis yet
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: "var(--text-muted)"
                      }}
                    >
                      Upload at least one file for this project, then click
                      &quot;Run analysis&quot;.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: 12 }}
                      onClick={handleRunAnalysis}
                    >
                      → Run first analysis
                    </button>
                  </div>
                )}

                {running && (
                  <div style={{ marginTop: 14 }}>
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="skeleton-card">
                        <div
                          className="skeleton-line"
                          style={{ width: "40%" }}
                        />
                        <div
                          className="skeleton-line"
                          style={{ width: "70%" }}
                        />
                        <div
                          className="skeleton-line"
                          style={{ width: "60%" }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {hasAnalysis && !running && (
                  <div style={{ marginTop: 10 }}>
                    {analysis.features.map((f) => (
                      <FeatureCard
                        key={f.title}
                        feature={f}
                        onCreateTasks={() =>
                          showToast("This would create tasks from the feature.")
                        }
                      />
                    ))}

                    <div
                      style={{
                        marginTop: 16,
                        borderRadius: 14,
                        border: "1px solid var(--accent)",
                        background: "var(--accent-muted)",
                        padding: 10,
                        fontSize: 13
                      }}
                    >
                      <strong>⚡ Recommended next:</strong>{" "}
                      {analysis.recommended_next}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AIChat projectId={projectId} initialSummary={summary} />
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

