import { Link } from 'react-router-dom';

export default function StudentAssessmentsPage() {
  return (
    <div className="page-shell">
      <div className="card">
        <p className="eyebrow">Assessments</p>
        <h1>Assessment history</h1>
        <p className="muted">
          The current backend does not expose a student assessment list endpoint, so there is no history API to fetch here.
          Start a subject assessment from the subjects page or continue an in-progress attempt from the assessment route when available.
        </p>

        <div className="stack-row dashboard-actions">
          <Link to="/student/subjects" className="primary-button">Start an assessment</Link>
          <Link to="/student/dashboard" className="secondary-button">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
