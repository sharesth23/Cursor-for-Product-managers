import { useState } from "react";
import { chatWithAnalysis } from "../api.js";

export default function AIChat({ projectId, initialSummary }) {
  const [messages, setMessages] = useState(() => {
    if (!initialSummary) return [];
    return [
      {
        id: "initial",
        role: "assistant",
        content: initialSummary
      }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !projectId || loading) return;

    const nextHistory = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text }
    ];

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text }
    ]);
    setInput("");
    setLoading(true);
    try {
      const res = await chatWithAnalysis(projectId, text, nextHistory);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.reply
        }
      ]);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        "Chat failed. Make sure analysis has been run.";
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: msg }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function addQuickPrompt(text) {
    setInput(text);
  }

  const isInputEmpty = !input.trim();

  return (
    <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--priority-low)",
              boxShadow: "0 0 0 4px rgba(46, 182, 125, 0.2)",
              animation: "pulse 2s ease-in-out infinite"
            }}
          />
          <div className="card-title" style={{ fontSize: 16 }}>Ask Prōduct</div>
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginBottom: 16
        }}
      >
        Ask about the analysis, why features are prioritized, or help turning
        them into tickets.
      </div>

      <div
        style={{
          flex: 1,
          borderRadius: 12,
          padding: 12,
          overflowY: "auto",
          marginBottom: 12,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 24
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.8 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
              No conversation yet
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 220 }}>
              Run analysis, then ask questions like "Why is the top feature important?".
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent:
                  m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 12
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: 16,
                  borderBottomRightRadius: m.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 16,
                  fontSize: 14,
                  lineHeight: 1.5,
                  background:
                    m.role === "user"
                      ? "var(--accent)"
                      : "var(--bg-surface)",
                  color:
                    m.role === "user"
                      ? "#fff"
                      : "var(--text-primary)",
                  border:
                    m.role === "user"
                      ? "none"
                      : "1px solid var(--border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
              >
                {m.role === "assistant" && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 6,
                      color: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    Prōduct
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--text-muted)",
              marginTop: 8,
              padding: "10px 14px",
              background: "var(--bg-surface)",
              borderRadius: 16,
              borderBottomLeftRadius: 4,
              width: "fit-content",
              border: "1px solid var(--border)"
            }}
          >
            <span>Thinking</span>
            <span className="skeleton-line" style={{ width: 40, margin: 0, height: 6 }} />
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12
        }}
      >
        <button
          type="button"
          onClick={() => addQuickPrompt("Why is Feature 1 top priority?")}
          style={{
            background: "transparent",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 999,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "var(--accent-muted)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          Why is Feature 1 top priority?
        </button>
        <button
          type="button"
          onClick={() =>
            addQuickPrompt("Write a Jira ticket for the first task.")
          }
           style={{
            background: "transparent",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 999,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "var(--accent-muted)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          Write Jira ticket for first task
        </button>
        <button
          type="button"
          onClick={() =>
            addQuickPrompt("What did users complain about most?")
          }
           style={{
            background: "transparent",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 999,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "var(--accent-muted)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "transparent";
          }}
        >
          What did users complain about most?
        </button>
      </div>

      <form
        onSubmit={handleSend}
        style={{ display: "flex", gap: 8, marginTop: "auto", position: "relative" }}
      >
        <input
          className="input"
          placeholder="Ask about this analysis..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ paddingRight: 48, borderRadius: 24 }}
        />
        <button
          type="submit"
          disabled={loading || isInputEmpty}
          style={{
            position: "absolute",
            right: 4,
            top: 4,
            bottom: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isInputEmpty ? "transparent" : "var(--accent)",
            color: isInputEmpty ? "var(--text-muted)" : "#fff",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: isInputEmpty || loading ? "default" : "pointer",
            transition: "all 0.2s ease",
            padding: 0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}

