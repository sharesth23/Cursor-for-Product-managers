import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProject, fetchUploads, uploadFile } from "../api.js";
import Sidebar from "../components/Sidebar.jsx";
import FileUploader from "../components/FileUploader.jsx";

export default function Upload() {
  const { companySlug, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);

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
      }
    }
  }

  async function handleSelect(file) {
    if (!file || !projectId) return;
    setUploading(true);
    try {
      await uploadFile(projectId, file, "evidence");
      await load();
    } finally {
      setUploading(false);
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
            <div className="card-title">Upload evidence</div>
            <p className="card-subtitle" style={{ marginTop: 6 }}>
              Drop interviews, tickets, or notes. In a full version, an AI
              worker would read these and propose features and tasks.
            </p>
            <div style={{ marginTop: 16 }}>
              <FileUploader onSelect={handleSelect} />
            </div>
            {uploading && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--accent-muted)", color: "var(--accent)", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="skeleton-line" style={{ width: 16, height: 16, borderRadius: "50%", margin: 0 }} /> Uploading file...
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <div className="field-label" style={{ marginBottom: 12, fontSize: 13 }}>
                Project files
              </div>
              {uploads.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", background: "var(--bg-elevated)", borderRadius: 8, border: "1px dashed var(--border)"}}>
                   <div style={{ fontSize: 24, marginBottom: 8 }}>🗂️</div>
                   <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No files uploaded yet.</div>
                </div>
              ) : (
                <ul className="list">
                  {uploads.map((u) => (
                    <li key={u.id} className="list-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                      <div>
                        <div className="list-item-title" style={{ fontSize: 14 }}>{u.filename}</div>
                        <div className="list-item-subtitle" style={{ marginTop: 4 }}>
                          {Math.round(u.size / 1024)} KB 
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                         {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

