import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="shell">
      <div className="card">
        <div className="card-title">Cursor for Product Workflows</div>
        <p className="card-subtitle" style={{ marginTop: 6 }}>
          Upload customer interviews and tickets, then turn them into features
          and tasks in a single place. This is a simple MVP you can extend.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link to="/dashboard" className="btn btn-primary">
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

