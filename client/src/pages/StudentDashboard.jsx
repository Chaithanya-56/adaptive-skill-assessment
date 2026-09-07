import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <div className="card dashboard-card">
        <p className="eyebrow">Student dashboard</p>
        <h1>Welcome back, {user?.name || 'learner'}.</h1>
        <p className="muted">Your personalized progression is ready to review.</p>

        <div className="metric-grid">
          <div className="metric-box">
            <span className="metric-label">Subject focus</span>
            <strong>Adaptive learning</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Current status</span>
            <strong>Ready</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Suggested action</span>
            <strong>Take assessment</strong>
          </div>
        </div>

        <div className="stack-row">
          <Link to="/student/assessments" className="primary-button">View assessments</Link>
          <Link to="/student/recommendations" className="secondary-button">View recommendations</Link>
        </div>
      </div>
    </div>
  );
}
