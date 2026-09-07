import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLearningSummary, getStudentRecommendations, getSubjects } from '../services/studentApi';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [subjectList, summaryData, recommendationList] = await Promise.all([
          getSubjects(),
          getLearningSummary(),
          getStudentRecommendations(),
        ]);

        setSubjects(subjectList);
        setSummary(summaryData);
        setRecommendations(recommendationList);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load your dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const weakTopics = summary?.weak_topics || [];

  return (
    <div className="page-shell">
      <div className="card dashboard-card">
        <p className="eyebrow">Student dashboard</p>
        <h1>Welcome back, {user?.name || 'learner'}.</h1>
        <p className="muted">Track your current skill profile and continue your learning path.</p>

        {loading ? (
          <div className="inline-status">Loading dashboard data...</div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <>
            <div className="metric-grid">
              <div className="metric-box">
                <span className="metric-label">Available subjects</span>
                <strong>{subjects.length}</strong>
              </div>
              <div className="metric-box">
                <span className="metric-label">Completed assessments</span>
                <strong>{summary?.total_completed_assessments ?? 0}</strong>
              </div>
              <div className="metric-box">
                <span className="metric-label">Average score</span>
                <strong>{summary?.overall_average_percentage ?? 0}%</strong>
              </div>
            </div>

            {weakTopics.length > 0 && (
              <div className="result-section smaller-gap">
                <h2>Focus areas</h2>
                <ul className="info-list compact-list">
                  {weakTopics.slice(0, 3).map((topic) => (
                    <li key={topic.topic_id}><strong>{topic.topic_name}</strong> — {topic.latest_percentage}%</li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="result-section smaller-gap">
                <h2>Latest recommendations</h2>
                <ul className="info-list compact-list">
                  {recommendations.slice(0, 3).map((item) => (
                    <li key={item.recommendation_id}><strong>{item.topic_name || 'Topic'}</strong> — {item.recommendation_text}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="stack-row dashboard-actions">
          <Link to="/student/subjects" className="primary-button">Start assessment</Link>
          <Link to="/student/assessments" className="secondary-button">View assessments</Link>
          <Link to="/student/recommendations" className="secondary-button">View recommendations</Link>
        </div>
      </div>
    </div>
  );
}
