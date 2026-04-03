import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { createTask, fetchProject, fetchTasks } from "../api.js";
import Sidebar from "../components/Sidebar.jsx";
import TaskBoard from "../components/TaskBoard.jsx";

export default function Tasks() {
  const { companySlug, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("Clarify onboarding success metric");
  const [busy, setBusy] = useState(false);
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
      const list = await fetchTasks(projectId);
      setProject(p);
      setTasks(list);
      setError(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(true);
      }
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    setBusy(true);
    try {
      const t = await createTask(projectId, { title, status: "todo" });
      setTasks((prev) => [t, ...prev]);
      setTitle("");
    } finally {
      setBusy(false);
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
        <div style={{ flex: 1, display: "grid", gap: 14 }}>
          <div className="card">
            <div className="card-title">Tasks</div>
            <p className="card-subtitle" style={{ marginTop: 6 }}>
              Turn your analysis into concrete work. This is a lightweight board
              for now.
            </p>
            {project && (
              <p style={{ marginTop: 10, fontSize: 13, color: "#9ca3af" }}>
                Project: {project.name}
              </p>
            )}
            <form
              onSubmit={handleCreate}
              style={{ marginTop: 12, display: "flex", gap: 8 }}
            >
              <input
                className="input"
                placeholder="New task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={busy || !title.trim()}
              >
                Add
              </button>
            </form>
          </div>
          <TaskBoard tasks={tasks} />
        </div>
      </div>
    </main>
  );
}

