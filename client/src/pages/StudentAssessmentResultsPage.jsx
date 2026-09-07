import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAssessmentResults } from '../services/studentApi';

export default function StudentAssessmentResultsPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getAssessmentResults(assessmentId);
        setResult(data);
      } catch (fetchError) {
        const status = fetchError?.response?.status;
        const message = fetchError?.response?.data?.message || 'Unable to load the assessment result.';

        if (status === 404) {
          setError('This assessment result could not be found.');
        } else if (status === 403) {
          setError('You do not have permission to view this assessment result.');
        } else if (status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchResult();
    }
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>Loading results...</h1>
          <p className="muted">Fetching your assessment outcome.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="card error-card">
          <h1>Result unavailable</h1>
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={() => navigate('/student/assessments')}>
            Back to assessments
          </button>
        </div>
      </div>
    );
  }

  const assessment = result?.assessment || {};
  const topicPerformance = result?.topic_performance || [];
  const recommendations = result?.recommendations || [];
  const answers = result?.answers || [];

  return (
    <div className="page-shell">
      <div className="card result-card">
        <p className="eyebrow">Assessment result</p>
        <h1>{assessment.status || 'Completed'}</h1>

        <div className="metric-grid result-grid">
          <div className="metric-box">
            <span className="metric-label">Score</span>
            <strong>{assessment.score ?? 0} / {assessment.total_questions ?? 0}</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Percentage</span>
            <strong>{assessment.percentage ?? 0}%</strong>
          </div>
          <div className="metric-box">
            <span className="metric-label">Level</span>
            <strong>{assessment.assessment_level || 'N/A'}</strong>
          </div>
        </div>

        {topicPerformance.length > 0 && (
          <div className="result-section">
            <h2>Topic performance</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Correct</th>
                    <th>Wrong</th>
                    <th>%</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {topicPerformance.map((row) => (
                    <tr key={row.topic_performance_id || row.topic_id}>
                      <td>{row.topic_name || 'Unknown topic'}</td>
                      <td>{row.correct_count ?? 0}</td>
                      <td>{row.wrong_count ?? 0}</td>
                      <td>{row.percentage ?? 0}%</td>
                      <td>{row.performance_level || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="result-section">
            <h2>Recommendations</h2>
            <ul className="info-list">
              {recommendations.map((entry) => (
                <li key={entry.recommendation_id || entry.topic_id}>
                  <strong>{entry.topic_name || 'Topic'}:</strong> {entry.recommendation_text} <em>({entry.priority_level})</em>
                </li>
              ))}
            </ul>
          </div>
        )}

        {answers.length > 0 && (
          <div className="result-section">
            <h2>Answer review</h2>
            <div className="answer-review-list">
              {answers.map((answer, index) => (
                <div key={`${answer.question_id || index}-${index}`} className="review-item">
                  <h3>Q{index + 1}: {answer.question_text}</h3>
                  <p><strong>Your answer:</strong> {answer.selected_option || 'Not answered'}</p>
                  <p><strong>Correct answer:</strong> {answer.correct_option || 'N/A'}</p>
                  <p><strong>Result:</strong> {answer.is_correct ? 'Correct' : 'Incorrect'}</p>
                  {answer.explanation && <p><strong>Explanation:</strong> {answer.explanation}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="stack-row result-actions">
          <Link to="/student/assessments" className="primary-button">Back to assessments</Link>
          <Link to="/student/recommendations" className="secondary-button">View recommendations</Link>
        </div>
      </div>
    </div>
  );
}
