import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestions, getSubjects, getTopicsBySubject } from '../services/adminApi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalSubjects: 0, totalTopics: 0, totalQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError('');

        const subjects = await getSubjects();
        const questions = await getQuestions();
        const topicTotals = await Promise.all(
          subjects.map((subject) => getTopicsBySubject(subject.subject_id))
        );

        const totalTopics = topicTotals.reduce(
          (sum, topicList) => sum + (Array.isArray(topicList) ? topicList.length : 0),
          0
        );

        setStats({
          totalSubjects: subjects.length,
          totalTopics: totalTopics,
          totalQuestions: questions.length,
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="page-shell">
      <div className="card dashboard-card">
        <p className="eyebrow">Admin dashboard</p>
        <h1>Welcome, {user?.name || 'admin'}.</h1>
        <p className="muted">Manage subjects, questions, and assessment content.</p>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="inline-status">Loading dashboard metrics…</div>
        ) : (
          <div className="metric-grid">
            <div className="metric-box">
              <span className="metric-label">Subjects</span>
              <strong>{stats.totalSubjects}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Topics</span>
              <strong>{stats.totalTopics}</strong>
            </div>
            <div className="metric-box">
              <span className="metric-label">Questions</span>
              <strong>{stats.totalQuestions}</strong>
            </div>
          </div>
        )}

        <div className="stack-row">
          <Link to="/admin/subjects" className="primary-button">Manage subjects</Link>
          <Link to="/admin/questions" className="secondary-button">Manage questions</Link>
        </div>
      </div>
    </div>
  );
}
