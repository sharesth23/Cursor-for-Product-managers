import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { fetchProject, fetchUploads } from "../api.js";
import Sidebar from "../components/Sidebar.jsx";

export default function Project() {
  const { companySlug, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

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
      const files = await fetchUploads(projectId);
      setProject(p);
      setUploads(files);
      setError(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(true);
      } else {
        // Handled silently or trigger toast if desired
        console.error(err);
      }
    }
  }

  if (!projectId) return null;

  if (error) {
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

  return (
    <main className="shell">
      <div style={{ display: "flex" }}>
        <Sidebar projectName={project?.name} />
        <div style={{ flex: 1 }}>
          <div className="card">
            {project ? (
              <>
                <div className="card-title">{project.name}</div>
                <p className="card-subtitle" style={{ marginTop: 6 }}>
                  {project.description || "No description yet."}
                </p>
                <div
                  style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 8,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>Evidence files</div>
                      <div style={{ color: "var(--text-muted)" }}>
                        {uploads.length === 0 ? "No files uploaded yet." : `${uploads.length} files attached.`}
                      </div>
                    </div>
                    {uploads.length === 0 ? (
                      <Link to={`/${companySlug}/projects/${projectId}/upload`} className="btn btn-primary">Upload evidence</Link>
                    ) : (
                      <Link to={`/${companySlug}/projects/${projectId}/upload`} className="btn btn-ghost" style={{ border: "1px solid var(--border)" }}>Manage files</Link>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p>Loading project…</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

