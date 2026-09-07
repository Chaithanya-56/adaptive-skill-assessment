import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentAssessments } from '../services/studentApi';

function formatTimestamp(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAssessments = async () => {
      setLoading(true);
      setError('');

      try {
        const list = await getStudentAssessments();
        setAssessments(list);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load your assessment history.');
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, []);

  return (
    <div className="page-shell">
      <div className="card list-card">
        <p className="eyebrow">Assessments</p>
        <h1>Assessment history</h1>

        {loading ? (
          <div className="inline-status">Loading your assessments...</div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : assessments.length === 0 ? (
          <div className="empty-state">
            <p>No assessments yet. Start a subject assessment to begin tracking your progress.</p>
          </div>
        ) : (
          <div className="list-stack">
            {assessments.map((assessment) => {
              const isCompleted = assessment.status === 'COMPLETED';
              const route = isCompleted
                ? `/student/assessment/${assessment.assessment_id}/results`
                : `/student/assessment/${assessment.assessment_id}`;

              return (
                <div key={assessment.assessment_id} className="list-item">
                  <div className="list-item-header">
                    <div>
                      <h3>{assessment.subject_name || 'Assessment'}</h3>
                      <small>{isCompleted ? 'Completed' : 'In progress'}</small>
                    </div>
                    <span className="chip chip-priority">{assessment.status}</span>
                  </div>

                  <div className="assessment-meta-row">
                    <span>{assessment.total_questions ?? 0} questions</span>
                    <span>{isCompleted ? `${assessment.score ?? 0}/${assessment.total_questions ?? 0} correct` : 'Not submitted yet'}</span>
                    <span>{isCompleted ? `${assessment.percentage ?? 0}%` : '—'}</span>
                  </div>

                  <div className="meta-row">
                    <span>Started: {formatTimestamp(assessment.started_at)}</span>
                    <span>{isCompleted ? `Submitted: ${formatTimestamp(assessment.submitted_at)}` : 'Awaiting submission'}</span>
                  </div>

                  <div className="stack-row dashboard-actions">
                    <Link to={route} className="primary-button">
                      {isCompleted ? 'View Results' : 'Continue Assessment'}
                    </Link>
                    <Link to="/student/subjects" className="secondary-button">Start another</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="stack-row dashboard-actions">
          <Link to="/student/subjects" className="primary-button">Start an assessment</Link>
          <Link to="/student/dashboard" className="secondary-button">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
