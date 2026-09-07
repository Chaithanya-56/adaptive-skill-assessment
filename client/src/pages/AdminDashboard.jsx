import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <div className="card dashboard-card">
        <p className="eyebrow">Admin dashboard</p>
        <h1>Welcome, {user?.name || 'admin'}.</h1>
        <p className="muted">Manage subjects, questions, and assessment content.</p>

        <div className="metric-grid">
          <div className="metric-box">
            <span className="metric-label">Assessment content</span>
            <strong>Configured</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Management area</span>
            <strong>Admin tools</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Next step</span>
            <strong>Review learners</strong>
          </div>
        </div>

        <div className="stack-row">
          <Link to="/admin/subjects" className="primary-button">Manage subjects</Link>
          <Link to="/admin/questions" className="secondary-button">Manage questions</Link>
        </div>
      </div>
    </div>
  );
}
