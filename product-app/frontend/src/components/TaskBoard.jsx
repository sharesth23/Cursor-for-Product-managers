export default function TaskBoard({ tasks }) {
  const columns = [
    { id: "todo", label: "To do" },
    { id: "doing", label: "In progress" },
    { id: "done", label: "Done" }
  ];

  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      {columns.map((col) => (
        <div key={col.id}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6
            }}
          >
            {col.label}
          </div>
          <ul className="list">
            {tasks
              .filter((t) => t.status === col.id)
              .map((t) => (
                <li key={t.id} className="list-item">
                  <div className="list-item-title">{t.title}</div>
                  <div className="list-item-subtitle">
                    Created {new Date(t.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

