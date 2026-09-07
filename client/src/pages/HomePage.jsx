import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div className="page-shell hero-shell">
      <div className="card hero-card">
        <p className="eyebrow">Adaptive learning</p>
        <h1>Personalized skill assessment for every learner.</h1>
        <p className="muted">
          Measure strengths, identify weak areas, and recommend the next best learning steps based on real performance analytics.
        </p>

        {isAuthenticated ? (
          <div className="stack-row">
            <Link to={dashboardPath} className="primary-button">Go to dashboard</Link>
          </div>
        ) : (
          <div className="stack-row">
            <Link to="/register" className="primary-button">Create account</Link>
            <Link to="/login" className="secondary-button">Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
