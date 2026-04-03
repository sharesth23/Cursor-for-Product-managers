import { Link, useLocation, useParams } from "react-router-dom";

// Sidebar tracks simple completion: a step is "done" once its page is visited.
function useStepProgress(projectId) {
  const storageKey = `project-steps-${projectId}`;
  const raw =
    (typeof window !== "undefined" && window.localStorage.getItem(storageKey)) ||
    "{}";
  let parsed = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  function markStep(step) {
    if (typeof window === "undefined") return;
    const next = { ...parsed, [step]: true };
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }
  return { completed: parsed, markStep };
}

export default function Sidebar({ projectName }) {
  const { companySlug, projectId } = useParams();
  const location = useLocation();

  if (!projectId || !companySlug) return null;

  const { completed } = useStepProgress(projectId);

  const steps = [
    {
      id: "overview",
      label: "Overview",
      href: `/${companySlug}/projects/${projectId}`,
      pathMatch: `/${companySlug}/projects/${projectId}`,
      exact: true,
    },
    {
      id: "upload",
      label: "Upload evidence",
      href: `/${companySlug}/projects/${projectId}/upload`,
      pathMatch: `/${companySlug}/projects/${projectId}/upload`,
    },
    {
      id: "analysis",
      label: "Analysis",
      href: `/${companySlug}/projects/${projectId}/analysis`,
      pathMatch: `/${companySlug}/projects/${projectId}/analysis`,
    },
    {
      id: "tasks",
      label: "Tasks",
      href: `/${companySlug}/projects/${projectId}/tasks`,
      pathMatch: `/${companySlug}/projects/${projectId}/tasks`,
    },
  ];

  const activePath = location.pathname;
  const totalCompleted = steps.filter((s) => completed[s.id]).length;
  const progressPct = (totalCompleted / steps.length) * 100;

  return (
    <nav
      style={{
        width: 260,
        borderRight: "1px solid var(--border)",
        paddingRight: 16,
        marginRight: 24,
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      {/* Workspace Header Block */}
      <div
        style={{
          padding: "16px",
          background: "var(--bg-surface)",
          borderRadius: 8,
          marginBottom: 24,
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {projectName ? projectName.charAt(0).toUpperCase() : "P"}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {projectName || "Untitled Project"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Workspace
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, paddingLeft: 12, color: "var(--text-muted)" }}>
        Workflow
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {steps.map((step) => {
          const isActive = step.exact
            ? activePath === step.pathMatch
            : activePath.startsWith(step.pathMatch);
          const done = completed[step.id] || false;
          return (
            <Link
              key={step.id}
              to={step.href}
              className={`sidebar-link ${
                isActive ? "sidebar-link-active" : ""
              }`}
            >
              <span className="sidebar-step-label">
                <span
                  className={`sidebar-step-dot ${
                    done ? "sidebar-step-dot-complete" : ""
                  }`}
                />
                {step.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="sidebar-progress" style={{ marginTop: 24 }}>
        <div
          className="sidebar-progress-bar"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </nav>
  );
}

