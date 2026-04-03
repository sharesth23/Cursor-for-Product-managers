import { useState } from "react";

export default function FeatureCard({ feature, onCreateTasks }) {
  const [showUi, setShowUi] = useState(false);
  const [showData, setShowData] = useState(false);

  const priorityLabel =
    feature.priority === "high"
      ? "High"
      : feature.priority === "low"
        ? "Low"
        : "Medium";

  const priorityColor =
    feature.priority === "high"
      ? "var(--priority-high)"
      : feature.priority === "low"
        ? "var(--priority-low)"
        : "var(--priority-medium)";

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10
        }}
      >
        <div>
          <div className="card-title">{feature.title}</div>
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "var(--text-muted)"
            }}
          >
            {feature.why}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            className="tag"
            style={{ borderColor: priorityColor, color: priorityColor }}
          >
            Priority: {priorityLabel}
          </span>
          <span className="tag">Effort: {feature.effort}</span>
        </div>
      </div>

      {feature.customer_quotes?.length ? (
        <div
          style={{
            marginTop: 10,
            borderLeft: `3px solid var(--accent)`,
            paddingLeft: 10,
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--text-muted)"
          }}
        >
          {feature.customer_quotes.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              “{q}”
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop: 10, fontSize: 13 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowUi((v) => !v)}
        >
          {showUi ? "▼" : "▶"} Proposed UI changes
        </button>
        {showUi && (
          <p
            style={{
              marginTop: 6,
              color: "var(--text-muted)"
            }}
          >
            {feature.ui_changes}
          </p>
        )}
      </div>

      <div style={{ marginTop: 6, fontSize: 13 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowData((v) => !v)}
        >
          {showData ? "▼" : "▶"} Data model changes
        </button>
        {showData && (
          <p
            style={{
              marginTop: 6,
              color: "var(--text-muted)"
            }}
          >
            {feature.data_model_changes}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 12
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onCreateTasks?.(feature)}
        >
          Create tasks →
        </button>
      </div>
    </div>
  );
}

